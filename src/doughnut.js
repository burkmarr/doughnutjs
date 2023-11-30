import * as d3 from 'd3'
import { addDef, fetchYaml } from './general.js'
import { postprocessData, getArcParams } from './data.js'

export async function doughnut({
  selector = 'body',
  data = []
} = {}) {

  let iLastChart = null
  let svg, gImages, radius_px, angle_origin, svgWidth, svgHeight
  let currentArcParams = {}

  // Load test data
  data = await loadYaml('./data/test1.yaml')

  console.log('data', JSON.parse(JSON.stringify(data)))
  await postprocessData(data)
  console.log('postprocessData', data)

  const imgSize = 300
  const earthRadius = imgSize / 2
  const textSize = imgSize / 30

  // Five marked zones
  const zoneDeltaRadius = earthRadius / 5

  svgWidth = data.canvas.width_px
  svgHeight = data.canvas.height_px

  svg = d3.select(selector).append('svg')
  svg.attr("viewBox", "0 0 " + svgWidth + " " +  svgHeight)
  svg.style('overflow', 'visible')

  radius_px = data.canvas.radius_px
  angle_origin = data.canvas.angle_origin
  //const svgRealWidth = d3.select(selector).node().offsetWidth

  //console.log('svgRealWidth', svgRealWidth)
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
  gImages = svg.append('g')
  const gArcs = svg.append('g')
  const gSpokes = svg.append('g')
  const gText = svg.append('g')
  //gImages.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
  gArcs.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
  gSpokes.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
  gText.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)

  const t = svg.transition().delay(350).duration(2000) //.ease(d3.easeElasticOut.amplitude(1).period(0.4))


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

  // gText.selectAll('.text-path')
  //   .data(text, d => d.key)
  //   .join(
  //     enter => enter.append('path')
  //       .classed('text-path', true)
  //       .attr('id', d => `text-path-${d.key}`)
  //       .attr('d', d => getArc(d.startAngle, d.endAngle, d.distance))
  //       .attr('stroke', 'none')
  //       .attr('fill', 'none')
  //   )

  // gText.selectAll('.text-text')
  //   .data(text, d => d.key)
  //   .join(
  //     enter => enter.append("text")
  //       .classed('text-text', true)
  //       .style('font-family', 'arial')
  //       .style('font-size', textSize)
  //       .style('filter', 'url(#whiteOutlineEffect)')
  //       .style('opacity', 0),
  //     update => update
  //   ).call(remaining => {
  //     remaining.append('textPath') 
  //       .attr('xlink:href', d => `#text-path-${d.key}`) 
  //       .style('text-anchor','middle') 
  //       .attr('startOffset', '50%')
  //       .text(d => d.text),
  //     remaining.transition(t).style('opacity', 1)
  //   })

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

  function getOffset(angle, rad) {
    const angleRad = (angle + angle_origin - 90) * Math.PI / 180
    const x0 = rad * Math.cos(angleRad)
    const y0 = rad * Math.sin(angleRad)
    return [x0,y0]
  }

  // Return API

  function updateChart(iChart) {

    console.log("Display chart", iChart)

    // For all arcs, update currentArcParams if an arc
    // with that id has already been used
    data.charts[iChart].arcs.forEach(a => {
      if (currentArcParams[a.id]) {
        a.currentArcParams = currentArcParams[a.id]
      }
    })
    // Remove any properties of currentArcParams that
    // have no corresponding key in current arcs
    Object.keys(currentArcParams).forEach(k => {
      if (!data.charts[iChart].arcs.find(a => a.id === k)) {
        delete currentArcParams[k]
      }
    })

    const trans = svg.transition().delay(0).duration(2000) //.ease(d3.easeElasticOut.amplitude(1).period(0.4))

    // Remeber current chart as the last chart
    iLastChart = iChart

    // Images
    gImages.selectAll('.img')
    .data(data.charts[iChart].images, d => d.id)
    .join(
      enter => {
        const sel = enter.append('image')
        .classed('img', true)
        .attr('xlink:href', d => d.location)
        //.attr('id', d => `img-${d.key}`)
        //.style('outline', '2px red solid')

        return imageCommonAttrs(sel, 0)
      },
      update => update,
      exit => imageCommonAttrs(exit.transition(trans), 2).remove()
    )
    .call(remaining => imageCommonAttrs(remaining.transition(trans), 1))

    function imageCommonAttrs(selection, i) {

      return selection
        .attr('width', d => d.width[i])
        .attr('transform-origin', d => {
          const imgWidth = d.width[i] 
          const imgHeight = d.width[i] / d.aspectRatio
          return `${imgWidth/2}px ${imgHeight/2}px`
        })
        .attr('transform', d => {
          const oxy = getOffset(d.ang[i], d.rad[i])
          const imgWidth = d.width[i]
          const imgHeight = d.width[i] / d.aspectRatio
          return `
            translate(${(svgWidth - imgWidth) / 2 + oxy[0]}, ${(svgHeight - imgHeight) / 2  + oxy[1]}) 
            rotate(${d.rot[i]}) 
          `
        })
        .style('opacity', d => d.opacity[i])
    }

    // Arcs
    const arc =  d3.arc()
    gArcs.selectAll('.arc')
    .data(data.charts[iChart].arcs, d => d.id)
    .join(
      enter => {
        const sel = enter.append('path')
        .classed('arc', true)
        .attr('id', d => `arc-path-${d.id}`)

        return arcCommonAttrs(sel, 0)
      },
      update => update,
      exit => arcCommonAttrs(exit, 2).remove()
    )
    .call(remaining => arcCommonAttrs(remaining, 1))

    function arcCommonAttrs(selection, i) {
      if (i === 0) {
        selection.attr('d', d => arc(getArcParams(d,i)))
      } else {
        selection.transition(trans)
          .attrTween('d', d => {
            return arcTween(d, i)
          })
      }
      return selection.style('fill', d => d.colour)
        .style('opacity', d => {
          return 0.6
        })
    }
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
      return arc()
    }
  }

  async function loadYaml(file) {
    const json = await fetchYaml(file)
    return json
  }

  function displayChart(i) {
    let iChart
    if (i === null) {
      iChart = 0
    } else if (i > data.charts.length - 1 ) {
      iChart =  data.charts.length - 1
    } else if (i < 1){
      iChart = 0
    } else {
      iChart = i-1
    }
    updateChart(iChart)
  }

  function displayNextChart() {
    let iChart
    if (iLastChart === null) {
      iChart = 0
    } else if (iLastChart === data.charts.length - 1 ) {
      iChart = 0
    } else {
      iChart = iLastChart + 1
    }
    updateChart(iChart)
  }

  function displayPreviousChart() {
    let iChart
    if (iLastChart === null) {
      iChart = 0
    } else if (iLastChart === 0 ) {
      iChart = data.charts.length - 1
    } else {
      iChart = iLastChart - 1
    }
    updateChart(iChart)
  }

  return {
    loadYaml: loadYaml,
    displayChart: displayChart,
    displayNextChart: displayNextChart,
    displayPreviousChart: displayPreviousChart
  }
}
