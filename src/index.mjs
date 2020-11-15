import { Problem } from './Problem.mjs'
import { StrategyGraph } from './Strategy.mjs'
import { Artist } from './Artist.mjs'

const myProblem = new Problem(12, 21)

const naiveStrategy = new StrategyGraph(myProblem)
naiveStrategy.solveNaive()
naiveStrategy.updateCosts()
console.log(naiveStrategy.toString())

const okStrategy = new StrategyGraph(myProblem)
okStrategy.solve()
okStrategy.updateCosts()
console.log(okStrategy.toString())

const dummyStrategy = new StrategyGraph(myProblem)
dummyStrategy.findAnOpenNode().rethrow()
dummyStrategy.findAnOpenNode().rethrow()

new Artist(dummyStrategy, document.getElementById('graph')).draw()
