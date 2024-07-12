import * as d3 from 'd3'

export function createTextElements(g, texts, trans, currentTextParams) {

  // Text paths
  g.selectAll('.text-path')
    .data(texts, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
          .classed('text-path', true)
          .attr('id', d => `text-path-${d.id}`)

        return textPathCommonAttrs(sel, 0)
      },
      update => update,
      exit => textPathCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining =>textPathCommonAttrs(remaining.transition(trans), 1))

  // Text text
  g.selectAll('.text-text')
    .data(texts, d => d.id)
    .join(
      enter => {
        const sel = enter.append('text')
          .classed('text-text', true)
          .style('font-family', d => d.fontFamily)
          .style('font-style', d => d.fontStyle) 
          .style('filter', d => `url(#${d.fontFilter})`)
        sel.append('textPath') 
          .text(d => d.text)
          .attr('xlink:href', d => `#text-path-${d.id}`) 
          .style('text-anchor','middle') 
          .attr('startOffset', '50%')
        return textTextCommonAttrs(sel, 0)
      },
      update => update,
      exit => textTextCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining =>textTextCommonAttrs(remaining.transition(trans), 1))

  function textPathCommonAttrs(selection, i) {
    if (i === 0) {
      selection.attr('d', d => arcLine(getTextParams(d,i)))
    } else {
      selection.attrTween('d', d => {
        return textPathTween(d, i)
      })
    }
    return selection
      .style('stroke', 'none')
      .style('fill', 'none')
  }

  function textPathTween(d, i) {

    const s = d.currentTextParams
    const e = getTextParams(d, i)

    const iRadius = d3.interpolate(s.radius, e.radius)
    const iStartAngle = d3.interpolate(s.startAngle, e.startAngle)
    const iEndAngle = d3.interpolate(s.endAngle, e.endAngle)

    return function(t) {
      d.currentTextParams = {
        radius: iRadius(t),
        startAngle: iStartAngle(t),
        endAngle: iEndAngle(t)
      }
      currentTextParams[d.id] = d.currentTextParams
      return arcLine(d.currentTextParams)
    }
  }

  function textTextCommonAttrs(selection, i) {
    selection
      .style('opacity', d => d.opacity ? d.opacity[i] : null)
      .style('font-weight', d => d.fontWeight)
      .style('font-size', d => d.fontSize[i])
      .style('fill', d => d.fontColour)

    return selection
  }
}

export function initialiseTextParameters (texts, currentTextParams) {
  // For all texst, update currentTextParams if a text
  // with that id has already been used
  texts.forEach(a => {
    if (currentTextParams[a.id]) {
      a.currentTextParams = currentTextParams[a.id]
    }
  })
  // Remove any properties of currentTextParams that
  // have no corresponding key in current texts
  Object.keys(currentTextParams).forEach(k => {
    if (!texts.find(t => t.id === k)) {
      delete currentTextParams[k]
    }
  })
}

export function getTextParams (d, i) {
  return {
    radius: d.radius[i],
    startAngle: (d.angle1[i] - 90) * Math.PI / 180,
    endAngle: (d.angle2[i] - 90) * Math.PI / 180,
  }
}

function arcLine(textParams) {
  const as = Math.round(textParams.startAngle * 180 / Math.PI)
  const ae = Math.round(textParams.endAngle * 180 / Math.PI)

  let path = ''
  for (var i = as; i <= ae; i++) {

    var x = (textParams.radius * Math.cos((i)*Math.PI/180)) + 0
    var y = (textParams.radius * Math.sin((i)*Math.PI/180)) + 0

    if (!path) {
      path = `M${x} ${y}`
    } else {
      path = `${path} L${x} ${y}`
    }
  }
  path = `${path}`
  return path
}