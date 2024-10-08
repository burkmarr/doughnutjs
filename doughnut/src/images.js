import * as d3 from 'd3'

export function createImageElements(g, images, trans, currentImageParams) {
  // Images
  g.selectAll('.img')
    .data(images, d => d.id)
    .join(
      enter => {
        const sel = enter.append('image')
          .attr('xlink:href', d => d.location)
          .classed('img', true)
        return imageCommonAttrs(sel, 0)
      },
      update => update,
      exit => imageCommonAttrs(exit.transition(trans), 2).remove()
    )
    .call(remaining => imageCommonAttrs(remaining.transition(trans), 1))

  function imageCommonAttrs(selection, i) {

    selection
      .attr('width', d => d.width[i])
      .attr('height', d => d.width[i])
      .attr('transform-origin', d => `${d.width[i]/2}px ${d.width[i]/2}px`)

    if (i === 0) {
      selection.attr('transform', d => {
        const oxy = getOffset(d.angle[i], d.radius[i])
        const deltaWidth = -d.width[i]/2 + oxy[0]
        const deltaHeight = -d.width[i]/2 + oxy[1]
        return `
          translate(${deltaWidth}, ${deltaHeight}) 
          rotate(${d.rot[i]}) 
        `
      })
    } else {
      selection.attrTween('transform', d => {
        return imageTween(d, i)
      })
    }
    selection.style('opacity', d => d.opacity[i])

    return selection
  }

  function imageTween(d, i) {

    const iAng = d3.interpolate(d.currentImageParams.angle, d.angle[i])
    const iWidth = d3.interpolate(d.currentImageParams.width, d.width[i])
    const iRad = d3.interpolate(d.currentImageParams.radius, d.radius[i])
    const iRot = d3.interpolate(d.currentImageParams.rot, d.rot[i])

    return function(t) {

      d.currentImageParams = {
        angle: iAng(t),
        width: iWidth(t),
        radius: iRad(t),
        rot: iRot(t)
      }
      const oxy = getOffset(iAng(t), iRad(t))
      const deltaWidth = -iWidth(t)/2 + oxy[0]
      const deltaHeight = -iWidth(t)/2 + oxy[1]

      currentImageParams[d.id] = {...d.currentImageParams}
      return `
        translate(${deltaWidth}, ${deltaHeight}) 
        rotate(${iRot(t)}) 
      `
    }
  }
}

export function initialiseImageParameters(images, currentImageParams) {
  // For all images, update currentImageParams if an image
  // with that id has already been used
  images.forEach(i => {
    if (currentImageParams[i.id]) {
      i.currentImageParams = currentImageParams[i.id]
    }
  })
  // Remove any properties of currentImageParams that
  // have no corresponding key in current arcs
  Object.keys(currentImageParams).forEach(k => {
    if (!images.find(i => i.id === k)) {
      delete currentImageParams[k]
    }
  })
}

function getOffset(angle, radius) {
  const angleRad = (angle - 90) * Math.PI / 180
  const x0 = radius * Math.cos(angleRad)
  const y0 = radius * Math.sin(angleRad)
  return [x0,y0]
}
