import { greatestCommonDivisor } from './divisors.mjs'
import { LinearExpression, VariableFactory } from './LinearExpression.mjs'
import { Fraction } from './Fraction.mjs'

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
   * @param {number} factor
   * @param {Fraction} errRate
   * @param {StrategyNode} okNode
   * @param {ChildNewNode|ChildLink} errChild
   */
  constructor (factor, errRate, okNode, errChild) {
    this.factor = factor
    this.errRate = errRate
    this.okNode = okNode
    this.errChild = errChild
  }

  toString () {
    return `try to reduce by ${this.factor} to get ${this.okNode.problem}. If not, get ${this.errChild.node.problem}`
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

    /**
     * @type {LinearExpression|null}
     */
    this.cost = null
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
   * Replace the current action by an imperfect match between a factor for the two sides
   * @param {number} factor
   * @returns {ActionTryReduce}
   */
  tryReduce (factor) {
    const { err, errRate, ok } = this.problem.tryReduce(factor)
    const action = new ActionTryReduce(
      factor,
      errRate,
      new StrategyNode(this.graph, this, ok),
      this._buildChild(err, this))
    this.action = action
    return action
  }

  toString () {
    const cost = this.cost === null ? '' : ` with cost ${this.cost}`
    return `${this.problem} => ${this.action}${cost}`
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
    this.root = new StrategyNode(this, null, rootProblem)
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
   * Update the costs of all nodes
   */
  updateCosts () {
    const variableFactory = new VariableFactory()
    const placeholderFactory = new VariableFactory('link-')

    /**
     * Update and return the cost for a given child. A link child marks the beginning of a cycle.
     * @param {ChildNewNode|ChildLink} child
     */
    function getCostForChild (child) {
      if (child instanceof ChildNewNode) {
        return getCostForNode(child.node)
      } else if (child instanceof ChildLink) {
        // We have a cycle here: the child is a link to a parent. Since we do not yet know the cost of the parent,
        // we will put a placeholder variable there
        child.node.cost = LinearExpression.variable(placeholderFactory.nextVariable())
        return child.node.cost
      }
    }

    /**
     * Update and return the cost for a given node and its descendants.
     * This cost may not yet be final if the node is part of a cycle. In this case, it will include some placeholder
     * variables, that will be resolved once the cycle root is resolved.
     * @param {StrategyNode} node
     * @returns {LinearExpression}
     */
    function getCostForNode (node) {
      // Clear previous state
      node.cost = null

      if (node.action === null) {
        // Leaf node: base case
        if (node.problem.isSolved()) {
          node.cost = LinearExpression.zero()
        } else {
          node.cost = LinearExpression.variable(variableFactory.nextVariable())
        }
      } else if (node.action instanceof ActionRethrow) {
        const childCost = getCostForChild(node.action.child)
        saveCost(node, childCost.add(LinearExpression.one()))
      } else if (node.action instanceof ActionReduce) {
        const childCost = getCostForChild(node.action.child)
        saveCost(node, childCost)
      } else if (node.action instanceof ActionTryReduce) {
        const errRate = node.action.errRate
        const errCost = getCostForChild(node.action.errChild).mul(errRate)
        const okCost = getCostForNode(node.action.okNode).mul(Fraction.one().sub(errRate))
        saveCost(node, errCost.add(okCost))
      }

      return node.cost
    }

    /**
     * Save the cost at the given node. If this closes a cycle, the placeholder variable will be solved and replaced
     * in the cycle.
     * @param {StrategyNode} node
     * @param {LinearExpression} cost
     */
    function saveCost (node, cost) {
      const possiblePlaceholder = node.cost !== null ? node.cost.asSingleVariable() : null

      if (possiblePlaceholder === null || !placeholderFactory.has(possiblePlaceholder)) {
        // Simple case
        node.cost = cost
      } else {
        // This is a placeholder placed when the node at the end of the cycle was first visited.
        // This is the root cycle and we know its cost is equal to the placeholder and the linear expression passed as
        // argument.
        const solvedCost = cost.solveEqualsTo(possiblePlaceholder)

        // Recursively substitute in the cost expressions of the children
        let currentNode = node
        while (true) {
          currentNode.cost = currentNode.cost.substitute(possiblePlaceholder, solvedCost)

          let child = null
          if (currentNode.action instanceof ActionRethrow) {
            child = currentNode.action.child
          } else if (currentNode.action instanceof ActionReduce) {
            child = currentNode.action.child
          } else if (currentNode.action instanceof ActionTryReduce) {
            // We only follow the "err" path, since we know that the "ok" path is an independent graph
            child = currentNode.action.errChild
          } else {
            break
          }

          if (child instanceof ChildNewNode) {
            currentNode = child.node
          } else {
            break
          }
        }
      }
    }

    getCostForNode(this.root)
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
      } else if (node.problem.currentSize % node.problem.targetSize === 0) {
        node.reduce(node.problem.targetSize)
      } else {
        node.tryReduce(node.problem.targetSize)
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
      } else if (node.problem.currentSize % node.problem.targetSize === 0) {
        node.reduce(node.problem.targetSize)
      } else {
        node.tryReduce(node.problem.targetSize)
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
