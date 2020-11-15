import { ActionReduce, ActionRethrow, ActionTryReduce, ChildLink, ChildNewNode } from './Strategy.mjs'

const PROBLEM_HEIGHT = 25
const PROBLEM_WIDTH = 100
const PROBLEM_PADDING = 3
const NODE_SPACE_Y = 10

class PendingLink {
  /**
   * @param {StrategyNode} node
   * @param {number} x
   * @param {number} y
   */
  constructor (node, x, y) {
    this.node = node
    this.x = x
    this.y = y
  }
}

class SvgSketch {
  /**
   * @param {SVGGraphicsElement|null} svgEl
   * @param {PendingLink|null} pendingLink
   */
  constructor (svgEl, pendingLink) {
    this.svgEl = svgEl
    this.pendingLink = pendingLink
  }

  /**
   * @param {number} dx
   * @param {number} dy
   * @returns {SvgSketch}
   */
  translated (dx, dy) {
    const svgEl = this.svgEl === null
      ? null
      : createSvgEl('g', {
        transform: `translate(${dx},${dy})`
      }, [this.svgEl])
    const pendingLink = this.pendingLink === null
      ? null
      : new PendingLink(this.pendingLink.node, this.pendingLink.x + dx, this.pendingLink.y + dy)
    return new SvgSketch(svgEl, pendingLink)
  }
}

export class Artist {
  /**
   * @param {StrategyGraph} graph
   * @param {SVGElement} rootSvgEl
   */
  constructor (graph, rootSvgEl) {
    this.graph = graph
    this.rootSvgEl = rootSvgEl
  }

  /**
   */
  draw () {
    const svgEl = this._drawNode(this.graph.root).svgEl
    while (this.rootSvgEl.firstChild) {
      this.rootSvgEl.removeChild(this.rootSvgEl.firstChild)
    }
    this.rootSvgEl.appendChild(svgEl)
  }

  /**
   * @param {StrategyNode} node
   * @returns {SvgSketch}
   * @private
   */
  _drawNode (node) {
    const problemSvg = this._drawProblem(node.problem)

    let svgEl = null
    let pendingLink = null

    if (node.action instanceof ActionRethrow || node.action instanceof ActionReduce) {
      const childSketch = this._drawChild(node.action.child).translated(0, PROBLEM_HEIGHT + NODE_SPACE_Y)
      const arrow = this._drawArrow(0, PROBLEM_HEIGHT, 0, PROBLEM_HEIGHT + NODE_SPACE_Y)

      svgEl = createSvgEl('g', {}, [
        problemSvg,
        arrow,
        childSketch.svgEl
      ])
      pendingLink = childSketch.pendingLink
    } else if (node.action instanceof ActionTryReduce) {
      // TODO
    }

    if (pendingLink !== null && pendingLink.node === node) {
      // TODO
      pendingLink = null
    }

    return new SvgSketch(svgEl, pendingLink)
  }

  /**
   * @param {Problem} problem
   * @returns {SVGGraphicsElement}
   * @private
   */
  _drawProblem (problem) {
    const text = createSvgEl('text', {
      x: 0,
      'text-anchor': 'middle',
      y: PROBLEM_HEIGHT / 2,
      'font-size': PROBLEM_HEIGHT - 2 * PROBLEM_PADDING,
      'alignment-baseline': 'central'
    }, [`${problem.currentSize} ⇒ ${problem.targetSize}`])

    const rect = createSvgEl('rect', {
      x: -PROBLEM_WIDTH / 2,
      y: 0,
      width: PROBLEM_WIDTH,
      height: PROBLEM_HEIGHT,
      fill: this._fillColor(problem),
      stroke: 'black'
    })

    return createSvgEl('g', {}, [rect, text])
  }

  /**
   * @param {ChildNewNode|ChildLink} child
   * @returns {SvgSketch}
   * @private
   */
  _drawChild (child) {
    if (child instanceof ChildNewNode) {
      return this._drawNode(child.node)
    } else if (child instanceof ChildLink) {
      return new SvgSketch(null, new PendingLink(child.node, -PROBLEM_WIDTH / 2, PROBLEM_HEIGHT / 2))
    }
  }

  /**
   * @param {Problem} problem
   * @returns {string}
   * @private
   */
  _fillColor (problem) {
    // Convert from [rootProblem.targetSize, 1] to [255, 128]
    const ratio = (problem.targetSize - 1) / (this.graph.root.problem.targetSize - 1)
    const color = Math.round(128 + ratio * (255 - 128)).toString(16).padStart(2, '0')
    return `#${color}${color}${color}`
  }

  /**
   * @param {number} x1
   * @param {number} y1
   * @param {number} x2
   * @param {number} y2
   * @returns {SVGGraphicsElement}
   * @private
   */
  _drawArrow (x1, y1, x2, y2) {
    return createSvgEl('line', {
      x1,
      y1,
      x2,
      y2,
      stroke: 'black'
    })
  }
}

/**
 * @param {string} tag
 * @param {object<string, string|number>} attributes
 * @param {array<string|SVGGraphicsElement|null>} children
 * @returns {SVGGraphicsElement}
 */
function createSvgEl (tag, attributes = {}, children = []) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag)
  for (const [name, value] of Object.entries(attributes)) {
    el.setAttribute(name, value)
  }
  for (const child of children) {
    if (child !== null) {
      el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child)
    }
  }
  return el
}
