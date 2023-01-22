mod divider;
mod heuristic_cache;
mod plan;

use crate::divider::Divider;
use crate::heuristic_cache::HeuristicCache;
use itertools::Itertools;
use plan::{Plan, PlanBranch};
use std::collections::{HashSet, VecDeque};
use std::fmt::{Display, Formatter};
use std::fs;
use std::rc::Rc;
use tracing::Level;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
pub struct State {
    source: u32,
    target: u32,
    units: u32,
}

#[derive(Debug, Clone, Copy)]
pub enum Action {
    /// Throw one more time
    Throw,
    /// Map this many units to a sub problem
    Map(u32),
}

impl State {
    fn new(source: u32, target: u32) -> Self {
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
    tracing_subscriber::fmt().with_max_level(Level::INFO).init();

    let start = State::new(6, 8);
    let mut heuristic = HeuristicCache::new(naive_solver);
    let best = best_solver(start, |_| 0.0);
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
        .find(|(_, plan)| matches!(plan, PlanBranch::Pending { .. }))
    {
        if pending.units < pending.target {
            plan.apply(pending, Action::Throw).unwrap();
        } else {
            plan.apply(pending, Action::Map(pending.target)).unwrap();
        }
    }

    plan
}

fn best_solver(start: State, mut heuristic: impl FnMut(State) -> f64) -> Plan {
    let mut visited_plans = HashSet::new();
    let divider = Divider::new(start.target);
    let mut pending = VecDeque::new();

    let base_plan = Rc::new(Plan::new(start));
    for (state, action) in base_plan.possible_actions(&divider) {
        pending.push_back((base_plan.clone(), state, action));
    }

    let mut best_plan = Rc::new(naive_solver(start));
    let mut best_cost = best_plan.exact_cost().unwrap();
    tracing::info!("Initial cost is {:?}", best_cost);

    let mut i = 0;
    while let Some((mut plan, state, action)) = pending.pop_front() {
        tracing::debug!("Will apply {:?} to {}", action, state);
        Rc::make_mut(&mut plan).apply(state, action).unwrap();
        tracing::trace!("Got new plan:\n{}", plan);
        let cost = plan.cost(&mut heuristic);
        tracing::debug!("Cost is {:?}", cost);

        if visited_plans.insert(plan.to_string()) && cost.value <= best_cost {
            for (state, action) in plan.possible_actions(&divider) {
                pending.push_back((plan.clone(), state, action));
            }
        }

        if !cost.estimated && cost.value < best_cost {
            tracing::info!("Found better plan with cost {:?}", cost);
            best_plan = plan.clone();
            best_cost = cost.value;
        }

        i += 1;

        if i % 100_000 == 0 {
            tracing::info!(
                "Iteration {}: queue size is {}, visited {} plans",
                i,
                pending.len(),
                visited_plans.len()
            );

            fs::write("plans.txt", visited_plans.iter().format("\n\n").to_string()).unwrap();
            panic!("done");
        }
    }

    Rc::try_unwrap(best_plan).unwrap()
}

impl Display for State {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}/{}", self.units, self.target)
    }
}
