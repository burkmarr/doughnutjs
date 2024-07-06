import * as d3 from 'd3'
//import { roughUp } from './roughUp.js'

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
    const iCornerRadius = d3.interpolate(s.cornerRadius, e.cornerRadius)
    const iPadAngle = d3.interpolate(s.padAngle, e.padAngle)
    const iPadRadius = d3.interpolate(s.padRadius, e.padRadius)

    return function(t) {
      d.currentArcParams = {
        innerRadius: iInnerRadius(t),
        outerRadius: iOuterRadius(t),
        startAngle: iStartAngle(t),
        endAngle: iEndAngle(t),
        cornerRadius: iCornerRadius(t),
        padAngle: iPadAngle(t),
        padRadius: iPadRadius(t)
      }

      //https://d3js.org/d3-shape/arc
      const arc = d3.arc()
        .innerRadius(d.currentArcParams.innerRadius)
        .outerRadius(d.currentArcParams.outerRadius)
        .startAngle(d.currentArcParams.startAngle)
        .endAngle(d.currentArcParams.endAngle)
        .cornerRadius(d.currentArcParams.cornerRadius)
        .padAngle(d.currentArcParams.padAngle)
        .padRadius(d.currentArcParams.padRadius)

      currentArcParams[d.id] = d.currentArcParams
 
      //return roughUp(arc())
      return arc()
    }
  }
}

export function initialiseArcParameters(arcs, currentArcParams) {
  // For all arcs, update currentArcParams if an arc
  // with that id has already been used
  arcs.forEach(a => {
    if (currentArcParams[a.id]) {
      a.currentArcParams = currentArcParams[a.id]
    }
  })
  // Remove any properties of currentArcParams that
  // have no corresponding key in current arcs
  Object.keys(currentArcParams).forEach(k => {
    if (!arcs.find(a => a.id === k)) {
      delete currentArcParams[k]
    }
  })
}

export function getArcParams (d, i) {

  return {
    innerRadius: d.radius1[i],
    outerRadius: d.radius2[i],
    startAngle: (d.angle1[i]) * Math.PI / 180,
    endAngle: (d.angle2[i]) * Math.PI / 180,
    cornerRadius: d.cornerRadius[i],
    padAngle: d.padAngle[i],
    padRadius: d.padRadius[i]
  }
}


  