import { Problem } from './Problem.mjs'
import { StrategyTree } from './Strategy.mjs'

const myProblem = new Problem(12, 21)

console.log(myProblem)

console.log(StrategyTree.naiveFromProblem(myProblem))
