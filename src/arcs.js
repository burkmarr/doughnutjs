import * as d3 from 'd3'
import { getArcParams } from './data.js'

export function createArcElements(g, arcs, trans, currentArcParams) {

  // Arcs
  const arc =  d3.arc()
  g.selectAll('.arc')
    .data(arcs, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
          .classed('arc', true)
          .attr('id', d => `arc-path-${d.id}`)

        return arcCommonAttrs(sel, 0)
      },
      update => update,
      exit => arcCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining => arcCommonAttrs(remaining.transition(trans), 1))

  function arcCommonAttrs(selection, i) {
    if (i === 0) {
      selection.attr('d', d => arc(getArcParams(d,i)))
    } else {
      selection.attrTween('d', d => {
          return arcTween(d, i)
        })
    }
    return selection
      .style('fill', d => d.colour ? d.colour[i] : null )
      .style('stroke', d => d.stroke ? d.stroke[i] : null)
      .style('stroke-width', d => d['stroke-width'] ? d['stroke-width'][i] : null)
      .style('stroke-dasharray', d => d['stroke-dasharray'] ? d['stroke-dasharray'] : null)
      .style('opacity', d => d.opacity ? d.opacity[i] : null)
  }

  function arcTween(d, i) {

    const s = d.currentArcParams
    const e = getArcParams(d, i)

    const iInnerRadius = d3.interpolate(s.innerRadius, e.innerRadius)
    const iOuterRadius = d3.interpolate(s.outerRadius, e.outerRadius)
    const iStartAngle = d3.interpolate(s.startAngle, e.startAngle)
    const iEndAngle = d3.interpolate(s.endAngle, e.endAngle)

    return function(t) {
      d.currentArcParams = {
        innerRadius: iInnerRadius(t),
        outerRadius: iOuterRadius(t),
        startAngle: iStartAngle(t),
        endAngle: iEndAngle(t)
      }
      const arc = d3.arc()
        .innerRadius(d.currentArcParams.innerRadius)
        .outerRadius(d.currentArcParams.outerRadius)
        .startAngle(d.currentArcParams.startAngle)
        .endAngle(d.currentArcParams.endAngle)

      currentArcParams[d.id] = d.currentArcParams
 
      //return roughUp(arc())
      return arc()
    }
  }
}