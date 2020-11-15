import { Problem } from './Problem.mjs'
import { StrategyGraph } from './Strategy.mjs'
import { Artist } from './Artist.mjs'

const myProblem = new Problem(12, 21)

const naiveStrategy = new StrategyGraph(myProblem)
naiveStrategy.solveNaive()
naiveStrategy.updateCosts()

const okStrategy = new StrategyGraph(myProblem)
okStrategy.solve()
okStrategy.updateCosts()

const dummyStrategy = new StrategyGraph(myProblem)
dummyStrategy.findAnOpenNode().rethrow()
dummyStrategy.findAnOpenNode().tryReduce(144, 7)
dummyStrategy.findAnOpenNode().rethrow()
dummyStrategy.updateCosts()

new Artist(naiveStrategy, document.getElementById('graph')).draw()
new Artist(okStrategy, document.getElementById('graph2')).draw()
new Artist(dummyStrategy, document.getElementById('graph3')).draw()
