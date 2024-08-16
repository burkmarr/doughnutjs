import * as d3 from 'd3'

export function createArrowElements(g, arrows, trans, currentArrowParams) {

  g.selectAll('.arrow')
    .data(arrows, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
          .classed('arrow', true)
          .attr('id', d => `arrow-path-${d.id}`)

        return arrowCommonAttrs(sel, 0)
      },
      update => update,
      exit => arrowCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining => arrowCommonAttrs(remaining.transition(trans), 1))

  function arrowCommonAttrs(selection, i) {
    if (i === 0) {
      selection.attr('d', d => arrow(getArrowParams(d,i)))
    } else {
      selection.attrTween('d', d => {
          return arrowTween(d, i)
        })
    }
    
    return selection
      .style('fill', d => {
        if (d.colour[i].startsWith('def-')) {
          return `url(#${d.colour[i].substring(4)})`
        } else {
          return d.colour[i]
        }
      })
      .style('stroke', d => d.stroke ? d.stroke[i] : null)
      .style('stroke-width', d => d['strokeWidth'] ? d['strokeWidth'][i] : null)
      .style('stroke-dasharray', d => d['strokeDasharray'] ? d['strokeDasharray'][i].replace('-', ' ') : null)
      .style('opacity', d => d.opacity ? d.opacity[i] : null)
      .attr('transform', d => {
        const params = getArrowParams(d, i)
        let x0 = params.radius * Math.cos(params.angle - Math.PI/2)
        let y0 = params.radius * Math.sin(params.angle - Math.PI/2)
        return `rotate(${d.rot[i]},${x0},${y0})`
      })
  }

  function arrowTween(d, i) {

    const s = d.currentArrowParams
    const e = getArrowParams(d, i)

    const iRadius = d3.interpolate(s.radius, e.radius)
    const iAngle = d3.interpolate(s.angle, e.angle)
    const iAl1 = d3.interpolate(s.al1, e.al1)
    const iAl5 = d3.interpolate(s.al5, e.al5)
    const iAl28 = d3.interpolate(s.al28, e.al28)
    const iAl37 = d3.interpolate(s.al37, e.al37)
    const iAl46 = s.al46 !== null ? d3.interpolate(s.al46, e.al46) : null
    const iAw28 = d3.interpolate(s.aw28, e.aw28)
    const iAw37 = d3.interpolate(s.aw37, e.aw37)
    const iAw46 = d3.interpolate(s.aw46, e.aw46)
    
    return function(t) {
      d.currentArrowParams = {
        radius: iRadius(t),
        angle: iAngle(t),
        al1: iAl1(t),
        al5: iAl5(t),
        al28: iAl28(t),
        al37: iAl37(t),
        al46: iAl46 !== null ? iAl46(t) : null,
        aw28: iAw28(t),
        aw37: iAw37(t),
        aw46: iAw46(t),
      }
      currentArrowParams[d.id] = d.currentArrowParams
      return arrow(d.currentArrowParams)
    }
  }
}

export function initialiseArrowParameters (arrows, currentArrowParams) {
  // For all arrows, update currentArrowParams if an arrow
  // with that id has already been used
  arrows.forEach(a => {
    if (currentArrowParams[a.id]) {
      a.currentArrowParams = currentArrowParams[a.id]
    }
  })
  // Remove any properties of currentArrowParams that
  // have no corresponding key in current arrows
  Object.keys(currentArrowParams).forEach(k => {
    if (!arrows.find(a => a.id === k)) {
      delete currentArrowParams[k]
    }
  })
}

export function getArrowParams (d, i) {
  return {
    radius: d.radius[i],
    angle: (d.angle[i]) * Math.PI / 180,
    al1: d.al1[i],
    al5: d.al5[i],
    al28: d.al28[i],
    al37: d.al37[i],
    al46: typeof d.al46 !== 'undefined' && d.al46 !== null ? d.al46[i] : null,
    aw28: d.aw28[i],
    aw37: d.aw37[i],
    aw46: d.aw46[i],
  }
}

function arrow(ap) {

  const x1 = 0
  const y1 = ap.radius+ap.al1
  const x2 = ap.aw28
  const y2 = ap.radius+ap.al28
  const x3 = ap.aw37
  const y3 = ap.radius+ap.al37
  const x4 = ap.al46 === null && ap.aw46 > ap.radius-ap.al5 ? ap.radius-ap.al5 : ap.aw46
  const y4 = ap.al46 !== null ? ap.radius-ap.al46 : 0
  const x5 = 0
  const y5 = ap.radius-ap.al5
  const x6 = ap.al46 === null && ap.aw46 > ap.radius-ap.al5 ? -(ap.radius-ap.al5) : -ap.aw46
  const y6 = ap.al46 !== null ? ap.radius-ap.al46 : 0
  const x7 = -ap.aw37
  const y7 = ap.radius+ap.al37
  const x8 = -ap.aw28
  const y8 = ap.radius+ap.al28
  
  let points
  if (ap.al46 !== null) {
    points= [[x1, y1], [x2, y2],[x3, y3], [x4, y4], [x5, y5], [x6, y6], [x7, y7], [x8, y8], [x1, y1]]
  } else {
    // al46 is not specified which signifies that the base of the 
    // arrow is to be an arc of radius y5 and chord length 2*aw46.
    points= [[x1, y1], [x2, y2],[x3, y3]]
    const aw46 = ap.aw46 > ap.radius ? ap.radius : ap.aw46
    const angleStart = Math.acos(aw46/ap.radius)
    const angleEnd = Math.acos(-aw46/ap.radius)
    const angles = [angleStart]
    for (let angle=angleStart; angle<angleEnd; angle=angle+Math.PI/180) {
      angles.push(angle)
    }
    angles.push(angleEnd)
    angles.forEach(angle => {
      const x = Math.round(10 * y5 * Math.cos(angle))/10
      const y = Math.round(10 * y5 * Math.sin(angle))/10
      points.push([x, y])
    })
    points = [...points, [x7, y7], [x8, y8], [x1, y1]]
  }

  // Transform the points to the specified angle
  const angle = ap.angle - Math.PI
  const transPoints= points.map(p => {
    const x = p[0] * Math.cos(angle) - p[1] * Math.sin(angle)
    const y = p[1] * Math.cos(angle) + p[0] * Math.sin(angle)
    return [x, y]
  })
  let path = ''
  transPoints.forEach((p,i) => {
    const op = i ? 'L' : ' M'
    path = `${path}${op}${p[0]} ${p[1]}`
  })
  return path
}


