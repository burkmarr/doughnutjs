import * as d3 from 'd3'
import { old } from './old-stuff.js'
import { fetchYaml } from './general.js'
import { parseRecipe } from './data.js'
import { roughUp } from './roughUp.js'
import { createImageElements, initialiseImageParameters } from './images.js'
import { createArcElements, initialiseArcParameters } from './arcs.js'
import { createArclineElements, initialiseArclineParameters } from './arclines.js'

export async function doughnut({
  selector = 'body',
  recipe = []
} = {}) {

  let iLastChart = null
  let svg, svgWidth, svgHeight
  let recipeParsed = false
  let gAll, gImages, gArcs, gArclines, gSpokes, gText
  let currentParams = {arcs: {}, arclines: {}, images: {}}
  const fixedGlobals = {}
  let rc

  const errorDiv = d3.select(selector).append('div')
    .style('display', 'none')

  async function updateChart(iChart) {

    if (!recipeParsed) return

    console.log("Display chart", iChart)

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
      gArclines = gAll.append('g')
      gSpokes = gAll.append('g')
      gText = gAll.append('g')
    } else {
      svg.attr("viewBox", "0 0 " + svgWidth + " " +  svgHeight)
    }

    // Transform gAll to centre elements on canvas
    gAll.attr('transform', `translate(${svgWidth/2} ${svgHeight/2})`)

    // Initliase element parameters (aids transitions across charts and recipes)
    initialiseImageParameters(recipe.charts[iChart].images, currentParams.images)
    initialiseArcParameters(recipe.charts[iChart].arcs, currentParams.arcs)
    initialiseArclineParameters(recipe.charts[iChart].arclines, currentParams.arclines)
    
    const trans = svg.transition().duration(0).ease(d3.easeLinear) 
    //.ease(d3.easeElasticOut.amplitude(1).period(0.4))
    if (getGlobal('transition') === 'yes') {
      trans.duration(getGlobal('duration'))
    } else {

    }
   
    // Remeber current chart as the last chart
    iLastChart = iChart

    // Create elements
    createImageElements(gImages, recipe.charts[iChart].images, trans, currentParams.images)
    createArcElements(gArcs, recipe.charts[iChart].arcs, trans, currentParams.arcs)
    createArclineElements(gArclines, recipe.charts[iChart].arclines, trans, currentParams.arclines)
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
    recipeParsed = false

    recipe = await fetchYaml(file)
    const recipe0 = JSON.parse(JSON.stringify(recipe))

    errorDiv.html('')
    const errHtmlEl = errorDiv.append('table')
    errHtmlEl.attr('id', 'recipe-errors')
    const errTableHdrRow = errHtmlEl.append('tr')
    errTableHdrRow.append('th').text('Chart ID')
    errTableHdrRow.append('th').text('Element type')
    errTableHdrRow.append('th').text('Element ID')
    errTableHdrRow.append('th').text('Element prop')
    errTableHdrRow.append('th').text('Prop value')
    errTableHdrRow.append('th').text('Permitted formats')

    console.log('recipe', recipe0)
    parseRecipe(recipe, errHtmlEl)
    
    if (errHtmlEl.selectAll('tr').size() > 1) {
      // There are errors
      errorDiv.style('display', '')
      if (svg) svg.style('display', 'none')
      recipeParsed = false
    } else {
      // No errors
      errorDiv.style('display', 'none')
      if (svg) svg.style('display', '')
      recipeParsed = true
      console.log('parsedRecipe', recipe)
    }
  }

  function fixGlobals(globals) {
    // The purpose of this API function is to fix
    // global values so that they persist over invocations
    // of different charts within a recipe or between
    // recipes.
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
