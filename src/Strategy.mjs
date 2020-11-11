export class ActionRethrow {
  /**
   * @param {StrategyNode} child
   */
  constructor (child) {
    this.child = child
  }
}

export class ActionReduce {
  /**
   * @param {StrategyNode} child
   */
  constructor (child) {
    this.child = child
  }
}

export class ActionTryReduce {
  /**
   * @param {number} errRate
   * @param {StrategyNode} okChild
   * @param {StrategyNode} errChild
   */
  constructor (errRate, okChild, errChild) {
    this.errRate = errRate
    this.okChild = okChild
    this.errChild = errChild
  }
}

export class StrategyNode {
  /**
   * @param {Problem} problem
   * @param {?ActionRethrow|ActionReduce|ActionTryReduce} action
   */
  constructor (problem, action) {
    this.problem = problem
    this.action = action
  }

  /**
   * Replace the current action by a rethrow
   * @returns {ActionRethrow}
   */
  rethrow () {
    this.action = new ActionRethrow(new StrategyNode(this.problem.rethrow(), null))
    return this.action
  }

  /**
   * Replace the current action by a removal a common factor from each side
   * @param factor
   * @returns {ActionReduce}
   */
  reduce (factor) {
    this.action = new ActionReduce(new StrategyNode(this.problem.reduce(factor), null))
  }

  /**
   * Replace the current action by an imperfect match between factor from each side
   * @param currentFactor
   * @param targetFactor
   * @returns {ActionTryReduce}
   */
  tryReduce (currentFactor, targetFactor) {
    const { err, errRate, ok } = this.problem.tryReduce(currentFactor, targetFactor)
    this.action = new ActionTryReduce(errRate, new StrategyNode(ok, null), new StrategyNode(err, null))
  }
}

export class StrategyTree {
  /**
   * @param {StrategyNode} root
   */
  constructor (root) {
    this.root = root
  }

  /**
   * Return a naive strategy to solve a given problem: rethrow until a full reduction can be tried
   * @param {Problem} problem
   * @returns {StrategyTree}
   */
  static naiveFromProblem (problem) {
    const root = new StrategyNode(problem, null)
    const knownProblems = []

    let leaf = root

    while (!leaf.problem.isSolved() && knownProblems.some(problem => problem.isEqual(leaf.problem))) {
      knownProblems.push(leaf.problem)

      // Rethrow until the reduction can be applied
      while (leaf.problem.currentSize < leaf.problem.targetSize) {
        leaf = leaf.rethrow().child
        knownProblems.push(leaf.problem)
      }

      // Try a full reduction. The ok branch will be solved, but we may need to continue with the err branch
      leaf = leaf.tryReduce(leaf.problem.currentSize, leaf.problem.targetSize).errChild
      knownProblems.push(leaf.problem)
    }

    return new StrategyTree(root)
  }
}
