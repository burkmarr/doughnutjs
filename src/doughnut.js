import * as d3 from 'd3'
import { old } from './old-stuff.js'
import { addDef, fetchYaml } from './general.js'
import { postprocessData, getArcParams, getArclineParams, arcLine } from './data.js'

export async function doughnut({
  selector = 'body',
  data = []
} = {}) {

  let iLastChart = null
  let svg, svgWidth, svgHeight
  let gImages, gArcs, gArclines, gSpokes, gText
  let currentArcParams = {}
  let currentArclineParams = {}

  async function initFromRecipe() {
    // Need some stuff to deal with retaining or
    // refreshing current globals and defaults(?)
    // from previous recipe

    console.log('data', JSON.parse(JSON.stringify(data)))
    await postprocessData(data)
    console.log('postprocessData', data)
  
    if (!svg) {
      svgWidth = data.globals.width_px
      svgHeight = data.globals.height_px
    
      svg = d3.select(selector).append('svg')
      svg.attr("viewBox", "0 0 " + svgWidth + " " +  svgHeight)
      svg.style('overflow', 'visible')
    
      //  Old visualisation
      //old(d3, svg, 350)
    
      // Text style for Rockstrom 2009
      addDef(svg, 'whiteOutlineEffect')
    
      gImages = svg.append('g')
      gArcs = svg.append('g')
      gSpokes = svg.append('g')
      gText = svg.append('g')
      gArcs.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
      gSpokes.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)
      gText.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`) 
    }
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

    // For all arclines, update currentArclineParams if an arc
    // with that id has already been used
    data.charts[iChart].arclines.forEach(a => {
      if (currentArclineParams[a.id]) {
        a.currentArclineParams = currentArclineParams[a.id]
      }
    })
    // Remove any properties of currentArclineParams that
    // have no corresponding key in current arcs
    Object.keys(currentArclineParams).forEach(k => {
      if (!data.charts[iChart].arclines.find(a => a.id === k)) {
        delete currentArclineParams[k]
      }
    })

    const trans = svg.transition().delay(0).duration(data.globals.duration)
    .ease(d3.easeLinear) //.ease(d3.easeElasticOut.amplitude(1).period(0.4))

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
          const oxy = getOffset(d.ang[i], d.rad[i], d.angle_origin)
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

      return selection
    }

    // Arcliness
    gArcs.selectAll('.arcline')
      .data(data.charts[iChart].arclines, d => d.id)
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
        //selection.attr('d', d => arcline(getArclineParams(d,i)))
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

      return selection
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

  function arclineTween(d, i) {

    const s = d.currentArclineParams
    const e = getArclineParams(d, i)

    const iRadius = d3.interpolate(s.radius, e.radius)
    const iStartAngle = d3.interpolate(s.startAngle, e.startAngle)
    const iEndAngle = d3.interpolate(s.endAngle, e.endAngle)

    return function(t) {
      d.currentArclineParams = {
        //innerRadius: iInnerRadius(t),
        //outerRadius: iOuterRadius(t),
        radius: iRadius(t),
        startAngle: iStartAngle(t),
        endAngle: iEndAngle(t)
      }
      // const arc = d3.arc()
      //   .innerRadius(d.currentArclineParams.innerRadius)
      //   .outerRadius(d.currentArclineParams.outerRadius)
      //   .startAngle(d.currentArclineParams.startAngle)
      //   .endAngle(d.currentArclineParams.endAngle)

      currentArclineParams[d.id] = d.currentArclineParams
      //return arc()
      return arcLine(d.currentArclineParams)
    }
  }

  function getOffset(angle, rad, angle_origin) {
    const angleRad = (angle + angle_origin - 90) * Math.PI / 180
    const x0 = rad * Math.cos(angleRad)
    const y0 = rad * Math.sin(angleRad)
    return [x0,y0]
  }

  async function loadYaml(file) {
    data = await fetchYaml(file)
    initFromRecipe()
    //return data
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
