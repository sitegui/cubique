import { Problem, ValidActionReduce, ValidActionRethrow, ValidActionTryReduce } from './Problem.mjs'
import { ChildNewNode, StrategyGraph } from './Strategy.mjs'
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
    this.artist = new Artist(graph, this.$refs.svg)
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
            callback: () => {
              const child = node.rethrow().child
              if (child instanceof ChildNewNode) {
                return [child.node]
              } else {
                return []
              }
            }
          }
        } else if (action instanceof ValidActionReduce) {
          return {
            text: `Reduce by ${action.factor}`,
            callback: () => {
              const child = node.reduce(action.factor).child
              if (child instanceof ChildNewNode) {
                return [child.node]
              } else {
                return []
              }
            }
          }
        } else if (action instanceof ValidActionTryReduce) {
          return {
            text: `Try to reduce by ${action.factor} (error rate = ${action.errRate})`,
            callback: () => {
              const newAction = node.tryReduce(action.factor)
              if (newAction.errChild instanceof ChildNewNode) {
                return [newAction.errChild.node, newAction.okNode]
              } else {
                return [newAction.okNode]
              }
            }
          }
        }
      })
    },

    /**
     * @param {{text: string, callback: function():void}} action
     */
    applyAction (action) {
      const newNodes = action.callback()
      this.redraw()
      for (const node of newNodes) {
        if (!node.problem.isSolved()) {
          this.problemClicked(this.artist.problemSvgByStrategyNode.get(node), node)
          return
        }
      }
    },

    /**
     */
    redraw () {
      this.artist.graph.updateCosts()
      this.artist.draw()
      this.selectedNode = null
      this.selectedProblemSvg = null
      this.validActions = []
      this.artist.graph.visitNodes(node => {
        const problemSvg = this.artist.problemSvgByStrategyNode.get(node)
        problemSvg.classList.add('problem')
        problemSvg.onclick = () => this.problemClicked(problemSvg, node)
      })
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
