import { greatestCommonDivisor } from './divisors.mjs'

export class ChildNewNode {
  /**
   * @param {StrategyNode} node
   */
  constructor (node) {
    this.node = node
  }
}

export class ChildLink {
  /**
   * @param {StrategyNode} node
   */
  constructor (node) {
    this.node = node
  }
}

export class ActionRethrow {
  /**
   * @param {ChildNewNode|ChildLink} child
   */
  constructor (child) {
    this.child = child
  }

  toString () {
    return `rethrow to get ${this.child.node.problem}`
  }
}

export class ActionReduce {
  /**
   * @param {number} factor
   * @param {ChildNewNode|ChildLink} child
   */
  constructor (factor, child) {
    this.factor = factor
    this.child = child
  }

  toString () {
    return `reduce by ${this.factor} to get ${this.child.node.problem}`
  }
}

export class ActionTryReduce {
  /**
   * @param {number} currentFactor
   * @param {number} targetFactor
   * @param {number} errRate
   * @param {StrategyNode} okNode
   * @param {ChildNewNode|ChildLink} errChild
   */
  constructor (currentFactor, targetFactor, errRate, okNode, errChild) {
    this.currentFactor = currentFactor
    this.targetFactor = targetFactor
    this.errRate = errRate
    this.okNode = okNode
    this.errChild = errChild
  }

  toString () {
    return `try to reduce by ${this.currentFactor} -> ${this.targetFactor} to get ${this.okNode.problem}. If not, get ${this.errChild.node.problem}`
  }
}

export class StrategyNode {
  /**
   * @param {StrategyGraph} graph
   * @param {StrategyNode|null} firstParent
   * @param {Problem} problem
   */
  constructor (graph, firstParent, problem) {
    this.graph = graph
    this.firstParent = firstParent
    this.problem = problem

    /**
     * @type {ActionRethrow|ActionReduce|ActionTryReduce|null}
     */
    this.action = null
  }

  /**
   * Replace the current action by a rethrow
   * @returns {ActionRethrow}
   */
  rethrow () {
    const action = new ActionRethrow(this._buildChild(this.problem.rethrow(), this))
    this.action = action
    return action
  }

  /**
   * Replace the current action by a removal a common factor from each side
   * @param factor
   * @returns {ActionReduce}
   */
  reduce (factor) {
    const action = new ActionReduce(factor, this._buildChild(this.problem.reduce(factor), this))
    this.action = action
    return action
  }

  /**
   * Replace the current action by an imperfect match between factor from each side
   * @param currentFactor
   * @param targetFactor
   * @returns {ActionTryReduce}
   */
  tryReduce (currentFactor, targetFactor) {
    const { err, errRate, ok } = this.problem.tryReduce(currentFactor, targetFactor)
    const action = new ActionTryReduce(
      currentFactor,
      targetFactor,
      errRate,
      new StrategyNode(this.graph, this, ok),
      this._buildChild(err, this))
    this.action = action
    return action
  }

  toString () {
    return `${this.problem} => ${this.action}`
  }

  /**
   * @returns {boolean}
   */
  isOpen () {
    return this.action === null && !this.problem.isSolved()
  }

  /**
   * Return the closest ascendant or even itself that has the given problem. If not found, create a new child node.
   * @param {Problem} problem
   * @param {StrategyNode} originalParent
   * @returns {ChildNewNode|ChildLink}
   * @private
   */
  _buildChild (problem, originalParent) {
    if (this.problem.isEqual(problem)) {
      return new ChildLink(this)
    } else if (this.firstParent !== null) {
      return this.firstParent._buildChild(problem, originalParent)
    } else {
      const node = new StrategyNode(this.graph, originalParent, problem)
      return new ChildNewNode(node)
    }
  }
}

export class StrategyGraph {
  /**
   * @param {Problem} rootProblem
   */
  constructor (rootProblem) {
    this.root = new StrategyNode(this, null, rootProblem, null)
  }

  /**
   * Apply a function to all nodes exactly once
   * @param {function(StrategyNode):void} callback
   */
  visitNodes (callback) {
    /**
     * @param {StrategyNode} node
     */
    function visit (node) {
      callback(node)

      const action = node.action
      if (action instanceof ActionRethrow) {
        maybeVisit(action.child)
      } else if (action instanceof ActionReduce) {
        maybeVisit(action.child)
      } else if (action instanceof ActionTryReduce) {
        maybeVisit(action.errChild)
        visit(action.okNode)
      }
    }

    /**
     * @param {ChildNewNode|ChildLink} child
     */
    function maybeVisit (child) {
      if (child instanceof ChildNewNode) {
        visit(child.node)
      }
    }

    visit(this.root)
  }

  /**
   * Find an open node
   * @returns {StrategyNode|null}
   */
  findAnOpenNode () {
    class FoundOpenNode {
      constructor (node) {
        this.node = node
      }
    }

    try {
      this.visitNodes(node => {
        if (node.isOpen()) {
          throw new FoundOpenNode(node)
        }
      })
    } catch (ex) {
      if (ex instanceof FoundOpenNode) {
        return ex.node
      } else {
        throw ex
      }
    }

    return null
  }

  /**
   * Solve the open problems with a naive strategy: rethrow until a full reduction can be tried
   */
  solveNaive () {
    while (true) {
      const node = this.findAnOpenNode()
      if (node === null) {
        return
      }

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
    while (true) {
      const node = this.findAnOpenNode()
      if (node === null) {
        return
      }

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
