import * as d3 from 'd3'

export function createArclineElements(g, arclines, trans, currentArclineParams) {

  g.selectAll('.arcline')
    .data(arclines, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
          .classed('arcline', true)
          .attr('id', d => `arcline-path-${d.id}`)

        return arclineCommonAttrs(sel, 0)
      },
      update => update,
      exit => arclineCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining => arclineCommonAttrs(remaining.transition(trans), 1))

  function arclineCommonAttrs(selection, i) {
    if (i === 0) {
      selection.attr('d', d => arcLine(getArclineParams(d,i)))
    } else {
      selection.attrTween('d', d => {
          return arclineTween(d, i)
        })
    }
    return selection
      .style('fill', 'none' )
      .style('stroke', d => d.stroke ? d.stroke[i] : null)
      .style('stroke-width', d => d['stroke-width'] ? d['stroke-width'][i] : null)
      .style('stroke-dasharray', d => d['stroke-dasharray'] ? d['stroke-dasharray'] : null)
      .style('opacity', d => d.opacity ? d.opacity[i] : null)
  }

  function arclineTween(d, i) {

    const s = d.currentArclineParams
    const e = getArclineParams(d, i)

    const iRadius = d3.interpolate(s.radius, e.radius)
    const iStartAngle = d3.interpolate(s.startAngle, e.startAngle)
    const iEndAngle = d3.interpolate(s.endAngle, e.endAngle)

    return function(t) {
      d.currentArclineParams = {
        radius: iRadius(t),
        startAngle: iStartAngle(t),
        endAngle: iEndAngle(t)
      }
      currentArclineParams[d.id] = d.currentArclineParams
      return arcLine(d.currentArclineParams)
    }
  }
}

export function initialiseArclineParameters (arclines, currentArclineParams) {
  // For all arclines, update currentArclineParams if an arcline
  // with that id has already been used
  arclines.forEach(a => {
    if (currentArclineParams[a.id]) {
      a.currentArclineParams = currentArclineParams[a.id]
    }
  })
  // Remove any properties of currentArclineParams that
  // have no corresponding key in current arcs
  Object.keys(currentArclineParams).forEach(k => {
    if (!arclines.find(a => a.id === k)) {
      delete currentArclineParams[k]
    }
  })
}

export function getArclineParams (d, i) {
  return {
    radius: d.radius[i],
    startAngle: (d.angle1[i] - 90) * Math.PI / 180,
    endAngle: (d.angle2[i] - 90) * Math.PI / 180
  }
}

function arcLine(arclineParams) {
  const as = Math.round(arclineParams.startAngle * 180 / Math.PI)
  const ae = Math.round(arclineParams.endAngle * 180 / Math.PI)

  // Using SVG path Arc generator problematic because when you do a full cirlce,
  // it disappears - so you can only do 0-359 which leaves a gap
  // const largeArcFlag = (ae - as) > 180 || ae > 360 && ae - 360 === es ? 1 : 0
  // const x1 = arclineParams.radius * Math.cos(arclineParams.startAngle)
  // const y1 = arclineParams.radius * Math.sin(arclineParams.startAngle)
  // const x2 = arclineParams.radius * Math.cos(arclineParams.endAngle)
  // const y2 = arclineParams.radius * Math.sin(arclineParams.endAngle)
  // const path =  `M ${x1} ${y1} A ${arclineParams.radius} ${arclineParams.radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`

  // Instead calcualted circles and arcs directly
  let path = ''
  for (var i = as; i <= ae; i++) {

    var x = (arclineParams.radius * Math.cos((i)*Math.PI/180)) + 0
    var y = (arclineParams.radius * Math.sin((i)*Math.PI/180)) + 0

    if (!path) {
      path = `M${x} ${y}`
    } else {
      path = `${path} L${x} ${y}`
    }
  }
  path = `${path}`
  return path
}