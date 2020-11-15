import { Problem } from './Problem.mjs'
import { StrategyGraph } from './Strategy.mjs'
import { Artist } from './Artist.mjs'
import Vue from './Vue.mjs'

Vue.component('cubique-strategy', {
  props: ['startSize', 'targetSize'],
  data () {
    return {
      artist: null
    }
  },
  template: '#cubique-strategy',
  mounted () {
    const problem = new Problem(this.startSize, this.targetSize)
    const graph = new StrategyGraph(problem)
    this.artist = new Artist(graph, this.$refs.svg, (problem, node) => {
      problem.classList.add('problem')
      problem.onclick = () => this.problemClicked(problem, node)
    })
    this.artist.draw()
  },
  methods: {
    /**
     * @param {Problem} problem
     * @param {StrategyNode} node
     */
    problemClicked (problem, node) {
      node.rethrow()
      this.artist.draw()
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
          startSize: this.newStrategy.startSize,
          targetSize: this.newStrategy.targetSize,
          key: String(Math.random())
        })
      }
    }
  })
}
