import { cloneObj } from './general.js'
import { getProperties } from './data-tests.js'
import { getArcParams } from './arcs.js'
import { getArclineParams } from './arclines.js'
import * as d3 from 'd3'

const elementTypes = ['arcs', 'arclines', 'images']

export async function parseRecipe(data, errHtmlEl) {
 
  let allPromises = [] // For the return value

  // Resolve cloned charts

  // Top level default values
  dv(data, 'globals', {})
  dv(data, 'defaults', {})
  dv(data, 'charts', {})
  dv(data.globals, 'width_px', 650)
  dv(data.globals, 'height_px', 650)
  dv(data.globals, 'duration', 1000)
  dv(data.globals, 'transition', 'yes')

  // These are given defaults so we do 
  // not have to check for them
  dv(data.defaults, 'angle0', 0)
  dv(data.defaults, 'angleSpan', 360)
  dv(data.defaults, 'radiusSpanPx', 150)
  dv(data.defaults, 'radiusSpanReal', null)
  dv(data.defaults, 'cornerRadius', 0)
  dv(data.defaults, 'padAngle', 0)
  dv(data.defaults, 'padRadius', 0)

  data.charts.forEach(chart => {
    dv(chart, 'defaults', [])
    elementTypes.forEach(elementType => {
      dv(chart, elementType, [])
    })
  })
  // ### TODO ### 
  // Need to check that charts have id property

  // Validate property value formats and return if fails
  if (!validateProps(data, errHtmlEl)) return Promise.all(allPromises)
  
  // Highlight unpermitted properties
  if (!unpermittedProps(data, errHtmlEl)) return Promise.all(allPromises)

  // Resolve clones
  resolveClones(data)
 
  // Propagate default values
  propogateDefaultProps(data)

  // Find missing values
  if (!missingProps(data, errHtmlEl)) return Promise.all(allPromises)

  // Remove remove unpermitted properties
  // I DONT think I should implement this
  // Safer not to and shouldn't have any implications for
  // user or performance
  //unpermittedProps(data)

  // Resolve all the number formats
  resolveNumericFormats(data, data)

  // Initialise additional properties required for tweening
  initialiseTweenProps(data)

  // Record the aspect ratio of any images
  allPromises = [...allPromises, ...recordImageAspectRatio(data)]

  await Promise.all(allPromises)
}

function dv(obj, prop, value) {
  // Default value
  if (!obj[prop]) {
    obj[prop] = value
  }
}

function resolveNumericFormats (data, obj) {
  // ### TODO ###
  // Surely the following array should go in data-tests.js
  // or maybe whole function?
  const keys = [
    ['cornerRadius', 'n'],
    ['padAngle', 'n'],
    ['padRadius', 'n'],
    ['radius', 'px'],
    ['radius1', 'px'],
    ['radius2', 'px'],
    ['angle', 'deg'],
    ['angle1', 'deg'],
    ['angle2', 'deg'],
    ['width', 'px'],
    ['rot', 'n'],
    ['opacity', 'n'],
    ['colour', 's'],
    ['stroke', 's'],
    ['stroke-width', 'n'],
    // ['stroke-dasharray', 's']
  ]
  Object.keys(obj).forEach(key => {

    const keyMatch = keys.find(ki => ki[0] === key)
    
    if (keyMatch) {
      const key = keyMatch[0]
      const type = keyMatch[1]

      if (!Array.isArray(obj[key])) {

        if (typeof obj[key] === 'number') {
          obj[key] = obj[key].toString()
        }

        const vals = obj[key].split(' ')

        let modifier
        if (vals[vals.length-1] === '%' || vals[vals.length-1] === 'x' || vals[vals.length-1] === 'r') {
          modifier = vals[vals.length-1]
          vals.pop()
        }
      
        // At this point, vals should either be of length one or three
        // If anything else, act as if it is one.
        const newVal = []
        if (vals.length === 3) {
          newVal[0] = convertValue(vals[0], modifier, type)
          newVal[1] = convertValue(vals[1], modifier, type)
          newVal[2] = convertValue(vals[2], modifier, type)
        } else {
          newVal[0] = convertValue(vals[0], modifier, type)
          newVal[1] = convertValue(vals[0], modifier, type)
          newVal[2] = convertValue(vals[0], modifier, type)
        }
        // Update value
        obj[key] = newVal
      }
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      resolveNumericFormats(data, obj[key])
    }
  })

  function convertValue(val, modifier, type) {

    let ret
    let multiplier
    if (type === 'px') {
      if (modifier === 'r') {
        multiplier = Number(obj.radiusSpanPx)/Number(obj.radiusSpanReal)
      } else {
        multiplier = Number(obj.radiusSpanPx)
      }
    } else if (type === 'deg') {
      multiplier = Number(obj.angleSpan)
    }

    if (modifier === '%' && multiplier) {
      // Value expressed as % of radiusSpanPx or angleSpan
      ret = Number(val) / 100 * multiplier
    } else if (modifier === 'x' && multiplier) {
      // Value expressed as a multiplier of radiusSpanPx or angleSpan
      ret = Number(val) * multiplier
    } else if (modifier === 'r' && multiplier) {
      // Value expressed as a multiplier of radiusSpanReal
      ret = Number(val) * multiplier
    } else if (type === 'px') {
      // Radius value expressed as in real units
      ret = Number(val) / Number(obj.radiusSpanReal) * Number(obj.radiusSpanPx)
    } else if (type === 's') {
      // Value expressed directly
      ret =  val
    } else {
      // Value expressed directly
      ret =  Number(val)
    }
    if (type === 'deg') {
      ret = ret + Number(obj.angle0)
    }
    return ret
  }
}

