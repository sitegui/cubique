import { Problem, ValidActionReduce, ValidActionRethrow, ValidActionTryReduce } from './Problem.mjs'
import { StrategyGraph } from './Strategy.mjs'
import { Artist } from './Artist.mjs'
import Vue from './Vue.mjs'

Vue.component('cubique-strategy', {
  props: {
    startSize: Number,
    targetSize: Number
  },
  data () {
    return {
      artist: null,
      selectedProblemSvg: null,
      selectedNode: null,
      validActions: []
    }
  },
  template: '#cubique-strategy',
  mounted () {
    const problem = new Problem(this.startSize, this.targetSize)
    const graph = new StrategyGraph(problem)
    this.artist = new Artist(graph, this.$refs.svg, (problemSvg, node) => {
      problemSvg.classList.add('problem')
      problemSvg.onclick = () => this.problemClicked(problemSvg, node)
    })
    this.redraw()
  },
  methods: {
    /**
     * @param {SVGGraphicsElement} problemSvg
     * @param {StrategyNode} node
     */
    problemClicked (problemSvg, node) {
      if (this.selectedProblemSvg) {
        this.selectedProblemSvg.classList.remove('selected')
      }
      this.selectedProblemSvg = problemSvg
      this.selectedProblemSvg.classList.add('selected')

      this.selectedNode = node

      this.validActions = node.problem.listValidActions().map(action => {
        if (action instanceof ValidActionRethrow) {
          return {
            text: 'Rethrow',
            callback: () => node.rethrow()
          }
        } else if (action instanceof ValidActionReduce) {
          return {
            text: `Reduce by ${action.factor}`,
            callback: () => node.reduce(action.factor)
          }
        } else if (action instanceof ValidActionTryReduce) {
          return {
            text: `Try to reduce by ${action.currentFactor} ⇒ ${action.targetFactor} (error rate = ${action.errRate})`,
            callback: () => node.tryReduce(action.currentFactor, action.targetFactor)
          }
        }
      })
    },

    /**
     * @param {{text: string, callback: function():void}} action
     */
    applyAction (action) {
      action.callback()
      this.redraw()
    },

    /**
     */
    redraw () {
      this.artist.graph.updateCosts()
      this.artist.draw()
      this.selectedNode = null
      this.selectedProblemSvg = null
      this.validActions = []
    }
  }
})

export function start () {
  // eslint-disable-next-line no-unused-vars
  const app = new Vue({
    el: '#app',
    data: {
      newStrategy: {
        startSize: 12,
        targetSize: 21
      },
      strategies: []
    },
    methods: {
      createStrategy () {
        this.strategies.push({
          startSize: Number(this.newStrategy.startSize),
          targetSize: Number(this.newStrategy.targetSize),
          key: String(Math.random())
        })
      }
    }
  })
}
