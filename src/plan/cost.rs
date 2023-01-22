use crate::plan::{Plan, PlanBranch};
use crate::State;
use std::collections::HashSet;

#[derive(Debug, Clone, Copy)]
struct InnerPlanCost {
    estimated: bool,
    value: InnerPlanCostValue,
}

#[derive(Debug, Clone, Copy, PartialEq)]
enum InnerPlanCostValue {
    NonCycle(f32),
    /// The cycle cost expressed as `a * x + b`, where `cost(base) = x`
    Cycle {
        base: State,
        a: f32,
        b: f32,
    },
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PlanCost {
    pub estimated: bool,
    pub value: f32,
}

impl Plan {
    pub fn exact_cost(&self) -> Option<f32> {
        let cost = self.cost(|_| 0.0);

        (!cost.estimated).then_some(cost.value)
    }

    pub fn cost(&self, mut heuristic: impl FnMut(State) -> f32) -> PlanCost {
        self.cost_for(self.start, &mut heuristic)
    }

    fn cost_for(&self, state: State, heuristic: &mut impl FnMut(State) -> f32) -> PlanCost {
        let cost = self.inner_cost(&mut HashSet::new(), state, heuristic);

        match cost.value {
            InnerPlanCostValue::NonCycle(value) => PlanCost {
                estimated: cost.estimated,
                value,
            },
            _ => unreachable!("All cycle must have been solved"),
        }
    }

    fn inner_cost(
        &self,
        visited_branching: &mut HashSet<State>,
        state: State,
        heuristic: &mut impl FnMut(State) -> f32,
    ) -> InnerPlanCost {
        match self.plans[&state] {
            PlanBranch::Solved => InnerPlanCost::exact(0.0),
            PlanBranch::Pending => InnerPlanCost::estimated(heuristic(state)),
            PlanBranch::Throw { next } => {
                self.inner_throw_cost(visited_branching, state, heuristic, next)
            }
            PlanBranch::Map {
                units,
                sub_problem,
                remaining,
            } => self.inner_map_cost(
                visited_branching,
                state,
                heuristic,
                units,
                sub_problem,
                remaining,
            ),
        }
    }

    fn inner_throw_cost(
        &self,
        visited_branching: &mut HashSet<State>,
        state: State,
        heuristic: &mut impl FnMut(State) -> f32,
        next: State,
    ) -> InnerPlanCost {
        if !visited_branching.insert(state) {
            return InnerPlanCost::cycle_start(state);
        }

        let next_cost = self.inner_cost(visited_branching, next, heuristic);
        let this_value = next_cost.value.solve_linear_equation(state, 1.0, 1.0);

        InnerPlanCost {
            estimated: next_cost.estimated,
            value: this_value,
        }
    }

    fn inner_map_cost(
        &self,
        visited_branching: &mut HashSet<State>,
        state: State,
        mut heuristic: &mut impl FnMut(State) -> f32,
        units: u16,
        sub_problem: State,
        remaining: Option<State>,
    ) -> InnerPlanCost {
        if !visited_branching.insert(state) {
            return InnerPlanCost::cycle_start(state);
        }

        let sub_cost = self.cost_for(sub_problem, heuristic);

        match remaining {
            None => InnerPlanCost {
                estimated: sub_cost.estimated,
                value: InnerPlanCostValue::NonCycle(sub_cost.value),
            },
            Some(remaining) => {
                let ratio = units as f32 / state.units as f32;
                let remaining_cost = self.inner_cost(visited_branching, remaining, heuristic);
                let this_value = remaining_cost.value.solve_linear_equation(
                    state,
                    1.0 - ratio,
                    ratio * sub_cost.value,
                );

                InnerPlanCost {
                    estimated: sub_cost.estimated || remaining_cost.estimated,
                    value: this_value,
                }
            }
        }
    }
}

impl InnerPlanCost {
    fn exact(value: f32) -> Self {
        InnerPlanCost {
            estimated: false,
            value: InnerPlanCostValue::NonCycle(value),
        }
    }

    fn estimated(value: f32) -> Self {
        InnerPlanCost {
            estimated: true,
            value: InnerPlanCostValue::NonCycle(value),
        }
    }

