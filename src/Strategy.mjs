import { greatestCommonDivisor } from './divisors.mjs'

export class ActionRethrow {
  /**
   * @param {StrategyNode} child
   */
  constructor (child) {
    this.child = child
  }

  toString () {
    return `rethrow to get ${this.child.problem}`
  }
}

export class ActionReduce {
  /**
   * @param {number} factor
   * @param {StrategyNode} child
   */
  constructor (factor, child) {
    this.factor = factor
    this.child = child
  }

  toString () {
    return `reduce by ${this.factor} to get ${this.child.problem}`
  }
}

export class ActionTryReduce {
  /**
   * @param {number} currentFactor
   * @param {number} targetFactor
   * @param {number} errRate
   * @param {StrategyNode} okChild
   * @param {StrategyNode} errChild
   */
  constructor (currentFactor, targetFactor, errRate, okChild, errChild) {
    this.currentFactor = currentFactor
    this.targetFactor = targetFactor
    this.errRate = errRate
    this.okChild = okChild
    this.errChild = errChild
  }

  toString () {
    return `try to reduce by ${this.currentFactor} -> ${this.targetFactor} to get ${this.okChild.problem}. If not, get ${this.errChild.problem}`
  }
}

export class StrategyNode {
  /**
   * @param {StrategyGraph} graph
   * @param {StrategyNode|null} parent
   * @param {Problem} problem
   * @param {?ActionRethrow|ActionReduce|ActionTryReduce} action
   */
  constructor (graph, parent, problem, action) {
    this.graph = graph
    this.parent = parent
    this.problem = problem
    this.action = action
  }

  /**
   * Replace the current action by a rethrow
   * @returns {ActionRethrow}
   */
  rethrow () {
    this._clearAction()
    const action = new ActionRethrow(this._constructOrRetrieveForProblem(this.problem.rethrow(), this))
    this.action = action
    this.graph.openNodes.delete(this)
    return action
  }

  /**
   * Replace the current action by a removal a common factor from each side
   * @param factor
   * @returns {ActionReduce}
   */
  reduce (factor) {
    this._clearAction()
    const action = new ActionReduce(factor, this._constructOrRetrieveForProblem(this.problem.reduce(factor), this))
    this.action = action
    this.graph.openNodes.delete(this)
    return action
  }

  /**
   * Replace the current action by an imperfect match between factor from each side
   * @param currentFactor
   * @param targetFactor
   * @returns {ActionTryReduce}
   */
  tryReduce (currentFactor, targetFactor) {
    this._clearAction()
    const { err, errRate, ok } = this.problem.tryReduce(currentFactor, targetFactor)
    const action = new ActionTryReduce(
      currentFactor,
      targetFactor,
      errRate,
      this._constructOrRetrieveForProblem(ok, this),
      this._constructOrRetrieveForProblem(err, this))
    this.action = action
    this.graph.openNodes.delete(this)
    return action
  }

  toString () {
    return `${this.problem} => ${this.action}`
  }

  /**
   * Clear the current action, keep invariants on the graph as well
   */
  _clearAction () {
    if (this.action !== null) {
      this.action = null
      this.graph.updateOpenNodes()
    }
  }

  /**
   * Return the closest ascendant or even itself that has the given problem. If not found, create a new child node.
   * @param {Problem} problem
   * @param {StrategyNode} originalParent
   * @returns {StrategyNode}
   * @private
   */
  _constructOrRetrieveForProblem (problem, originalParent) {
    if (this.problem.isEqual(problem)) {
      return this
    } else if (this.parent !== null) {
      return this.parent._constructOrRetrieveForProblem(problem, originalParent)
    } else {
      const node = new StrategyNode(this.graph, originalParent, problem, null)
      if (!node.problem.isSolved()) {
        this.graph.openNodes.add(node)
      }
      return node
    }
  }
}

export class StrategyGraph {
  /**
   * @param {Problem} rootProblem
   */
  constructor (rootProblem) {
    this.root = new StrategyNode(this, null, rootProblem, null)
    /**
     * Reference all nodes that need to be solved, that is, they do not have an associated action and the problem is
     * unsolved.
     * @type {Set<StrategyNode>}
     */
    this.openNodes = new Set(rootProblem.isSolved() ? [] : [this.root])
  }

  /**
   * Apply a function to all nodes once
   * @param {function} callback
   */
  visitNodes (callback) {
    const visited = new Set()

    function maybeVisit (node) {
      if (visited.has(node)) {
        return
      }

      visited.add(node)
      callback(node)

      const action = node.action
      if (action instanceof ActionRethrow) {
        maybeVisit(action.child)
      } else if (action instanceof ActionReduce) {
        maybeVisit(action.child)
      } else if (action instanceof ActionTryReduce) {
        maybeVisit(action.okChild)
        maybeVisit(action.errChild)
      }
    }

    maybeVisit(this.root)
  }

  /**
   * Update the list of open problems
   * @private
   */
  updateOpenNodes () {
    this.openNodes = new Set()
    this.visitNodes(node => {
      if (node.action === null && !node.problem.isSolved()) {
        this.openNodes.add(node)
      }
    })
  }

  /**
   * Solve the open problems with a naive strategy: rethrow until a full reduction can be tried
   */
  solveNaive () {
    while (this.openNodes.size > 0) {
      const node = this.openNodes.values().next().value

      if (node.problem.currentSize < node.problem.targetSize) {
        node.rethrow()
      } else {
        node.tryReduce(node.problem.currentSize, node.problem.targetSize)
      }
    }
  }

  /**
   * Solve the open problems with a rather ok strategy, by doing the first possible action:
   * 1. reduce by the greatest common factor
   * 2. try to reduce fully
   * 3. rethrow
   */
  solve () {
    while (this.openNodes.size > 0) {
      const node = this.openNodes.values().next().value

      const gcd = greatestCommonDivisor(node.problem.currentSize, node.problem.targetSize)
      if (gcd !== 1) {
        node.reduce(gcd)
      } else if (node.problem.currentSize < node.problem.targetSize) {
        node.rethrow()
      } else {
        node.tryReduce(node.problem.currentSize, node.problem.targetSize)
      }
    }
  }

  toString () {
    const nodes = []
    this.visitNodes(node => {
      nodes.push(node.toString())
    })
    return nodes.join(',\n')
  }
}
