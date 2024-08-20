import * as d3 from 'd3'
import { fetchYaml, fetchCsv, cloneObj, addDef } from './general.js'
import { parseRecipe } from './data.js'
import { createImageElements, initialiseImageParameters } from './images.js'
import { createArcElements, initialiseArcParameters } from './arcs.js'
import { createArclineElements, initialiseArclineParameters } from './arclines.js'
import { createSpokeElements, initialiseSpokeParameters } from './spokes.js'
import { createTextElements, initialiseTextParameters } from './texts.js'
import { createArrowElements, initialiseArrowParameters } from './arrows.js'

export async function doughnut({
  selector = 'body'
} = {}) {

  let recipe, recipeCsv
  let iLastChart = null
  let svg, svgWidth, svgHeight
  let recipeParsed = false
  let gAll, gImages, gArcs, gArclines, gSpokes, gTexts, gArrows
  let currentParams = {arcs: {}, arclines: {}, images: {}, spokes: {}, texts: {}, arrows: {}}

  const errorDiv = d3.select(selector).append('div')
    .style('display', 'none')

  const csvErrorDiv = d3.select(selector).append('div')
    .style('display', 'none')

  function updateChart(iChart, delay) {

    console.log(iChart, 'duration', delay)

    if (!recipeParsed) return Promise.resolve()
      
    svgWidth = recipe.charts[iChart].metrics.width_px ? recipe.charts[iChart].metrics.width_px : 500
    svgHeight = recipe.charts[iChart].metrics.height_px ? recipe.charts[iChart].metrics.height_px: 500
    
    if (svg && !recipe.charts[iChart].metrics.transition) {
      svg.remove()
      svg = null
    }

    if (!svg) {
      svg = d3.select(selector).append('svg')
        .attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
        .style('overflow', 'visible')

      gAll = svg.append('g')
      gImages = gAll.append('g')
      gArcs = gAll.append('g')
      gArclines = gAll.append('g')
      gSpokes = gAll.append('g')
      gTexts = gAll.append('g')
      gArrows = gAll.append('g')

      ////////////
      recipe.grps.forEach(g => {
        g.g = gAll.append('g')
      })


    } else {
      svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
    }

    // Add any defined defs to SVG
    const defs = recipe.charts[iChart].defs
    Object.keys(defs).forEach(k => addDef(svg, k, defs[k]))

    // Transform gAll to centre elements on SVG
    gAll.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)

    // Initliase element parameters (aids transitions across charts and recipes)
    initialiseImageParameters(recipe.charts[iChart].images, currentParams.images)
    initialiseArcParameters(recipe.charts[iChart].arcs, currentParams.arcs)
    initialiseArclineParameters(recipe.charts[iChart].arclines, currentParams.arclines)
    initialiseSpokeParameters(recipe.charts[iChart].spokes, currentParams.spokes)
    initialiseTextParameters(recipe.charts[iChart].texts, currentParams.texts)
    initialiseArrowParameters(recipe.charts[iChart].arrows, currentParams.arrows)
    
    // Remember current chart as the last chart
    iLastChart = iChart

    // Set transition duration for chart (transition in metrics)
    // Set delay (from duration in metrics)
    let trans = svg.transition().delay(0).duration(0).ease(d3.easeLinear) 
    if (recipe.charts[iChart].metrics.transition) {
      trans.duration(recipe.charts[iChart].metrics.transition)
    }
    if (delay) {
      trans.delay(delay)
    }

    // Create elements
    //createImageElements(gImages, recipe.charts[iChart].images, trans, currentParams.images)
    //createArcElements(gArcs, recipe.charts[iChart].arcs, trans, currentParams.arcs)
    //createArclineElements(gArclines, recipe.charts[iChart].arclines, trans, currentParams.arclines)
    //createSpokeElements(gSpokes, recipe.charts[iChart].spokes, trans, currentParams.spokes)
    //createTextElements(gTexts, recipe.charts[iChart].texts, trans, currentParams.texts)
    //createArrowElements(gArrows, recipe.charts[iChart].arrows, trans, currentParams.arrows)

    recipe.grps.forEach(grp => {
      const elements = recipe.charts[iChart][grp.type].filter(e => e.z === grp.z)
      if (grp.type === 'images') {
        createImageElements(grp.g, elements, trans, currentParams.images)
      }
      if (grp.type === 'arcs') {
        createArcElements(grp.g, elements, trans, currentParams.arcs)
      }
      if (grp.type === 'arclines') {
        createArclineElements(grp.g, elements, trans, currentParams.arclines)
      }
      if (grp.type === 'spokes') {
        createSpokeElements(grp.g, elements, trans, currentParams.spokes)
      }
      if (grp.type === 'texts') {
        createTextElements(grp.g, elements, trans, currentParams.texts)
      }
      if (grp.type === 'arrows') {
        createArrowElements(grp.g, elements, trans, currentParams.arrows)
      }
    })
  
    return trans.end()
  }
  
  async function nextChart(iChart, forward) {
    let ret
    let i = iChart
    let duration = 0
    do {
      ret = await updateChart(i, duration)
      duration = recipe.charts[i].metrics.duration
      i = forward ? i+1 : i-1
    } while(typeof duration !== 'undefined')
    return ret
  }

  // API //
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
    return  updateChart(iChart)
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
    return nextChart(iChart, true)
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
    return nextChart(iChart, false)
  }

  async function loadRecipe(file) {

    iLastChart = null
    recipeParsed = false

    recipeCsv = await fetchCsv(file)
    
    const errHtmlEl = csvErrorDiv.append('table')
    errHtmlEl.attr('id', 'recipe-errors')

    recipeCsv = await parseRecipe(recipeCsv, errHtmlEl)

    if (errHtmlEl.selectAll('tr').size() > 1) {
      // There are errors
      csvErrorDiv.style('display', '')
      if (svg) svg.style('display', 'none')
      recipeParsed = false
    } else {
      // No errors
      csvErrorDiv.style('display', 'none')
      if (svg) svg.style('display', '')
      recipeParsed = true
      
      recipe = recipeCsv
    }
  }

  return {
    loadRecipe: loadRecipe,
    displayChart: displayChart,
    displayNextChart: displayNextChart,
    displayPreviousChart: displayPreviousChart
  }
}
