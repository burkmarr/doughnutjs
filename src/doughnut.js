import * as d3 from 'd3'
import { addDef, fetchYaml } from './general'

function createChart(selector, data) {

  console.log('data', data)
  
  const imgSize = 500
  const svgWidth = imgSize * 1.6
  const svgHeight = imgSize * 1.25
  const earthRadius = imgSize / 2
  const textSize = imgSize / 30

  // Five marked zones
  const zoneDeltaRadius = earthRadius / 5

  const svg = d3.select(selector).append('svg')
  svg.style('border-style', ' solid')
  //svg.style('width', svgWidth).attr('height', svgHeight)
  svg.attr("viewBox", "0 0 " + svgWidth + " " +  svgHeight)
  svg.style('overflow', 'visible')
  const img = svg.append('image').attr('xlink:href', 'images/rockstrom-earth.png')
  //const img = svg.append('image').attr('xlink:href', 'images/stockholm-earth.png')
  img.style('width', imgSize).style('height', imgSize)
  img.attr('transform', `translate(${(svgWidth-imgSize)/2} ${(svgHeight-imgSize)/2})`)

  // Text style for Rockstrom 2009
  addDef(svg, 'whiteOutlineEffect')

  // Nine planetary systems
  const deltaAngle = 2 * Math.PI / 9
  const startAngle = -deltaAngle / 2
  const startAngleSpoke = -deltaAngle / 2 - 2 * Math.PI / 4

  // Arcs
  const arcs = [
    {
      key: 'safe-zone',
      colour: '#6D9100', //'#7AB15C',
      innerRadius: 0,
      outerRadius: 2 * zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'safe'
    },
    {
      key: 'climate-change',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 3 * zoneDeltaRadius,
      startAngle: startAngle,
      endAngle: startAngle + deltaAngle,
      type: 'system'
    },
    {
      key: 'ocean-ccidification',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 1.5 * zoneDeltaRadius,
      startAngle: startAngle + deltaAngle,
      endAngle: startAngle + 2 * deltaAngle,
      type: 'system'
    },
    {
      key: 'ozone-depletion',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 0.8 * zoneDeltaRadius,
      startAngle: startAngle + 2 * deltaAngle,
      endAngle: startAngle + 3 * deltaAngle,
      type: 'system'
    },
    {
      key: 'nitrogen-cycle',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 6.6 * zoneDeltaRadius,
      startAngle: startAngle + 3 * deltaAngle,
      endAngle: startAngle + 3.5 * deltaAngle,
      type: 'system'
    },
    {
      key: 'phosphorous-cycle',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 1.8 * zoneDeltaRadius,
      startAngle: startAngle + 3.5 * deltaAngle,
      endAngle: startAngle + 4 * deltaAngle,
      type: 'system'
    },
    {
      key: 'freshwater-use',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 1.1 * zoneDeltaRadius,
      startAngle: startAngle + 4 * deltaAngle,
      endAngle: startAngle + 5 * deltaAngle,
      type: 'system'
    },
    {
      key: 'landuse-change',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 1.2 * zoneDeltaRadius,
      startAngle: startAngle + 5 * deltaAngle,
      endAngle: startAngle + 6 * deltaAngle,
      type: 'system'
    },
    {
      key: 'biodiversity-loss',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 8 * zoneDeltaRadius,
      startAngle: startAngle + 6 * deltaAngle,
      endAngle: startAngle + 7 * deltaAngle,
      type: 'system'
    },
    {
      key: 'aerosol-loading',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 0,
      startAngle: startAngle + 7 * deltaAngle,
      endAngle: startAngle + 8 * deltaAngle,
      type: 'system'
    },
    {
      key: 'chemical-pollution',
      colour: 'red',
      innerRadius: 0,
      outerRadius: 0,
      startAngle: startAngle + 8 * deltaAngle,
      endAngle: startAngle + 9 * deltaAngle,
      type: 'system'
    },
    {
      key: 'zone-1',
      colour: '#A6D800',
      innerRadius: zoneDeltaRadius-1,
      outerRadius: zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'zone'
    },
    {
      key: 'zone-2',
      colour: '#A6D800',
      innerRadius: 2*zoneDeltaRadius-1,
      outerRadius: 2*zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'zone'
    },
    {
      key: 'zone-3',
      colour: 'red',
      innerRadius: 3*zoneDeltaRadius-1,
      outerRadius: 3*zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'zone'
    },
    {
      key: 'zone-4',
      colour: 'red',
      innerRadius: 4*zoneDeltaRadius-1,
      outerRadius: 4*zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'zone'
    },
    {
      key: 'zone-5',
      colour: 'red',
      innerRadius: 5*zoneDeltaRadius-1,
      outerRadius: 5*zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'zone'
    },
    {
      key: 'text1',
      colour: 'magenta',
      innerRadius: 0,
      outerRadius: 5.2*zoneDeltaRadius,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      type: 'text',
      opacity: 0
    },

  ]

  // Lines
  const spokes = [
    {
      key: 'none',
      angle: startAngleSpoke,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 2 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 3 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 3.5 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 4 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 5 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 6 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 7 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },
    {
      key: 'none',
      angle: startAngleSpoke + 8 * deltaAngle,
      startDistance: 0,
      endDistance: 5 * zoneDeltaRadius,
    },

    {
      key: 'none',
      angle: startAngleSpoke,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 2 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 3 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 3.5 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 4 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 5 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 6 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 7 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
    {
      key: 'none',
      angle: startAngleSpoke + 8 * deltaAngle,
      startDistance: 5 * zoneDeltaRadius,
      endDistance: 6 * zoneDeltaRadius,
      dashArray: '2'
    },
  ]

  const deltaText = zoneDeltaRadius * 0.35
  const startText = earthRadius + zoneDeltaRadius * 0.15
  // Text
  const text = [
    {
      key: 'cc-text',
      distance: startText, 
      startAngle: startAngle,
      endAngle: deltaAngle,
      text: 'Climate change'
    },
    {
      key: 'oa-text',
      distance: startText,
      startAngle: startAngle + deltaAngle,
      endAngle: deltaAngle,
      text: 'Ocean acidification'
    },
    {
      key: 'strat1-text',
      distance: startText + deltaText,
      startAngle: startAngle + 2 * deltaAngle,
      endAngle: deltaAngle,
      text: 'Stratospheric'
    },
    {
      key: 'strat2-text',
      distance: startText,
      startAngle: startAngle + 2 * deltaAngle,
      endAngle: deltaAngle,
      text: 'ozone depletion'
    },
    {
      key: 'biogeochem1-text',
      distance: startText + 3 * deltaText,
      startAngle: startAngle + 3 * deltaAngle,
      endAngle: deltaAngle/2,
      text: 'Nitrogen'
    },
    {
      key: 'biogeochem2-text',
      distance: startText + 2 * deltaText,
      startAngle: startAngle + 3 * deltaAngle,
      endAngle: deltaAngle/2,
      text: 'cycle'
    },
    {
      key: 'biogeochem3-text',
      distance: startText + 3 * deltaText,
      startAngle: startAngle + 3.5 * deltaAngle,
      endAngle: deltaAngle/2,
      text: 'Phospherous'
    },
    {
      key: 'biogeochem4-text',
      distance: startText + 2 * deltaText,
      startAngle: startAngle + 3.5 * deltaAngle,
      endAngle: deltaAngle/2,
      text: 'cycle'
    },
    {
      key: 'biogeochem5-text',
      distance: startText + deltaText,
      startAngle: startAngle + 3 * deltaAngle,
      endAngle: deltaAngle,
      text: '(biogeochemical'
    },
    {
      key: 'biogeochem6-text',
      distance: startText,
      startAngle: startAngle + 3 * deltaAngle,
      endAngle: deltaAngle,
      text: 'flow boundary)'
    },
    {
      key: 'freshwater1-text',
      distance: startText + deltaText,
      startAngle: startAngle + 4 * deltaAngle,
      endAngle: deltaAngle,
      text: 'Global'
    },
    {
      key: 'freshwater2-text',
      distance: startText,
      startAngle: startAngle + 4 * deltaAngle,
      endAngle: deltaAngle,
      text: 'freshwater use'
    },
    {
      key: 'landuse-text',
      distance: startText,
      startAngle: startAngle + 5 * deltaAngle,
      endAngle: deltaAngle,
      text: 'Change in land use'
    },
    {
      key: 'biodiversity-text',
      distance: startText,
      startAngle: startAngle + 6 * deltaAngle,
      endAngle: deltaAngle,
      text: 'Biodiversity loss'
    },
    {
      key: 'biodiversity1-text',
      distance: startText + 2 * deltaText,
      startAngle: startAngle + 7 * deltaAngle,
      endAngle: deltaAngle,
      text: 'Atmoshperic'
    },
    {
      key: 'biodiversity2-text',
      distance: startText + deltaText,
      startAngle: startAngle + 7 * deltaAngle,
      endAngle: deltaAngle,
      text: 'aerosol loading'
    },
    {
      key: 'biodiversity3-text',
      distance: startText,
      startAngle: startAngle + 7 * deltaAngle,
      endAngle: deltaAngle,
      text: '(not yet quantified)'
    },
    {
      key: 'chemical1-text',
      distance: startText + deltaText,
      startAngle: startAngle + 8 * deltaAngle,
      endAngle: deltaAngle,
      text: 'Chemical pollution'
    },
    {
      key: 'chemical2-text',
      distance: startText,
      startAngle: startAngle + 8 * deltaAngle,
      endAngle: deltaAngle,
      text: '(not yet quantified)'
    },
  ]


  // https://observablehq.com/@d3/selection-join
  const gArcs = svg.append('g')
  const gSpokes = svg.append('g')
  const gText = svg.append('g')
  gArcs.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
  gSpokes.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
  gText.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)

  const t = svg.transition().delay(350).duration(2000) //.ease(d3.easeElasticOut.amplitude(1).period(0.4))

  gArcs.selectAll('.arc')
    .data(arcs, d => d.key)
    .join(
      enter => enter.append('path')
        .classed('arc', true)
        .attr('id', d => `arc-path-${d.key}`)
        .attr('d', d => {
          if (d.type === 'system') {
            const ed = {...d}
            ed.outerRadius = 1
            return d3.arc()(ed)
          } else {
            return d3.arc()(d)
          }
        })
        .style('fill', d => d.colour)
        .style('opacity', d => {
          if (typeof(d.opacity) !== 'undefined') {
            return d.opacity
          } else if(d.type === 'zone') {
            return 0.9
          } else {
            return 0.6
          }
        }),
      update => update
    )
    .call(remaining => remaining.transition(t)
      .attr('d', d => {
        return d3.arc()(d)
      })
    )

  gSpokes.selectAll('.spoke')
    .data(spokes, d => d.key)
    .join(
      enter => enter.append('path')
        .classed('spoke', true)
        .attr('d', d => getSpoke(d.angle, d.startDistance, d.endDistance))
        .style('stroke', d => d.colour ? d.colour : 'black')
        .style('stroke-dasharray', d => d.dashArray)
        .style('stroke-opacity', d => d.opacity ? d.opacity : 0.7)
    )

  gText.selectAll('.text-path')
    .data(text, d => d.key)
    .join(
      enter => enter.append('path')
        .classed('text-path', true)
        .attr('id', d => `text-path-${d.key}`)
        .attr('d', d => getArc(d.startAngle, d.endAngle, d.distance))
        .attr('stroke', 'none')
        .attr('fill', 'none')
    )

  gText.selectAll('.text-text')
    .data(text, d => d.key)
    .join(
      enter => enter.append("text")
        .classed('text-text', true)
        .style('font-family', 'arial')
        .style('font-size', textSize)
        .style('filter', 'url(#whiteOutlineEffect)')
        .style('opacity', 0),
      update => update
    ).call(remaining => {
      remaining.append('textPath') 
        .attr('xlink:href', d => `#text-path-${d.key}`) 
        .style('text-anchor','middle') 
        .attr('startOffset', '50%')
        .text(d => d.text),
      remaining.transition(t).style('opacity', 1)
    })
    
  function getSpoke(angleRad, startDistance, endDistance) {
    const x0 = startDistance * Math.cos(angleRad)
    const y0 = startDistance * Math.sin(angleRad)
    const x1 = endDistance * Math.cos(angleRad)
    const y1 = endDistance * Math.sin(angleRad)

    //console.log('ret',d3.line()([[x0,y0], [x1,y1]]))

    return d3.line()([[x0,y0], [x1,y1]])
  }

  function getArc(startAngleRad, deltaAngleRad, radius) {

    const startAngleRad1 = startAngleRad - 2 * Math.PI / 4

    const x1 = radius * Math.cos(startAngleRad1)
    const y1 = radius * Math.sin(startAngleRad1)
    const x2 = radius * Math.cos(startAngleRad1 + deltaAngleRad)
    const y2 = radius * Math.sin(startAngleRad1 + deltaAngleRad)
    const path =  `M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`
    return path
  }
}

export function doughnut({
  selector = 'body'
} = {}) {

  // Return API
  function loadYaml(file) {
    const data = fetchYaml(file).then(data => {
      createChart(selector, data)
    })
    
  }

  return {
    loadYaml: loadYaml,
  }
}
