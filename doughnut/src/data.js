import { cloneObj } from './general.js'
import { getProperties } from './data-defs.js'
import { getArcParams } from './arcs.js'
import { getArclineParams } from './arclines.js'
import { getSpokeParams } from './spokes.js'
import { getTextParams } from './texts.js'
import { getArrowParams } from './arrows.js'

const elementTypes = ['arcs', 'arclines', 'images', 'spokes', 'texts', 'arrows']

export async function parseRecipe(data, errHtmlEl) {
 
  // Top level default values
  dv(data, 'globals', {})
  dv(data, 'defaults', {})
  dv(data, 'charts', {})
  dv(data.globals, 'width_px', 650)
  dv(data.globals, 'height_px', 650)
  dv(data.globals, 'duration', 1000)
  dv(data.globals, 'transition', 'yes')

  data.charts.forEach(chart => {
    dv(chart, 'defaults', [])
    elementTypes.forEach(elementType => {
      dv(chart, elementType, [])
    })
  })
  // ### TODO ### 
  // Need to check that charts have id property

  // Validate property value formats and return if fails
  if (!validateProps(data, errHtmlEl)) return
  
  // Highlight unpermitted properties and return if fails
  if (!unpermittedProps(data, errHtmlEl)) return

  // Resolve clones
  resolveClones(data)

  // Propagate default values
  propogateDefaultProps(data)

  // Find missing values
  if (!missingProps(data, errHtmlEl)) return

  // Resolve all the number formats
  resolveNumericFormats(data)

  // Initialise additional properties required for tweening
  initialiseTweenProps(data)

  // Record the aspect ratio of any images
  await Promise.all(recordImageAspectRatio(data))
}

function dv(obj, prop, value) {
  // Default value
  if (!obj[prop]) {
    obj[prop] = value
  }
}

function resolveNumericFormats (obj) {

  // This function is called recursively
  // for each object in recipe
  const propDefs = getProperties()

  Object.keys(obj).forEach(key => {

    const propMatch = propDefs.find(pd => pd.name === key)

    if (propMatch && propMatch.threeable) {
      if (!Array.isArray(obj[key])) {
        // Initially convert all number properties to strings (converted back later)
        if (typeof obj[key] === 'number') {
          obj[key] = obj[key].toString()
        }
        // Extract any modifier and remove from values.
        //console.log(key, obj)
        const vals = obj[key].split(' ')
        let modifier
        if (vals[vals.length-1] === '%' || vals[vals.length-1] === 'x' || vals[vals.length-1] === 'r') {
          modifier = vals[vals.length-1]
          vals.pop()
        }
        // At this point, vals should either be of length one, two or three.
        // If anything else, act as if it is one.
        const newVal = []
        if (vals.length === 3) {
          newVal[0] = convertValue(vals[0], modifier, propMatch)
          newVal[1] = convertValue(vals[1], modifier, propMatch)
          newVal[2] = convertValue(vals[2], modifier, propMatch)
        } else if (vals.length === 2) {
          newVal[0] = convertValue(vals[0], modifier, propMatch)
          newVal[1] = convertValue(vals[1], modifier, propMatch)
          newVal[2] = convertValue(vals[1], modifier, propMatch)
        } else {
          newVal[0] = convertValue(vals[0], modifier, propMatch)
          newVal[1] = convertValue(vals[0], modifier, propMatch)
          newVal[2] = convertValue(vals[0], modifier, propMatch)
        }
        // Update value
        obj[key] = newVal
      }
    }
    
    // Recursive call for objects
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      resolveNumericFormats(obj[key])
    }
  })

  function convertValue(val, modifier, propMatch) {

    // This function converts values based on their modifier (if any)
    // and their type.
    // Modifiers:
    //   r: values expressed in real world units (for radius only)
    //   %: values expressed as percentage
    //   x: values expressed as multipliers

    let ret
    let span = Number(obj[propMatch.span])
    if (modifier === 'r') {
      span = span/Number(obj.radiusSpanReal)
    }

    if (modifier === '%' && span) {
      // Value expressed as % of span
      ret = Number(val) / 100 * span
    } else if (modifier === 'x' && span) {
      // Value expressed as a multiple of span
      ret = Number(val) * span
    } else if (modifier === 'r' && span) {
      // Value expressed in real units
      ret = Number(val) * span
    } else if (propMatch.number) {
      ret =  Number(val)
    } else {
      ret =  val
    }
    // For angles, add the offset angle
    if (propMatch.name === 'angle' || propMatch.name === 'angle1' || propMatch.name === 'angle2') {
      ret = ret + Number(obj.angle0)
    }
    return ret
  }
}

