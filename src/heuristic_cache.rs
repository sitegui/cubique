use crate::plan::Plan;
use crate::State;
use std::collections::HashMap;

pub struct HeuristicCache<S> {
    cache: HashMap<State, f64>,
    solver: S,
}

impl<S: FnMut(State) -> Plan> HeuristicCache<S> {
    pub fn new(solver: S) -> Self {
        HeuristicCache {
            cache: Default::default(),
            solver,
        }
    }

    pub fn calculate(&mut self, state: State) -> f64 {
        *self.cache.entry(state).or_insert_with(|| {
            (self.solver)(state)
                .exact_cost()
                .expect("The solver must returned a solved plan")
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test() {
        let mut i = 0;
        let mut cache = HeuristicCache::new(|state| {
            if i == 0 {
                assert_eq!(state.source, 1);
            } else if i == 1 {
                assert_eq!(state.source, 2);
            } else {
                unreachable!()
            }

            i += 1;
            Plan::new(state)
        });

        assert_eq!(cache.calculate(State::new(1, 1)), 0.0);
        assert_eq!(cache.calculate(State::new(2, 1)), 0.0);
        assert_eq!(cache.calculate(State::new(1, 1)), 0.0);
        assert_eq!(cache.calculate(State::new(2, 1)), 0.0);
    }
}