function resolveClones (data) {
  data.charts.forEach(chart => {
    if (chart.clone) {
      const toChart = chart
      const fromChart = data.charts.find(c => c.id === chart.clone)

      //console.log('fromChart', cloneObj(fromChart))
      //console.log('toChart', cloneObj(toChart))

      if (fromChart) {
        const types = ['defaults', 'images', 'arcs', 'arclines']
        types.forEach(elementType => {
          const fromChartElements = fromChart[elementType]
          let toChartElements = toChart[elementType]

          if (fromChartElements) {
            let toChartElementsCloned
            if (toChartElements) {
              // Clone the target array element array
              toChartElementsCloned = cloneObj(toChartElements)
              //console.log('toChartElementsCloned', cloneObj(toChartElementsCloned))
            }

            // First copy entire element type array from source to target
            data.charts.find(c => c.id === toChart.id)[elementType] = cloneObj(fromChartElements)
            toChartElements = toChart[elementType]

            //console.log('toChart', cloneObj(toChart))
            //console.log('toChartElements', cloneObj(toChartElements))

            if (toChartElementsCloned) {
              // Now loop through the elements previously cloned from target and
              // Update in the copied,
              toChartElementsCloned.forEach(toChartElementCloned => {
                const toChartElement = toChartElements.find(toChartElement => toChartElement.id === toChartElementCloned.id)
                if (toChartElement) {
                  //console.log('toChartElement', cloneObj(toChartElement))
                  Object.keys(toChartElementCloned).forEach(toChartElementClonedKey => {
                    toChartElement[toChartElementClonedKey] = toChartElementCloned[toChartElementClonedKey]
                  })
                }
              })
            }
          } else {
            // Element type array from target not found in source,
            // so delete from target
            delete toChart[elementType]
          }
        })
        //console.log('toChart', toChart)
      } else {
        // Referenced clone id not found - need to warm
      }
    }
  })
}