function resolveClones (data) {
  // A cloned chart allows a chart in a recipe to be based on
  // another in the recipe and then modify slightly.
  data.charts.forEach(chart => {
    if (chart.clone) {
      const toChart = chart
      const fromChart = data.charts.find(c => c.id === chart.clone)

      if (fromChart) {
        // Clone any chart default values
        if (fromChart.defaults) {
          if (!toChart.defaults) {
            toChart.defaults = fromChart.defaults
          } else {
            Object.keys(fromChart.defaults).forEach(k => {
              if (typeof toChart.defaults[k] === 'undefined') {
                toChart.defaults[k] = fromChart.defaults[k]
              }
            })
          }
        }
        // Now do element types
        const types = ['images', 'arcs', 'arclines', 'spokes', 'texts', 'arrows']
        types.forEach(elementType => {
          const fromChartElements = fromChart[elementType]
          let toChartElements = toChart[elementType]

          if (fromChartElements) {
            let toChartElementsCloned
            if (toChartElements) {
              // Clone the target chart current element array
              toChartElementsCloned = cloneObj(toChartElements)
            }

            // if (toChart.id === 'rockstrom2009c') {
            //   console.log('toChartElementsCloned', toChartElementsCloned)
            // }

            // First copy entire element type array from source to target
            // replacing any elements already there (stored in toChartElementsCloned)
            data.charts.find(c => c.id === toChart.id)[elementType] = cloneObj(fromChartElements)
            toChartElements = toChart[elementType]

            if (toChartElementsCloned) {
              // Now loop through the elements that were already existing in the target
              // and either replace the value of the copied properties or remove the
              // element if this is indicated.
              toChartElementsCloned.forEach(toChartElementCloned => {
                const toChartElement = toChart[elementType].find(toChartElement => toChartElement.id === toChartElementCloned.id)
                if (toChartElement) {
                  if (toChartElementCloned.remove === true) {
                    // The element is marked for removal in target chart.
                    toChart[elementType] = toChart[elementType].filter( toChartElement => toChartElement.id !== toChartElementCloned.id)
                  } else {
                    // Replace any existing properties in toChartElement (the copied element)
                    // with any that were already specified.
                    Object.keys(toChartElementCloned).forEach(toChartElementClonedKey => {
                      toChartElement[toChartElementClonedKey] = toChartElementCloned[toChartElementClonedKey]
                    })
                  }
                } else {
                  // The element in toChartElementsCloned is a completely new one
                  toChart[elementType].push(toChartElementCloned)
                }
              })
            }
          } else {
            // Element type array from target not found in source,
            // so delete from target
            delete toChart[elementType]
          }
        })
      } else {
        // Referenced clone id not found - need to warm
        console.log('Clone target identified by id', chart.clone, 'not found')
      }
    }
  })
}

function propogateDefaultProps(data) {
  // Works by propogating all defaults whether or not they are permitted on
  // on an element type.
  // Another way of doing it would be to limit the propogation of defaults to those elements
  // that are allowed to have them. 
  const recipeDefaults = data.defaults
  data.charts.forEach(chart => {
    const chartDefaults = chart.defaults ? chart.defaults : {}
    elementTypes.forEach(elementType => {
      if (chart[elementType]) {
        const defaults = chart[elementType].find(e => e.id === 'default')
        const optionalProperties = getProperties().filter(propDef => {
          return propDef.optionalOn.find(et => et === elementType) && propDef.hasOwnProperty('default')
        })
        chart[elementType].filter(element => element.id !== 'default').forEach(element => {
          
          // Element collection defaults
          if (defaults) {
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
                element[recipeDefault] = recipeDefaults[recipeDefault]
              }
            })
          }
          // By this point, all recipe defined defaults are propogated.
          // Now go through any optional properties for this element type 
          // that have a default value defined in the defition and if
          // not defined on element, set it with the default value.
          optionalProperties.forEach(optionalProperty => {
            if (!element[optionalProperty.name]) {
              element[optionalProperty.name] = optionalProperty.default
            }
          })
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
              //console.log('errHtmlEl', errHtmlEl)
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

  // Initialise the currentSpokeParams property
  data.charts.forEach(chart => {
    chart.spokes.forEach(spoke => {
      spoke.currentSpokeParams = getSpokeParams(spoke, 0)
    })
  })

  // Initialise the currentTextParams property
  data.charts.forEach(chart => {
    chart.texts.forEach(text => {
      text.currentTextParams = getTextParams(text, 0)
    })
  })

  // Initialise the currentArrowParams property
  data.charts.forEach(chart => {
    chart.arrows.forEach(arrow => {
      arrow.currentArrowParams = getArrowParams(arrow, 0)
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