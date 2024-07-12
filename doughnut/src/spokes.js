import * as d3 from 'd3'

export function createSpokeElements(g, spokes, trans, currentSpokeParams) {

  g.selectAll('.spoke')
    .data(spokes, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
          .classed('spoke', true)
          .attr('id', d => `spoke-path-${d.id}`)

        return spokeCommonAttrs(sel, 0)
      },
      update => update,
      exit => spokeCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining => spokeCommonAttrs(remaining.transition(trans), 1))

  function spokeCommonAttrs(selection, i) {
    if (i === 0) {
      selection.attr('d', d => spokeLine(getSpokeParams(d,i)))
    } else {
      selection.attrTween('d', d => {
          return spokeTween(d, i)
        })
    }
    return selection
      .style('stroke', d => d.stroke ? d.stroke[i] : null)
      .style('stroke-width', d => d['strokeWidth'] ? d['strokeWidth'][i] : null)
      .style('stroke-dasharray', d => d['strokeDasharray'] ? d['strokeDasharray'][i].replace('-', ' ') : null)
      .style('opacity', d => d.opacity ? d.opacity[i] : null)
  }

  function spokeTween(d, i) {

    const s = d.currentSpokeParams
    const e = getSpokeParams(d, i)

    const iInnerRadius = d3.interpolate(s.innerRadius, e.innerRadius)
    const iOuterRadius = d3.interpolate(s.outerRadius, e.outerRadius)
    const iAngle = d3.interpolate(s.angle, e.angle)

    return function(t) {
      d.currentSpokeParams = {
        innerRadius: iInnerRadius(t),
        outerRadius: iOuterRadius(t),
        angle: iAngle(t),
      }
      currentSpokeParams[d.id] = d.currentSpokeParams
      return spokeLine(d.currentSpokeParams)
    }
  }
}

export function initialiseSpokeParameters (spokes, currentSpokeParams) {
  // For all spokes, update currentSpokeParams if a spoke
  // with that id has already been used
  spokes.forEach(s => {
    if (currentSpokeParams[s.id]) {
      s.currentSpokeParams = currentSpokeParams[s.id]
    }
  })
  // Remove any properties of currentSpokeParams that
  // have no corresponding key in current spokes
  Object.keys(currentSpokeParams).forEach(k => {
    if (!spokes.find(s => s.id === k)) {
      delete currentSpokeParams[k]
    }
  })
}

export function getSpokeParams (d, i) {
  return {
    innerRadius: d.radius1[i],
    outerRadius: d.radius2[i],
    angle: (d.angle[i] - 90) * Math.PI / 180,
  }
}

function spokeLine(spokeParams) {
  const angle = Math.round(spokeParams.angle * 180 / Math.PI)
  
  const xi = (spokeParams.innerRadius * Math.cos((angle)*Math.PI/180)) + 0
  const yi = (spokeParams.innerRadius * Math.sin((angle)*Math.PI/180)) + 0

  const xo = (spokeParams.outerRadius * Math.cos((angle)*Math.PI/180)) + 0
  const yo = (spokeParams.outerRadius * Math.sin((angle)*Math.PI/180)) + 0

  return `M${xi} ${yi} L${xo} ${yo}`
}