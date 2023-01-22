mod divider;
mod heuristic_cache;
mod plan;

use crate::divider::Divider;
use crate::heuristic_cache::HeuristicCache;
use plan::{Plan, PlanBranch};
use std::collections::VecDeque;
use std::fmt::{write, Display, Formatter};
use std::rc::Rc;
use tracing::Level;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct State {
    source: u16,
    target: u16,
    units: u16,
}

#[derive(Debug, Clone, Copy)]
pub enum Action {
    /// Throw one more time
    Throw,
    /// Map this many units to a sub problem
    Map(u16),
}

impl State {
    fn new(source: u16, target: u16) -> Self {
        State {
            source,
            target,
            units: 1,
        }
    }

    fn solved(self) -> bool {
        self.target == 1
    }
}

fn main() {
    tracing_subscriber::fmt()
        .with_max_level(Level::TRACE)
        .init();

    let start = State::new(2, 6);
    let mut heuristic = HeuristicCache::new(naive_solver);
    let best = best_solver(start, |state| heuristic.calculate(state));
    let heuristic_cost = heuristic.calculate(start);
    let cost = best.exact_cost().unwrap();
    println!("{}", best);
    println!("Heuristic cost = {}", heuristic_cost);
    println!("Cost = {}", cost);
}

fn naive_solver(state: State) -> Plan {
    tracing::debug!("Naive solver for {}", state);
    let mut plan = Plan::new(state);

    while let Some((&pending, _)) = plan
        .plans()
        .iter()
        .find(|(_, plan)| matches!(plan, PlanBranch::Pending))
    {
        if pending.units < pending.target {
            plan.apply(pending, Action::Throw).unwrap();
        } else {
            plan.apply(pending, Action::Map(pending.target)).unwrap();
        }
    }

    plan
}

fn best_solver(start: State, mut heuristic: impl FnMut(State) -> f32) -> Plan {
    let divider = Divider::new(start.target);
    let mut pending = VecDeque::new();

    let base_plan = Rc::new(Plan::new(start));
    for (state, action) in base_plan.possible_actions(&divider) {
        pending.push_back((base_plan.clone(), state, action));
    }

    let mut best_plan = base_plan;
    let mut best_cost = best_plan.cost(&mut heuristic);
    tracing::info!("Initial cost is {:?}", best_cost);

    while let Some((mut plan, state, action)) = pending.pop_front() {
        tracing::debug!("Will apply {:?} to {}", action, state);
        let new_plan = Rc::make_mut(&mut plan);
        new_plan.apply(state, action).unwrap();
        tracing::trace!("Got new plan:\n{}", new_plan);
        let cost = new_plan.cost(&mut heuristic);
        tracing::debug!("Cost is {:?}", cost);

        if cost.value <= best_cost.value {
            for (state, action) in plan.possible_actions(&divider) {
                pending.push_back((plan.clone(), state, action));
            }
        }

        if cost.value < best_cost.value
            || (cost.value == best_cost.value && !cost.estimated && best_cost.estimated)
        {
            tracing::info!("Found better plan with cost {:?}", cost);
            best_plan = plan.clone();
            best_cost = cost;
        }
    }

    Rc::try_unwrap(best_plan).unwrap()
}

impl Display for State {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}/{}", self.units, self.target)
    }
}
