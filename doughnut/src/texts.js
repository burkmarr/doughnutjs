import * as d3 from 'd3'

export function createTextElements(g, texts, trans, currentTextParams, globals) {

  // Text paths
  g.selectAll('.path-text')
    .data(texts, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
          .classed('path-text', true)
          .attr('id', d => `path-text-${d.id}`)

        return pathForTextCommonAttrs(sel, 0)
      },
      update => update,
      exit => pathForTextCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining =>pathForTextCommonAttrs(remaining.transition(trans), 1))

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
          .attr('xlink:href', d => `#path-text-${d.id}`) 
          .style('text-anchor', d => d.textAlign) 
          .attr('startOffset', d => {
            switch(d.textAlign) {
              case 'start':
                return '0%'
              case 'end':
                return '100%'
              default:
                return '50%'
            }
          })
        return textTextCommonAttrs(sel, 0)
      },
      update => update,
      exit => textTextCommonAttrs(exit.transition(trans), 2).remove()
  )
  .call(remaining =>textTextCommonAttrs(remaining.transition(trans), 1))

  function pathForTextCommonAttrs(selection, i) {

    if (i === 0) {
      selection.attr('d', d => getTextPath(d, getTextParams(d,i), globals))
    } else {
      selection.attrTween('d', d => {
        return textPathTween(d, i)
      })
    }
    return selection
      .style('stroke', 'none')
      .style('fill', 'none')
      .attr('transform', d => {
        const params = getTextParams(d, i)
        let x0 = params.radius * Math.cos(params.angle)
        let y0 = params.radius * Math.sin(params.angle)
        return `rotate(${d.rot[i]},${x0},${y0})`
      })
  }

  function textPathTween(d, i) {

    const s = d.currentTextParams
    const e = getTextParams(d, i)

    const iRadius = d3.interpolate(s.radius, e.radius)
    const iAngle = d3.interpolate(s.angle, e.angle)
    const iTextOffset = d3.interpolate(s.textOffset, e.textOffset)

    return function(t) {
      d.currentTextParams = {
        radius: iRadius(t),
        angle: iAngle(t),
        textOffset: iTextOffset(t),
      }
      currentTextParams[d.id] = d.currentTextParams
      return getTextPath(d, d.currentTextParams, globals)
    }
  }

  function textTextCommonAttrs(selection, i) {
    selection
      .style('opacity', d => d.opacity ? d.opacity[i] : null)
      .style('font-weight', d => d.fontWeight[i])
      .style('font-size', d => d.fontSize[i])
      .style('fill', d => d.fontColour)
      .attr('letter-spacing', d => d.textSpacing)
      // .style('stroke', d => d.fontStroke)
      // .style('stroke-width',0.5)

    return selection
  }
}

export function initialiseTextParameters (texts, currentTextParams) {
  // For all texts, update currentTextParams if a text
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
    angle: (d.angle[i] - 90) * Math.PI / 180,
    textOffset: d.textOffset ? d.textOffset[i] : 0,
  }
}

function getTextPath(d, textParams, globals) {

  // Todo - path style tan
  // https://www.bbc.co.uk/bitesize/guides/zc62srd/revision/6
  
  if (d.textPathStyle === 'arc') {
    return getArcPath(d, textParams)
  } else {
    return getLinePath(d, textParams, globals)
  }
}

function getArcPath(d, textParams) {

  const a0 = textParams.angle
  let as, ae

  if (d.textAlign === 'middle') {
    if (d.textReverse) {
      as =  a0 + Math.PI
      ae =  a0 - Math.PI
    } else {
      as =  a0 - Math.PI
      ae =  a0 + Math.PI
    }
  } else { // textAlign start or end
    if (d.textReverse) {
      as =  a0 + 2 * Math.PI
      ae =  a0 
    } else {
      as =  a0 - 2 * Math.PI
      ae =  a0
    }
  }
  
  let path = ''
  const incr = x => {
    const i = d.textReverse ? -0.1 : 0.1
    if (x === ae) return x+i
    if (d.textReverse ? x+i < ae : x+i > ae) return ae
    return x+i
  }
  for (let i = as; d.textReverse ? i >= ae : i <= ae; i=incr(i)) {

    const x = (textParams.radius + textParams.textOffset) * Math.cos(i)
    const y = (textParams.radius + textParams.textOffset) * Math.sin(i) 

    if (!path) {
      path = `M${x} ${y}`
    } else {
      path = `${path} L${x} ${y}`
    }
  }
  path = `${path}`
  return path
}

function getLinePath(d, textParams, globals) {

  const x0 = textParams.radius * Math.cos(textParams.angle)
  const y = textParams.radius * Math.sin(textParams.angle) - textParams.textOffset
  let x1, x2
  const twidth = 100

  if (d.textAlign === 'middle') {
    if (d.textReverse) {
      x1 = x0 + twidth / 2
      x2 = x0 - twidth / 2
    } else {
      x1 = x0 - twidth / 2
      x2 = x0 + twidth / 2
    }
  } else if (d.textAlign === 'start') {
    if (d.textReverse) {
      x1 = x0
      x2 = x0 - twidth
    } else {
      x1 = x0
      x2 = x0 + twidth
    }
  } else { // d.textAlign === 'end'
    if (d.textReverse) {
      x1 = x0 + twidth
      x2 = x0
    } else {
      x1 = x0 - twidth
      x2 = x0
    }
  }
  const path = `M${x1} ${y} L${x2} ${y}`
  return path
}