function propogateDefaultProps(data) {
  // Works by propogating all defaults whether or not they are permitted on
  // on an element type and later clearing out those that are not.
  // Another way of doing it would be to limit the propogation of defaults to those elements
  // that are allowed to have them. 
  const recipeDefaults = data.defaults
  data.charts.forEach(chart => {
    const chartDefaults = chart.defaults ? chart.defaults : {}
    elementTypes.forEach(elementType => {
      if (chart[elementType]) {
        const defaults = chart[elementType].find(e => e.id === 'default')
        // console.log('defaults1', defaults)
        // console.log('defaults0', data.defaults)
        chart[elementType].forEach(element => {
          if (defaults && element.id !== 'default') {
            // Element collection defaults
            Object.keys(defaults).forEach(elementDefault => {
              // If the default does not exist on the element then add.
              if (!element[elementDefault]) {
                element[elementDefault] = defaults[elementDefault]
              }
            })
          }
          // Chart defaults
          Object.keys(chartDefaults).forEach(chartDefault => {
            // If the chart default does not exist on the element then add.
            if (!element[chartDefault]) {
              element[chartDefault] = chartDefaults[chartDefault]
            }
          })
          // Recipe defaults
          if (recipeDefaults) {
            Object.keys(recipeDefaults).forEach(recipeDefault => {
              // If the recipe default does not exist on the element then add.
              if (!element[recipeDefault]) {
                //console.log('Updating with recipe default', chart.id, elementType, element.id, recipeDefault, recipeDefaults[recipeDefault])
                element[recipeDefault] = recipeDefaults[recipeDefault]
              }
            })
          }
        })
      }
    })
  })
  // Remove all objects with id 'default'
  data.charts.forEach(chart => {
    elementTypes.forEach(type => {
      if (chart[type]) {
        const i = chart[type].findIndex(e => e.id === 'default')
        if (i > -1) {
          chart[type].splice(i, 1)
        }
      }
    })
  })
}

function validateProps(data, errHtmlEl) {
  
  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Chart ID')
  errTableHdrRow.append('th').text('Element type')
  errTableHdrRow.append('th').text('Element ID')
  errTableHdrRow.append('th').text('Element prop')
  errTableHdrRow.append('th').text('Prop value')
  errTableHdrRow.append('th').text('Permitted formats')

  const propDefs = getProperties()
  data.charts.forEach(chart => {
    elementTypes.forEach(elementType => {
      if (chart[elementType]) {
        chart[elementType].forEach(element => {
          Object.keys(element).forEach(property => {
            const propDef = propDefs.find(propdef => propdef.name === property)
            if (propDef) {
              if (property === propDef.name) {
                //console.log(chart.id, elementType, element.id, property, element[property])
                let permittedFormat = false

                for (let i=0; i<propDef.formats.re.length; i++) {
                  const regex = new RegExp(propDef.formats.re[i])
                  if (regex.test(element[property])) {
                    permittedFormat = true
                  }
                }
                if (!permittedFormat) {
                  let err = '<ul>'
                  propDef.formats.disp.forEach((d,i) => {
                    err = `${err}<li><b>${d}</b> - e.g. <b>${propDef.formats.example[i]}</b></li>`
                  })
                  err = `${err}</ul> ${propDef.formats.expl}`
                 
                  const row = errHtmlEl.append('tr')
                  row.append('td').text(chart.id)
                  row.append('td').text(elementType)
                  row.append('td').text(element.id)
                  row.append('td').text(propDef.name)
                  row.append('td').text(element[property]).classed('error-property-value', true)
                  row.append('td').html(err)
                }
              }
            } else {
              // A property defintion was not found for a property of this name
              //const err = `The property name <b>${property}</b> is not recognised. Check <b>${chart.id}>${elementType}>${element.id}</b>.`
              //errHtmlEl.append('li').html(err)
            }
          })
        })
      }
    })
  })
  return errHtmlEl.selectAll('tr').size() === 1
}

