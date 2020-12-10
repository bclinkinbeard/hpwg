import * as d3 from 'd3'
import { $ } from './helpers'

export default class TimeScrubber {
  hostEl: HTMLDivElement
  svg!: d3.Selection<SVGSVGElement, {}, d3.BaseType, undefined>
  baseGroup!: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>
  markingsGroup!: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>

  minHandle!: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>
  maxHandle!: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>
  minTimeLabel!: d3.Selection<SVGTextElement, {}, d3.BaseType, undefined>
  maxTimeLabel!: d3.Selection<SVGTextElement, {}, d3.BaseType, undefined>

  handleColor = '#004fa8'
  handleWidth = 20
  margin = { top: 0, right: 0, bottom: 0, left: 0 }

  get contextWidth() {
    const { width } = this.hostEl.getBoundingClientRect()
    return width - this.margin.left - this.margin.right
  }

  get contextHeight() {
    const { height } = this.hostEl.getBoundingClientRect()
    return height - this.margin.top - this.margin.bottom
  }

  constructor(query: string, public minTime?: number, public maxTime?: number) {
    this.hostEl = $<HTMLDivElement>(query)
    this.initDOM()
    if (minTime && maxTime) {
      this.setTimeBounds(minTime, maxTime)
    } else {
      this.resetHandles()
    }
  }

  initDOM() {
    const { width, height } = this.hostEl.getBoundingClientRect()

    this.svg = d3
      .select<HTMLDivElement, {}>(this.hostEl)
      .append<SVGSVGElement>('svg')
      .attr('width', width)
      .attr('height', height)

    // bg
    this.svg
      .append<SVGRectElement>('rect')
      .attr('width', width)
      .attr('height', height)
      .style('fill', 'grey')

    // container for markings and axis groups
    this.baseGroup = this.svg
      .append<SVGGElement>('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    // drawing context for all chart markings
    this.markingsGroup = this.baseGroup.append<SVGGElement>('g')

    // between the handles
    this.markingsGroup
      .append('rect')
      .attr('x', this.handleWidth)
      .attr('width', this.contextWidth - this.handleWidth * 2)
      .attr('height', this.contextHeight)
      .style('fill', '#c1cede')

    this.minTimeLabel = this.markingsGroup
      .append('text')
      .attr('x', this.handleWidth * 1.5)
      .attr('y', 30)

    this.maxTimeLabel = this.markingsGroup
      .append('text')
      .attr('x', this.contextWidth - this.handleWidth * 1.5)
      .attr('y', 30)
      .attr('text-anchor', 'end')

    this.minHandle = this.markingsGroup
      .append<SVGGElement>('g')
      .call(this.buildHandle)
    this.maxHandle = this.markingsGroup
      .append<SVGGElement>('g')
      .call(this.buildHandle)
  }

  resetHandles() {
    this.minHandle.attr('transform', `translate(0, 0)`)
    this.maxHandle.attr(
      'transform',
      `translate(${this.contextWidth - this.handleWidth}, 0)`,
    )
  }

  buildHandle = (
    selection: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>,
  ) => {
    return selection
      .append('rect')
      .attr('width', this.handleWidth)
      .attr('height', this.contextHeight)
      .style('fill', this.handleColor)
  }

  setTimeBounds(minTime: number, maxTime: number) {
    this.minTime = minTime
    this.maxTime = maxTime
    this.minTimeLabel.text(new Date(this.minTime).toISOString())
    this.maxTimeLabel.text(new Date(this.maxTime).toISOString())
    this.resetHandles()
  }
}
