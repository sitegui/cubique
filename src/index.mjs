import { Problem } from './Problem.mjs'
import { StrategyGraph } from './Strategy.mjs'

const myProblem = new Problem(12, 21)

const naiveStrategy = new StrategyGraph(myProblem)
naiveStrategy.solveNaive()
console.log(naiveStrategy.toString())

const okStrategy = new StrategyGraph(myProblem)
okStrategy.solve()
console.log(okStrategy.toString())
