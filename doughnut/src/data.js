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

export async function parseRecipeCsv(data, errHtmlEl) {
  //const chartNames = checkCols(data, errHtmlEl)
  //if (!checkCols(data, errHtmlEl)) return
  //console.log(charts)

  data = cleanCsv(data)

  if (!checkCsv(data, errHtmlEl)) return

  data = restructureCsv(data)
  console.log('Transformed CSV recipe', cloneObj(data))

  // Validate property value formats and return if fails
  if (!validateProps(data, errHtmlEl)) return
  
  // Highlight unpermitted properties and return if fails
  if (!unpermittedProps(data, errHtmlEl)) return

  // Propagate default values
  propogateDefaultProps(data)

  console.log('Propogated CSV recipe', data)

  // Find missing values
  if (!missingProps(data, errHtmlEl)) return

  // Resolve all the number formats
  resolveNumericFormats(data)

  // Initialise additional properties required for tweening
  initialiseTweenProps(data)

  // Record the aspect ratio of any images
  await Promise.all(recordImageAspectRatio(data))

  // Return the new data object
  return data
}

function cleanCsv(data) {

  const fixType = function (val) {
    if (String(Number(val)) === val) {
      return Number(val)
    } else {
      return val
    }
  }

  // Remove any columns with no header.
  // These can occur if CSV has a column with no header and there
  // is (or was) data anywhere in the column.
  const columns = data.columns.filter(c => c)
  const cleanData = data.map(d => {
    const dn = {}
    columns.forEach(k => {
      // Trim any spaces from around values
      // Also change from string to number (fixType)
      // where appropriate.
      dn[k] = fixType(d[k].trim())
    })
    return dn
  })
  cleanData.columns = columns

  return cleanData
}

function checkCsv(data, errHtmlEl) {
  // type & entity
  // Each combination must be unique

  // chart
  // Only entity names permissible are canvas, defs and globals

  // chart>canvas & chart>defs
  // All properties must have value in first chart and none in the others

  // chart>canvas & chart>defs & chart>globals
  // There must be no values in remaining cells

  // chart>globals

  // return errHtmlEl.selectAll('tr').size() === 1
  return true
}

function restructureCsv(data) {
  const charts = data.columns.filter((c,i) => i >= 3)
  const typeAndEntity = data.filter(d => d.type && d.type !== 'chart').map(d => {
    return {type: d.type, entity: d.entity}
  })

  // Propagate type and entity downward through csv data
  let lastType, lastEntity
  data.forEach(d => {
    if (d.type) {
      lastType = d.type
      lastEntity= d.entity
    } else {
      d.type = lastType
      d.entity = lastEntity
    }
  })

  // Propagate property values across charts in csv data
  data.forEach(d => {
    for (let iChart = 0; iChart < charts.length; iChart++) {
      if (iChart && d[charts[iChart]] === '=') {
        d[charts[iChart]] = d[charts[iChart-1]]
      }
    }
  })

  // console.log('Propagated', data)

  // Transform structure from that read in from CSV
  // to that expected by the code (originally from yaml)
  const tdata = {charts:[], defaults: {}, globals: {defs: []}}
  tdata.charts = charts.map(c => {
    const chart = {
      id: c,
      defaults: {},
    }
    elementTypes.forEach(et => {
      chart[et] = []
    })
    return chart
  })

  // chart>canvas to globals
  data.filter(d => d.type === 'chart' && d.entity === 'canvas' && d.property_z).forEach(d => {
    // Global canvas taken from first chart
    tdata.globals[d.property_z] = d[charts[0]]
  })
  // charts>defs to global defs collection
  data.filter(d => d.type === 'chart' && d.entity === 'defs' && d.property_z).forEach(d => {
    // Global defs taken from first chart
    tdata.globals.defs.push(d[charts[0]])
  })
  // For now, charts>globals>duration to globals
  // and other globals to defaults for chart
  data.filter(d => d.type === 'chart' && d.entity === 'globals').forEach(d => {
    if (d.property_z === 'duration') {
      // From first chart
      tdata.globals['duration'] = d[charts[0]]
      tdata.globals['transition'] = 'yes'
    } else if (d.property_z) {
      charts.forEach(chartName => {
        const chart = tdata.charts.find(c => c.id === chartName)
        chart.defaults[d.property_z] = d[chartName]
      })
    }
  })

  // Now populate the chart entities
  typeAndEntity.forEach(te => {
    const rows = data.filter(d => d.type === te.type && d.entity === te.entity)
    const header = rows[0]
    const forCharts = charts.filter(name => header[name] === 'yes')
    const properties = rows.slice(1)
    properties.forEach((p,i) => {
      const propName = p.property_z
      forCharts.forEach(name => {
        const tChart = tdata.charts.find(c => c.id === name)
        const tEntityArray = tChart[`${te.type}s`]
        let tEntity = tEntityArray.find(e => e.id === te.entity)
        if (!tEntity) {
          tEntity = {id: te.entity}
          tEntityArray.push(tEntity)
        }
        if (p[name] !== null && p[name] !== '') {
          // default entity can have blank values in CSV where
          // no value provided for a particular chart therefore
          // only assign if value is not blank.
          tEntity[propName] = p[name]
        }
      })
    })
  })

  return tdata
}

function checkCols(data, errHtmlEl) {

  const errMsg = (msg) => {
    const row = errHtmlEl.append('tr')
    row.append('td').text(msg)
  }

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('CSV Problem')

  const cols = data.columns

  // Check for mandatory columns
  if (cols[0] !== 'type') {
    errMsg("The first column of the CSV must be 'type'.")
  }
  if (cols[1] !== 'entity') {
    errMsg("The second column of the CSV must be 'entity'.")
  }
  if (cols[2] !== 'property_z') {
    errMsg("The fourth column of the CSV must be 'property_z'.")
  }
  if (!cols.length > 3) {
    errMsg("There must be at least four columns. The fourth and subsequent columns are named with unique chart identifiers.")
  }

  // Check charts are correctly named - they must be unique names and consist
  // of any non-white characters.
  const charts = cols.filter((c,i) => i >= 3 && c.length > 0) 
  charts.forEach((c,i) => {
    if (c.length === 0) {
      errMsg(`There is no chart id for column ${i+4}, but there is data in that column. Either head the column with a chart id or remove the data.`)
    } else if (!c.match(/^\S+$/)) {
      errMsg(`The chart id for column ${i+4} is not valid - it cannot contain any spaces.`)
    }
  })
  
  return errHtmlEl.selectAll('tr').size() === 1
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
                <li>or the element with id <i>default</i> under <i>${chart.id}>${elementType}</i>,</li>
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