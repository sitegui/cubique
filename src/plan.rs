mod cost;

use crate::divider::Divider;
use crate::{Action, State};
use std::collections::hash_map::Entry;
use std::collections::{HashMap, HashSet, VecDeque};
use std::fmt::{Display, Formatter};

#[derive(Debug, Clone)]
pub struct Plan {
    start: State,
    plans: HashMap<State, PlanBranch>,
}

#[derive(Debug, Clone, Copy)]
pub enum PlanBranch {
    Solved,
    Pending,
    Throw {
        next: State,
    },
    Map {
        units: u16,
        sub_problem: State,
        remaining: Option<State>,
    },
}

#[derive(Debug, Clone, Copy)]
pub enum ApplyError {
    StateDoesNotExist,
    StateNotPending,
    MapDoesNotDivide,
}

impl Plan {
    pub fn new(start: State) -> Self {
        let mut plan = Plan {
            start,
            plans: HashMap::default(),
        };
        plan.ensure_state(start);
        plan
    }

    pub fn possible_actions(&self, divider: &Divider) -> Vec<(State, Action)> {
        let mut actions = Vec::new();

        for (&state, branch) in &self.plans {
            if matches!(branch, PlanBranch::Pending) {
                actions.push((state, Action::Throw));

                for &units in divider.divisors(state.target) {
                    if units > state.units {
                        break;
                    }

                    actions.push((state, Action::Map(units)));
                }
            }
        }

        actions
    }

    pub fn apply(&mut self, state: State, action: Action) -> Result<(), ApplyError> {
        match self.plans.get(&state) {
            None => Err(ApplyError::StateDoesNotExist),
            Some(prev_entry) => {
                if !matches!(prev_entry, PlanBranch::Pending) {
                    return Err(ApplyError::StateNotPending);
                }

                let branch = match action {
                    Action::Throw => PlanBranch::Throw {
                        next: self.ensure_state(State {
                            source: state.source,
                            target: state.target,
                            units: state.units * state.source,
                        }),
                    },
                    Action::Map(units) => {
                        if state.target % units != 0 {
                            return Err(ApplyError::MapDoesNotDivide);
                        }

                        let sub_problem = self.ensure_state(State {
                            source: state.source,
                            target: state.target / units,
                            units: 1,
                        });

                        let remaining_units = state.units - units;
                        let remaining = (remaining_units > 0).then(|| {
                            self.ensure_state(State {
                                source: state.source,
                                target: state.target,
                                units: remaining_units,
                            })
                        });

                        PlanBranch::Map {
                            units,
                            sub_problem,
                            remaining,
                        }
                    }
                };

                self.plans.insert(state, branch);
                Ok(())
            }
        }
    }

    pub fn start(&self) -> State {
        self.start
    }

    pub fn plans(&self) -> &HashMap<State, PlanBranch> {
        &self.plans
    }

    fn ensure_state(&mut self, state: State) -> State {
        if let Entry::Vacant(vacant) = self.plans.entry(state) {
            vacant.insert(if state.solved() {
                PlanBranch::Solved
            } else {
                PlanBranch::Pending
            });
        }
        state
    }
}

impl Display for Plan {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        writeln!(
            f,
            "Plan for {}: {}/{}",
            self.start.source, self.start.units, self.start.target
        )?;

        let mut displayed = HashSet::new();

        let mut to_display = VecDeque::new();
        to_display.push_back(self.start);

        while let Some(state) = to_display.pop_front() {
            write!(f, "{}/{} -> ", state.units, state.target)?;
            match self.plans[&state] {
                PlanBranch::Solved => {
                    writeln!(f, "solved")?;
                }
                PlanBranch::Pending => {
                    writeln!(f, "pending")?;
                }
                PlanBranch::Throw { next } => {
                    writeln!(f, "throw to {}/{}", next.units, next.target)?;
                    if displayed.insert(next) {
                        to_display.push_back(next);
                    }
                }
                PlanBranch::Map {
                    units,
                    sub_problem,
                    remaining,
                } => {
                    write!(
                        f,
                        "map {} to {}/{}",
                        units, sub_problem.units, sub_problem.target
                    )?;
                    if displayed.insert(sub_problem) {
                        to_display.push_back(sub_problem);
                    }
                    if let Some(remaining) = remaining {
                        write!(f, " and {}/{}", remaining.units, remaining.target)?;
                        if displayed.insert(remaining) {
                            to_display.push_back(remaining);
                        }
                    }
                    writeln!(f)?;
                }
            }
        }

        Ok(())
    }
}
