import * as d3 from 'd3'
import rough from 'https://cdn.skypack.dev/roughjs'

export function roughUp(path) {

  // None of this worked when I declared the svg at the module level
  const svg = d3.select('body').append('svg').classed('display', 'none')
  const rc = rough.svg(svg)

  const gNode = rc.path(path, { 
    fill: 'blue'
  }) 
  // Returns a node - g element
  // Note closed path will return two paths - one for hatching and one outline 
  // console.log(gNode)

  // Add node to the svg
  svg.node().appendChild(gNode)
  // Get the path
  const svgPath = svg.select('path').attr('d')
  //console.log('svgPath', svgPath)

  // Destroy the svg
  svg.remove()

  return svgPath
}
