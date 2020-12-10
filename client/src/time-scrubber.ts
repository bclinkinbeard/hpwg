import * as d3 from 'd3'

export const initTimeScrubber = (
  query: string,
  minTime: number,
  maxTime: number,
) => {
  const svg = d3
    .select(query)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')

  // get the measured dimensions
  const w = parseInt(svg.style('width'))
  const h = parseInt(svg.style('height'))
  const margin = { top: 0, right: 0, bottom: 0, left: 0 }
  const handleWidth = 20
  const handleColor = 'navy'

  // bg
  svg
    .append('rect')
    .attr('width', w)
    .attr('height', h)
    .style('fill', 'lightgray')

  // active area
  svg
    .append('rect')
    .attr('x', handleWidth)
    .attr('width', w - handleWidth * 2)
    .attr('height', h)
    .style('fill', 'lightblue')

  svg
    .append('text')
    .attr('x', handleWidth * 1.5)
    .attr('y', 30)
    .text(new Date(minTime).toISOString())

  svg
    .append('text')
    .attr('x', w - handleWidth * 1.5)
    .attr('y', 30)
    .attr('text-anchor', 'end')
    .text(new Date(maxTime).toISOString())

  const minHandle = svg.append<SVGGElement>('g').attr('id', 'minHandle')
  const maxHandle = svg
    .append<SVGGElement>('g')
    .attr('id', 'maxHandle')
    .attr('transform', `translate(${w - handleWidth}, 0)`)

  minHandle
    .append('rect')
    .attr('width', handleWidth)
    .attr('height', h)
    .style('fill', handleColor)
  maxHandle
    .append('rect')
    .attr('width', handleWidth)
    .attr('height', h)
    .style('fill', handleColor)
}
