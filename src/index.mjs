import { Problem } from './Problem.mjs'
import { StrategyGraph } from './Strategy.mjs'

const myProblem = new Problem(12, 21)

console.log(myProblem)

const strategy = new StrategyGraph(myProblem)
strategy.solveNaive()
console.log(strategy)

console.log(strategy.toString())