function missingProps(data, errHtmlEl) {

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Chart ID')
  errTableHdrRow.append('th').text('Element type')
  errTableHdrRow.append('th').text('Element ID')
  errTableHdrRow.append('th').text('Element prop')
  errTableHdrRow.append('th').text('Problem')

  const propDefs = getProperties()

  data.charts.forEach(chart => {
    elementTypes.forEach(elementType => {
      if (chart[elementType]) {
        // Get a list of all the mandatory properties for this element type
        let mandatoryProps =  propDefs.filter(propDef => {
          return propDef.mandatoryOn.find(mandatoryOn => mandatoryOn === elementType)
        }).map(propDef => propDef.name)
        // Remove duplicates from the list
        mandatoryProps = [...new Set(mandatoryProps)]
        chart[elementType].forEach(element => {
          mandatoryProps.forEach(mandatoryProp => {
            if (!Object.keys(element).find(prop => prop === mandatoryProp)) {
              //console.log('Mandatory prop not found', chart.id, elementType, element.id, mandatoryProp)
              const row = errHtmlEl.append('tr')
              row.append('td').text(chart.id)
              row.append('td').text(elementType)
              row.append('td').text(element.id)
              row.append('td').text(mandatoryProp)
              row.append('td').html(`
                Mandatory prop not found. Specify it either:
                <ul>
                <li>directly on the element</li>
                <li>or the element with id <i>defaults</i> under <i>${chart.id}>${elementType}</i>,</li>
                <li>or under the charts defaults <i>${chart.id}>defaults,</i>
                <li>or under the top level <i>defaults</i>.</li>
                </ul>
              `)
            }
          })
        })
      }
    })
  })

  return errHtmlEl.selectAll('tr').size() === 1
}

function unpermittedProps(data, errHtmlEl) {

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Chart ID')
  errTableHdrRow.append('th').text('Element type')
  errTableHdrRow.append('th').text('Element ID')
  errTableHdrRow.append('th').text('Element prop')
  errTableHdrRow.append('th').text('Problem')

  const propDefs = getProperties()

  // Checks if property is permitted on element type.
  // If the errHtmlEl is set, it warns the user
  // without removing the type and returns HTML.
  // If errHtmlEl is not set, it does not warn
  // the user, but removes the innapropriate property.
  data.charts.forEach(chart => {
    elementTypes.forEach(elementType => {
      if (chart[elementType]) {
        
        const permittedElementProps = propDefs
            .filter(propDef => {
              let permitted = [...propDef.mandatoryOn, ...propDef.optionalOn]
              if (!permitted.length) permitted = elementTypes
              return permitted.find(propDef => propDef === elementType)
            })
            .map(propDef => propDef.name)
        //console.log(`Permitted on ${elementType}: ${PermittedElementProps}`)
        chart[elementType].forEach(element => {
          Object.keys(element).forEach(property => {
            if (!permittedElementProps.find(permittedProperty => permittedProperty === property)) {
              //console.log(`${property} not permitted on ${elementType}`)
              console.log('errHtmlEl', errHtmlEl)

              if (errHtmlEl) {
                const row = errHtmlEl.append('tr')
                row.append('td').text(chart.id)
                row.append('td').text(elementType)
                row.append('td').text(element.id)
                row.append('td').text(property)
                row.append('td').html('Property not permitted on the element type')
              } else {
                delete element.prop
              }   
            }
          })
        })
      }
    })
  })

  return errHtmlEl.selectAll('tr').size() === 1
}

function initialiseTweenProps(data) {
  // Initialise the currentArcParams property
  data.charts.forEach(chart => {
    chart.arcs.forEach(arc => {
      arc.currentArcParams = getArcParams(arc, 0)
    })
  })

  // Initialise the currentArclineParams property
  data.charts.forEach(chart => {
    chart.arclines.forEach(arcline => {
      arcline.currentArclineParams = getArclineParams(arcline, 0)
    })
  })

  // Initialise the currentImageParams property
  data.charts.forEach(chart => {
    chart.images.forEach(image => {
      image.currentImageParams = {
        angle: image.angle[0],
        width: image.width[0],
        radius: image.radius[0],
        rot: image.rot[0]
      }
    })
  })
}

function recordImageAspectRatio(data) {

  const allPromises = []

  data.charts.forEach(async chart => {
    chart.images.forEach(async img => {
      if (img.location) {
        allPromises.push(getImageWidth(img.location, img))
      }
    })
  })

  return allPromises

  function getImageWidth(src, dataImage){
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => {
        // dataImage.origWidth = img.width
        // dataImage.origHeight = img.height
        dataImage.aspectRatio = img.width / img.height
        img = null
        resolve()
      }
      img.onerror = reject
      img.src = src
    })
  }
}