    fn cycle_start(base: State) -> Self {
        InnerPlanCost {
            estimated: false,
            value: InnerPlanCostValue::Cycle {
                base,
                a: 1.0,
                b: 0.0,
            },
        }
    }
}

impl InnerPlanCostValue {
    /// Solve the equation `x = p * self + q` for `x`, where `self` may or may not depend on `x`
    fn solve_linear_equation(self, state: State, p: f32, q: f32) -> InnerPlanCostValue {
        match self {
            InnerPlanCostValue::NonCycle(z) => InnerPlanCostValue::NonCycle(p * z + q),
            InnerPlanCostValue::Cycle { base, a, b } => {
                if base != state {
                    InnerPlanCostValue::Cycle {
                        base,
                        a: a * p,
                        b: b * p + q,
                    }
                } else {
                    InnerPlanCostValue::NonCycle((b * p + q) / (1.0 - a * p))
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Action;

    #[test]
    fn solve_linear_equation() {
        let state_1 = State::new(1, 1);
        let state_2 = State::new(2, 2);

        let value = InnerPlanCostValue::NonCycle(3.0).solve_linear_equation(state_1, 4.0, 5.0);
        assert_eq!(value, InnerPlanCostValue::NonCycle(17.0));

        let value = InnerPlanCostValue::Cycle {
            base: state_2,
            a: 3.0,
            b: 4.0,
        }
        .solve_linear_equation(state_1, 5.0, 6.0);
        assert_eq!(
            value,
            InnerPlanCostValue::Cycle {
                base: state_2,
                a: 15.0,
                b: 26.0
            }
        );

        let value = InnerPlanCostValue::Cycle {
            base: state_1,
            a: 3.0,
            b: 4.0,
        }
        .solve_linear_equation(state_1, 5.0, 6.0);
        assert_eq!(value, InnerPlanCostValue::NonCycle(-26.0 / 14.0));
    }

    #[test]
    fn cost_solved() {
        let plan = Plan::new(State::new(5, 1));
        let cost = plan.cost(|_| unreachable!());
        assert_eq!(
            cost,
            PlanCost {
                estimated: false,
                value: 0.0
            }
        );
    }

    #[test]
    fn cost_pending() {
        let plan = Plan::new(State::new(5, 2));
        let cost = plan.cost(|_| 7.0);
        assert_eq!(
            cost,
            PlanCost {
                estimated: true,
                value: 7.0
            }
        );
    }

    #[test]
    fn cost_throw() {
        let state = State::new(5, 2);
        let mut plan = Plan::new(state);
        plan.apply(state, Action::Throw).unwrap();
        let cost = plan.cost(|_| 7.0);
        assert_eq!(
            cost,
            PlanCost {
                estimated: true,
                value: 8.0
            }
        );

        plan.plans.insert(
            State {
                source: 5,
                target: 2,
                units: 5,
            },
            PlanBranch::Solved,
        );
        let cost = plan.cost(|_| unreachable!());
        assert_eq!(
            cost,
            PlanCost {
                estimated: false,
                value: 1.0
            }
        );
    }

    #[test]
    fn cost_map_with_remaining() {
        let state = State {
            source: 5,
            target: 6,
            units: 17,
        };
        let sub_state = State {
            source: 5,
            target: 3,
            units: 1,
        };
        let remaining = State {
            source: 5,
            target: 6,
            units: 15,
        };

        let mut plan = Plan::new(state);
        plan.apply(state, Action::Map(2)).unwrap();

        let mut i = 0;
        let cost = plan.cost(|state| {
            if i == 0 {
                assert_eq!(state, sub_state);
                i += 1;
                10.0
            } else if i == 1 {
                assert_eq!(state, remaining);
                i += 1;
                20.0
            } else {
                unreachable!()
            }
        });
        assert_eq!(
            cost,
            PlanCost {
                estimated: true,
                value: 2.0 / 17.0 * 10.0 + 15.0 / 17.0 * 20.0
            }
        );

        plan.plans.insert(remaining, PlanBranch::Solved);
        let mut i = 0;
        let cost = plan.cost(|state| {
            if i == 0 {
                assert_eq!(state, sub_state);
                i += 1;
                10.0
            } else {
                unreachable!()
            }
        });
        assert_eq!(
            cost,
            PlanCost {
                estimated: true,
                value: 2.0 / 17.0 * 10.0
            }
        );

        plan.plans.insert(sub_state, PlanBranch::Solved);
        let cost = plan.cost(|_| unreachable!());
        assert_eq!(
            cost,
            PlanCost {
                estimated: false,
                value: 0.0
            }
        );
    }

    #[test]
    fn cost_map_without_remaining() {
        let state = State {
            source: 5,
            target: 6,
            units: 2,
        };
        let sub_state = State {
            source: 5,
            target: 3,
            units: 1,
        };

        let mut plan = Plan::new(state);
        plan.apply(state, Action::Map(2)).unwrap();

        let mut i = 0;
        let cost = plan.cost(|state| {
            if i == 0 {
                assert_eq!(state, sub_state);
                i += 1;
                10.0
            } else {
                unreachable!()
            }
        });
        assert_eq!(
            cost,
            PlanCost {
                estimated: true,
                value: 10.0
            }
        );

        plan.plans.insert(sub_state, PlanBranch::Solved);
        let cost = plan.cost(|_| unreachable!());
        assert_eq!(
            cost,
            PlanCost {
                estimated: false,
                value: 0.0
            }
        );
    }

    #[test]
    fn cycle() {
        let state = State::new(2, 3);
        let mut plan = Plan::new(state);
        plan.apply(state, Action::Throw).unwrap();
        plan.apply(
            State {
                source: 2,
                target: 3,
                units: 2,
            },
            Action::Throw,
        )
        .unwrap();
        plan.apply(
            State {
                source: 2,
                target: 3,
                units: 4,
            },
            Action::Map(3),
        )
        .unwrap();

        let cost = plan.cost(|_| unreachable!());
        assert_eq!(
            cost,
            PlanCost {
                estimated: false,
                value: 8.0 / 3.0
            }
        );
    }
}
