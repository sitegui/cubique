import { ActionReduce, ActionRethrow, ActionTryReduce, ChildLink, ChildNewNode } from './Strategy.mjs'

const PROBLEM_HEIGHT = 25
const PROBLEM_WIDTH = 100
const PROBLEM_PADDING = 3
const PROBLEM_COST_HEIGHT = 15
const NODE_SPACE_Y = 20
const NODE_SPACE_X = 20
const CONNECTOR_HEAD_SIZE = 10
const CONNECTOR_ELBOW_X = 10

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
    let svgEl
    let pendingLink

    if (this.svgEl === null) {
      // Nothing to actually translate: this is a link placeholder
      svgEl = null

      pendingLink = this.pendingLink
    } else {
      svgEl = createSvgEl('g', {
        transform: `translate(${dx},${dy})`
      }, [this.svgEl])

      if (this.pendingLink === null) {
        pendingLink = null
      } else {
        pendingLink = new PendingLink(this.pendingLink.node, this.pendingLink.x + dx, this.pendingLink.y + dy)
      }
    }

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
    /**
     * @type {SVGGraphicsElement|null}
     */
    this.currentDraw = null

    this.rootSvgEl.appendChild(createSvgEl('defs', {}, [
      createSvgEl('marker', {
        id: 'arrow-head',
        viewBox: `0 0 ${CONNECTOR_HEAD_SIZE} ${CONNECTOR_HEAD_SIZE}`,
        refX: CONNECTOR_HEAD_SIZE,
        refY: CONNECTOR_HEAD_SIZE / 2,
        markerWidth: CONNECTOR_HEAD_SIZE / 2,
        markerHeight: CONNECTOR_HEAD_SIZE / 2,
        orient: 'auto-start-reverse'
      }, [
        createSvgEl('path', {
          d: `M 0 0 L ${CONNECTOR_HEAD_SIZE} ${CONNECTOR_HEAD_SIZE / 2} L 0 ${CONNECTOR_HEAD_SIZE} z`
        })
      ])
    ]))
  }

  /**
   */
  draw () {
    if (this.currentDraw) {
      this.rootSvgEl.removeChild(this.currentDraw)
    }
    const svgEl = this._drawNode(this.graph.root).svgEl
    this.rootSvgEl.appendChild(svgEl)
    this.currentDraw = svgEl
  }

  /**
   * @param {StrategyNode} node
   * @returns {SvgSketch}
   * @private
   */
  _drawNode (node) {
    const problemSvg = this._drawProblem(node)

    const svgEls = [problemSvg]
    let pendingLink

    if (node.action === null) {
      pendingLink = null
    } else if (node.action instanceof ActionRethrow || node.action instanceof ActionReduce) {
      const dy = PROBLEM_HEIGHT + NODE_SPACE_Y
      const childSketch = this._drawChild(node.action.child).translated(0, dy)
      const arrow = childSketch.svgEl !== null ? this._drawConnector(0, PROBLEM_HEIGHT, 0, dy, false) : null

      svgEls.push(arrow, childSketch.svgEl)
      pendingLink = childSketch.pendingLink
    } else if (node.action instanceof ActionTryReduce) {
      let okSketch = this._drawNode(node.action.okNode)
      const okBox = this._computeBox(okSketch.svgEl)
      const okDx = NODE_SPACE_X / 2 - okBox.x
      const okDy = PROBLEM_HEIGHT + NODE_SPACE_Y - okBox.y
      okSketch = okSketch.translated(okDx, okDy)
      const okArrow = this._drawConnector(0, PROBLEM_HEIGHT, okDx, okDy, false)

      let errSketch = this._drawChild(node.action.errChild)
      const errBox = this._computeBox(errSketch.svgEl)
      const errDx = -NODE_SPACE_Y / 2 - errBox.width - errBox.x
      const errDy = PROBLEM_HEIGHT + NODE_SPACE_Y - errBox.y
      errSketch = errSketch.translated(errDx, errDy)
      const errArrow = errSketch.svgEl !== null ? this._drawConnector(0, PROBLEM_HEIGHT, errDx, errDy, false) : null

      svgEls.push(okSketch.svgEl, okArrow, errSketch.svgEl, errArrow)
      pendingLink = errSketch.pendingLink
    }

    if (pendingLink !== null && pendingLink.node === node) {
      const linkArrow = this._drawConnector(pendingLink.x, pendingLink.y, -PROBLEM_WIDTH / 2, PROBLEM_HEIGHT / 2, true)
      svgEls.push(linkArrow)
      pendingLink = null
    }

    const svgEl = svgEls.length === 1 ? svgEls[0] : createSvgEl('g', {}, svgEls)
    return new SvgSketch(svgEl, pendingLink)
  }

  /**
   * @param {StrategyNode} node
   * @returns {SVGGraphicsElement}
   * @private
   */
  _drawProblem (node) {
    const problem = node.problem
    const text = createSvgEl('text', {
      x: 0,
      'text-anchor': 'middle',
      y: PROBLEM_HEIGHT / 2,
      'font-size': PROBLEM_HEIGHT - 2 * PROBLEM_PADDING,
      'alignment-baseline': 'central'
    }, [`${problem.currentSize} ⇒ ${problem.targetSize}`])

    const costText = node.cost !== null
      ? createSvgEl('text', {
          x: PROBLEM_WIDTH / 2 + PROBLEM_PADDING,
          'text-anchor': 'start',
          y: PROBLEM_HEIGHT / 2,
          'font-size': PROBLEM_COST_HEIGHT - 2 * PROBLEM_PADDING,
          'alignment-baseline': 'central'
        }, [node.cost.toString()])
      : null

    const rect = createSvgEl('rect', {
      x: -PROBLEM_WIDTH / 2,
      y: 0,
      width: PROBLEM_WIDTH,
      height: PROBLEM_HEIGHT,
      fill: this._fillColor(problem),
      stroke: 'black'
    })

    return createSvgEl('g', {}, [rect, text, costText])
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
   * @param {boolean} withElbow
   * @returns {SVGGraphicsElement}
   * @private
   */
  _drawConnector (x1, y1, x2, y2, withElbow) {
    if (!withElbow) {
      return createSvgEl('line', {
        x1,
        y1,
        x2,
        y2,
        stroke: 'black',
        'marker-end': 'url(#arrow-head)'
      })
    } else {
      return createSvgEl('polyline', {
        points: `${x1},${y1} ${x1 - CONNECTOR_ELBOW_X},${y1} ${x1 - CONNECTOR_ELBOW_X},${y2} ${x2},${y2}`,
        stroke: 'black',
        fill: 'transparent',
        'marker-end': 'url(#arrow-head)'
      })
    }
  }

  /**
   * @param {SVGGraphicsElement|null} svgEl
   * @returns {SVGRect}
   * @private
   */
  _computeBox (svgEl) {
    if (svgEl === null) {
      return createSvgEl('rect').getBBox()
    }

    this.rootSvgEl.appendChild(svgEl)
    const box = svgEl.getBBox()
    this.rootSvgEl.removeChild(svgEl)
    return box
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
