import * as d3 from 'd3'
import { old } from './old-stuff.js'
import { addDef, fetchYaml } from './general.js'
import { parseRecipe, getArcParams, getArclineParams, arcLine } from './data.js'
import { roughUp } from './roughUp.js'

export async function doughnut({
  selector = 'body',
  recipe = []
} = {}) {

  let iLastChart = null
  let svg, svgWidth, svgHeight
  // let recipeErrors = 'not parsed'
  let gAll, gImages, gArcs, gArclines, gSpokes, gText
  let currentArcParams = {}
  let currentArclineParams = {}
  let currentImageParams = {}
  const fixedGlobals = {}
  let rc

  const errorDiv = d3.select(selector).append('div')
    .style('display', 'none')

  async function updateChart(iChart) {

    console.log("Display chart", iChart)

    // if (recipeErrors !== 'done') {
    //   console.log('recipe', JSON.parse(JSON.stringify(recipe)))
    //   recipeErrors = await parseRecipe(recipe)
    //   console.log('parsedRecipe', recipe)

    //   // If the parse failed, display the error messages somewhere
    // }
  
    // ###TODO###

    // Recipe 2 is not parsing properly

    // Error trapping on invalid values to api functions

    // Real units modifier - r

    // Add options for arcs including gaps and rounded corners.

    // Test and deal with images that are not square.

    // Implement rough styles

    // Fading of arcs towards outer and inner edge

    svgWidth = getGlobal('width_px')
    svgHeight = getGlobal('height_px')

    if (svg && getGlobal('transition') !== 'yes') {
      svg.remove()
      svg = null
    }

    if (!svg) {

      svg = d3.select(selector).append('svg')
        .attr("viewBox", "0 0 " + svgWidth + " " +  svgHeight)
        .style('overflow', 'visible')

      //  Old visualisation
      //old(d3, svg, 350)
    
      // Text style for Rockstrom 2009
      //addDef(svg, 'whiteOutlineEffect')
    
      gAll = svg.append('g')
      gImages = gAll.append('g') // Not centred because that is done indepedently
      gArcs = gAll.append('g')
      gSpokes = gAll.append('g')
      gText = gAll.append('g')
    } else {
      svg.attr("viewBox", "0 0 " + svgWidth + " " +  svgHeight)
    }

    // Transform gAll to centre elements on canvas
    gAll.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)

    // For all arcs, update currentArcParams if an arc
    // with that id has already been used
    recipe.charts[iChart].arcs.forEach(a => {
      if (currentArcParams[a.id]) {
        a.currentArcParams = currentArcParams[a.id]
      }
    })
    // Remove any properties of currentArcParams that
    // have no corresponding key in current arcs
    Object.keys(currentArcParams).forEach(k => {
      if (!recipe.charts[iChart].arcs.find(a => a.id === k)) {
        delete currentArcParams[k]
      }
    })

    // For all arclines, update currentArclineParams if an arc
    // with that id has already been used
    recipe.charts[iChart].arclines.forEach(a => {
      if (currentArclineParams[a.id]) {
        a.currentArclineParams = currentArclineParams[a.id]
      }
    })
    // Remove any properties of currentArclineParams that
    // have no corresponding key in current arcs
    Object.keys(currentArclineParams).forEach(k => {
      if (!recipe.charts[iChart].arclines.find(a => a.id === k)) {
        delete currentArclineParams[k]
      }
    })

    // For all images, update currentImageParams if an image
    // with that id has already been used
    recipe.charts[iChart].images.forEach(i => {
      if (currentImageParams[i.id]) {
        i.currentImageParams = currentImageParams[i.id]
      }
    })
    // Remove any properties of currentImageParams that
    // have no corresponding key in current arcs
    Object.keys(currentImageParams).forEach(k => {
      if (!recipe.charts[iChart].images.find(i => i.id === k)) {
        delete currentImageParams[k]
      }
    })

    const trans = svg.transition().duration(getGlobal('duration'))
    .ease(d3.easeLinear) 
    //.ease(d3.easeElasticOut.amplitude(1).period(0.4))

    // Remeber current chart as the last chart
    iLastChart = iChart

    // Debug image centres

    // Images
    gImages.selectAll('.img')
    .data(recipe.charts[iChart].images, d => d.id)
    .join(
      enter => {
        const sel = enter.append('image')
          .attr('xlink:href', d => d.location)
          .classed('img', true)
          // For debugging
          // .style('outline', '2px blue solid')

        // For debugging
        // enter.append('rect')
        //   .style('outline', '2px red solid')
        //   .attr('width', d => d.width[1])
        //   .attr('height', d => d.width[1])
        //   .attr('fill-opacity', d => 0)

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
          const oxy = getOffset(d.ang[i], d.rad[i], d.angle_origin)
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

    // Arcs
    const arc =  d3.arc()
    gArcs.selectAll('.arc')
      .data(recipe.charts[iChart].arcs, d => d.id)
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
    }

    // Arclines
    gArcs.selectAll('.arcline')
      .data(recipe.charts[iChart].arclines, d => d.id)
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
  }

  function imageTween(d, i) {

      const iAng = d3.interpolate(d.currentImageParams.ang, d.ang[i])
      const iWidth = d3.interpolate(d.currentImageParams.width, d.width[i])
      const iRad = d3.interpolate(d.currentImageParams.rad, d.rad[i])
      const iRot = d3.interpolate(d.currentImageParams.rot, d.rot[i])

      return function(t) {

        d.currentImageParams = {
          ang: iAng(t),
          width: iWidth(t),
          rad: iRad(t),
          rot: iRot(t)
        }
        const oxy = getOffset(iAng(t), iRad(t), d.angle_origin)
        const deltaWidth = -iWidth(t)/2 + oxy[0]
        const deltaHeight = -iWidth(t)/2 + oxy[1]

        currentImageParams[d.id] = {...d.currentImageParams}
        return `
          translate(${deltaWidth}, ${deltaHeight}) 
          rotate(${iRot(t)}) 
        `
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
 
      //return roughUp(arc())
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
        radius: iRadius(t),
        startAngle: iStartAngle(t),
        endAngle: iEndAngle(t)
      }
      currentArclineParams[d.id] = d.currentArclineParams
      return arcLine(d.currentArclineParams)
    }
  }

  function getOffset(angle, rad, angle_origin) {
    const angleRad = (angle + angle_origin - 90) * Math.PI / 180
    const x0 = rad * Math.cos(angleRad)
    const y0 = rad * Math.sin(angleRad)
    return [x0,y0]
  }

  function getGlobal(k) {

    if (typeof(fixedGlobals[k]) !== 'undefined') {
      // There's a value for this key in fixedGlobals
      return fixedGlobals[k]
    } else {
      // There's always a value in the recipe because software provides default
      // if not specified.
      return recipe.globals[k]
    }
  }

  function displayChart(i) {
    let iChart

    if (i === null) {
      iChart = 0
    } else if (i > recipe.charts.length - 1 ) {
      iChart =  recipe.charts.length - 1
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
    } else if (iLastChart === recipe.charts.length - 1 ) {
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
      iChart = recipe.charts.length - 1
    } else {
      iChart = iLastChart - 1
    }
    updateChart(iChart)
  }

  async function loadRecipe(file) {

    iLastChart = null

    recipe = await fetchYaml(file)
    const recipe0 = JSON.parse(JSON.stringify(recipe))

    errorDiv.html('')
    const errorUl = errorDiv.append('ul')
    
    console.log('recipe', recipe0)
    parseRecipe(recipe, errorUl)
    
    if (errorUl.selectAll('li').size()) {
      errorDiv.style('display', '')
      if (svg) svg.style('display', 'none')
    } else {
      errorDiv.style('display', 'none')
      if (svg) svg.style('display', '')
      console.log('parsedRecipe', recipe)
    }

    //recipeErrors = 'not parsed'
    //return recipe
  }

  function fixGlobals(globals) {
    Object.keys(globals).forEach(k => {
      if (typeof(fixedGlobals[k]) !== 'undefined') {
        // Value currently set for this key in fixedGlobals

        //console.log(k, globals[k], globals)
        if (globals[k] === null) {
          // Passed value is null - unset the fGlobal value
          delete fixedGlobals[k]
        } else {
          // Set the fixedGlobals value
          fixedGlobals[k] = globals[k]
        }
      } else {
        // No value currently set for this key in fGlobal
        // Set the fixedGlobals value if passed value not null
        if (globals[k] !== null) {
          fixedGlobals[k] =  globals[k]
        }
      }
    })
  }

  return {
    loadRecipe: loadRecipe,
    fixGlobals: fixGlobals,
    displayChart: displayChart,
    displayNextChart: displayNextChart,
    displayPreviousChart: displayPreviousChart
  }
}
