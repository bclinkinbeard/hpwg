import * as d3 from 'd3'
import { $, DURATIONS } from './helpers'

const speedSelect = $<HTMLSelectElement>('#speed')

export default class TimeScrubber {
  hostEl: HTMLDivElement
  svg!: d3.Selection<SVGSVGElement, {}, d3.BaseType, undefined>
  baseGroup!: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>
  markingsGroup!: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>

  minTimeLabel!: d3.Selection<SVGTextElement, {}, d3.BaseType, undefined>
  maxTimeLabel!: d3.Selection<SVGTextElement, {}, d3.BaseType, undefined>

  timeScale?: d3.ScaleTime<number, number>

  margin = { top: 0, right: 0, bottom: 0, left: 0 }

  brush!: d3.BrushBehavior<{}>
  handleWidth = 8
  frameId = 0
  prevTime = 0
  isPlaying = false
  isScrubbing = false
  loop = true

  minTimeFilter?: number
  maxTimeFilter?: number

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
      .style('fill', 'white')

    // container for markings and axis groups
    this.baseGroup = this.svg
      .append<SVGGElement>('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`)

    // drawing context for all chart markings
    this.markingsGroup = this.baseGroup.append<SVGGElement>('g')

    this.minTimeLabel = this.markingsGroup
      .append('text')
      .attr('x', 30)
      .attr('y', 30)

    this.maxTimeLabel = this.markingsGroup
      .append('text')
      .attr('x', this.contextWidth - 30)
      .attr('y', 30)
      .attr('text-anchor', 'end')
  }

  initBrush() {
    this.brush = d3
      .brushX<{}>()
      .extent([
        [0, 0],
        [this.contextWidth, this.contextHeight],
      ])
      .handleSize(10)
      .on('start brush end', () => {
        if (this.isPlaying || !d3.event) return
        switch (d3.event.type) {
          case 'start':
            this.isScrubbing = true
            break
          case 'end':
            this.isScrubbing = false
            break
          default:
          // no-op
        }
        const [left, right] = d3.event.selection
        const minFilterDate = this.timeScale!.invert(left)
        const maxFilterDate = this.timeScale!.invert(right)
        this.minTimeFilter = minFilterDate.valueOf()
        this.maxTimeFilter = maxFilterDate.valueOf()
        this.minTimeLabel.text(minFilterDate.toLocaleString())
        this.maxTimeLabel.text(maxFilterDate.toLocaleString())
      })

    this.markingsGroup
      .append<SVGGElement>('g')
      .attr('class', 'brush')
      .call(this.brush)
      .call(this.brush.move, this.timeScale?.range())
      .call(this.brushHandles)
  }

  brushHandles = (
    selection: d3.Selection<SVGGElement, {}, d3.BaseType, undefined>,
  ) => {
    selection
      .selectAll('.handle')
      .attr('x', (d, i) => i * this.contextWidth - i * this.handleWidth)
      .attr('y', 0)
      .attr('width', this.handleWidth)
      .attr('height', this.contextHeight)
  }

  setTimeBounds(minTime: number, maxTime: number) {
    this.minTime = this.minTimeFilter = minTime
    this.maxTime = this.maxTimeFilter = maxTime
    this.minTimeLabel.text(new Date(this.minTime).toLocaleString())
    this.maxTimeLabel.text(new Date(this.maxTime).toLocaleString())
    this.timeScale = d3
      .scaleTime()
      .domain([this.minTime, this.maxTime])
      .range([0, this.contextWidth])
    this.initBrush()
  }

  setTimeFilter(minTime: number, maxTime: number) {
    this.minTimeFilter = minTime
    this.maxTimeFilter = maxTime
    const extent = [this.timeScale!(minTime), this.timeScale!(maxTime)]
    // @ts-ignore
    this.markingsGroup.selectAll('.brush').call(this.brush.move, extent)
    this.minTimeLabel.text(new Date(this.minTimeFilter).toLocaleString())
    this.maxTimeLabel.text(new Date(this.maxTimeFilter).toLocaleString())
  }

  setDuration(duration: number) {
    this.setTimeFilter(this.minTimeFilter!, this.minTimeFilter! + duration)
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying
    if (this.isPlaying) {
      this.animate()
    } else {
      this.cancelAnimation()
    }
  }

  animate = (t?: number) => {
    let inc = 0

    if (t) {
      if (this.prevTime === 0) this.prevTime = t
      const delta = t - this.prevTime
      this.prevTime = t
      inc = delta * +speedSelect.value
    }

    let newMin = this.minTimeFilter! + inc
    let newMax = this.maxTimeFilter! + inc
    if (newMax >= this.maxTime!) {
      if (this.loop) {
        newMax = this.minTime! + (newMax - newMin)
        newMin = this.minTime!
      } else {
        this.cancelAnimation()
        newMin = this.maxTime! - (newMax - newMin)
        newMax = this.maxTime!
      }
    }
    // increase each value by the real amount of time passed
    // multiplied by the speed value
    this.setTimeFilter(newMin, newMax)

    if (this.isPlaying) {
      this.frameId = requestAnimationFrame(this.animate)
    }
  }

  cancelAnimation() {
    window.cancelAnimationFrame(this.frameId)
    this.prevTime = 0
    this.isPlaying = false
  }
}
