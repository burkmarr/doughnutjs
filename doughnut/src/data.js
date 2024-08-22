import { cloneObj } from './general.js'
import { getProperties } from './data-defs.js'
import { getArcParams } from './arcs.js'
import { getArclineParams } from './arclines.js'
import { getSpokeParams } from './spokes.js'
import { getTextParams } from './texts.js'
import { getArrowParams } from './arrows.js'

const elementTypes = ['arcs', 'arclines', 'images', 'spokes', 'texts', 'arrows']
let dataCsv

export async function parseRecipe(data, errHtmlEl) {

  console.log('Raw CSV recipe', cloneObj(data))

  // First clean up CSV data and sort out data types
  data = cleanCsv(data)

  // Check the column names of the CSV and return if fails
  if (!checkCols(data, errHtmlEl)) return

  // Check other aspects of the CSV and return if fails
  if (!checkRows(data, errHtmlEl)) return

  // Validate property value formats and return if fails
  if (!validateProps(data, errHtmlEl)) return

  // Highlight unpermitted properties and return if fails
  if (!unpermittedProps(data, errHtmlEl)) return

  // At this point restructure the CSV structure into the format that
  // we will use with D3. It is must easier to propagate default
  // properties after this point. To do it in the CSV structure
  // we would need to insert rows.
  dataCsv = cloneObj(data)
  data = restructureCsv(data)

  console.log('Transformed CSV recipe', cloneObj(data))

  // Propagate default values
  propogateDefaultProps(data)
  // console.log('Propogated recipe', data)

  // Find missing values
  if (!missingProps(data, errHtmlEl)) return

  // Resolve all the number formats
  resolveNumericFormats(data)

  // Initialise additional properties required for tweening
  initialiseTweenProps(data)

  // Record the aspect ratio of any images
  // I don't think this is needed anymore
  // await Promise.all(recordImageAspectRatio(data))

  console.log('Parsed recipe', data)
  // Return the new data object
  return data
}

function cleanCsv(data) {

  const cleanValue = function (val) {
    // Trim any spaces from around values
    let newVal = val.trim()
    // Remove any multiple spaces
    newVal = newVal.replace(/\s+/g, ' ')
    // Change from string to number (fixType)
    // where appropriate
    if (String(Number(newVal)) === newVal) {
      return Number(newVal)
    } else {
      return newVal
    }
  }

  // Remove any columns with no header.
  // These can occur if CSV has a column with no header and there
  // is (or was) data anywhere in the column.
  const columns = data.columns.filter(c => c)
  const cleanData = data.map(d => {
    const dn = {}
    columns.forEach(k => {
      dn[k] = cleanValue(d[k])
    })
    return dn
  })
  cleanData.columns = columns

  return cleanData
}

function checkCols(data, errHtmlEl) {

  const errMsg = (col, msg) => {
    const row = errHtmlEl.append('tr')
    row.append('td').text(col)
    row.append('td').text(msg)
  }

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Column')
  errTableHdrRow.append('th').text('Problem')

  const cols = data.columns

  // Check for mandatory columns
  if (cols[0] !== 'type') {
    errMsg(cols[0], "The header of the first column of the CSV must be 'type'.")
  }
  if (cols[1] !== 'entity') {
    errMsg(cols[1], "The header of the second column of the CSV must be 'entity'.")
  }
  if (cols[2] !== 'z') {
    errMsg(cols[2], "The header of the fourth column of the CSV must be 'r'.")
  }
  if (cols[3] !== 'property') {
    errMsg(cols[2], "The header of the fourth column of the CSV must be 'property'.")
  }
  if (!cols.length > 4) {
    errMsg('', 'There must be at least five columns. The fifth and subsequent columns are named with unique chart identifiers.')
  }

  // Check charts are correctly named - they must be unique names and consist
  // only of non-white characters.
  const charts = cols.filter((c,i) => i >= 4 && c.length > 0) 
  charts.forEach((c,i) => {
    if (!c.match(/^\S+$/)) {
      errMsg(c, `The chart id (header) for this column is not valid - it cannot contain any spaces.`)
    }
  })
  
  return errHtmlEl.selectAll('tr').size() === 1
}

function checkRows(data, errHtmlEl) {

  const errMsg = (row, col, msg) => {
    const tr = errHtmlEl.append('tr')
    tr.append('td').html(row)
    tr.append('td').html(col)
    tr.append('td').html(msg)
  }

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Row number')
  errTableHdrRow.append('th').text('Column')
  errTableHdrRow.append('th').text('Problem')

  const charts = Object.keys(data[0]).slice(4)

  // Data cannot include any blank rows
  data.forEach((d,i) => {
    let blank = true
    Object.keys(d).forEach(column => {
      if (d[column] !== '') {
        blank = false
      }
    })
    if (blank) {
      errMsg(i+1,'all', `No columns have values. CSV should not have blank rows.`)
    }
  })
  // Type can only be one of default, chart, image, arc, arcline, spoke, arrow
  const types = ['default', 'chart', 'image', 'arc', 'arcline', 'spoke', 'text', 'arrow']
  data.forEach((d,i) => {
    if (d.type && !types.includes(d.type)) {
      errMsg(i+1,'type', `${d.type} is not a valid type. Must be one of ${types.join(', ')}.`)
    }
  })
  // Entity of type chart must be either metric, def or default
  const chartEntities = ['metric', 'def', 'default']
  data.forEach((d,i) => {
    if (d.type && d.type === 'chart' && !chartEntities.includes(d.entity)) {
      errMsg(i+1,'entity', `'${d.entity}' is not a valid entity for chart type. Must be one of ${chartEntities.join(', ')}.`)
    }
  })
  // Entity cannot contain whitespace
  data.forEach((d,i) => {
    if (d.entity && !d.entity.match(/^\S+$/)) {
      errMsg(i+1,'entity', `'${d.entity}' is not a valid entity name because it contains spaces.`)
    }
  })

  // Each type must have an entity and visa versa
  // and each type and entity must have a z value
  // and no row can have a value if not type and entity specified
  // z values must be numeric
  data.forEach((d,i) => {
    if ((d.type && !d.entity)) {
      errMsg(i+1,'entity', 'A value is required for entity if there is a value for type.')
    }
    if (!d.type && d.entity) {
      errMsg(i+1,'type', 'A value is required for type if there is a value for entity.')
    }
    //if (d.type && d.entity && d.type !== 'chart' && d.type !== 'default' && d.entity !== 'default' && !d.z) {
    if (d.type && d.entity && d.type !== 'chart' && d.type !== 'default' && !d.entity.startsWith('default') && !d.z) {
      errMsg(i+1,'z', `A value is required for z if there is a value for type and entity (unless type is 'chart' or entity is 'default').`)
    }
    if (!d.type && !d.entity && d.z) {
      errMsg(i+1,'z', `A value for z is only required where for type and entity are set (unless type is 'chart' or entity is 'default').`)
    }
    if (d.type === 'chart' && d.z) {
      errMsg(i+1,'z', `A value for z is not required where type is 'chart'.`)
    }
    if (d.entity === 'default' && d.z) {
      errMsg(i+1,'z', `A value for z is not required where entity is 'default'.`)
    }
    if (d.z && typeof d.z !== 'number') {
      errMsg(i+1,'property', `The z value '<b>${d.property}</b>' is not valid, it must be a number.`)
    }
  })

  // Each combination of type & entity must be unique
  const typeEntity = data.filter(d => d.type && d.entity).map(d => `${d.type} ${d.entity}`)
  const typeEntitySorted = typeEntity.slice().sort()
  const duplicates = []
  for (let i = 0; i < typeEntitySorted.length - 1; i++) {
    if (typeEntitySorted[i+1] === typeEntitySorted[i]) {
      duplicates.push(typeEntitySorted[i])
    }
  }
  duplicates.forEach(d => {
    data.forEach((r,i) => {
      if (d === `${r.type} ${r.entity}`) {
        errMsg(i+1,'type/entity', `The type/entity combination '<b>${r.type}/${r.entity}</b>' is repeated: they must be unique combinations.`)
      }
    })
  })

  // Each type & entity must have a value of either 'yes' or '' against every
  // chart column unless it is of type 'chart'
  // and no value for property
  data.forEach((d,i) => {
    if (d.type && d.entity && d.type !== 'chart') {
      charts.forEach(c => {
        if (d[c] !== 'yes' && d[c] !== '') {
          errMsg(i+1,c, `Type/entity rows must have either no value or the value 'yes' against each chart column.`)
        }
      })
    }
    if (d.type && d.entity && d.property !== '') {
      errMsg(i+1, 'property', `Type/entity rows must not have a value in the property column.`)
    }
  })

  // Any cell with a value of '=' under one of the charts, must come after a chart with a value
  data.forEach((d,i) => {
    if (!d.type && !d.entity) {
      charts.forEach((name, iChart) => {
        if (d[name] === '=') {
          if (iChart === 0) {
            errMsg(i+1, name, `First chart cannot have entity values of '='.`)
          }
          if (d[charts[iChart-1]] === '') {
            errMsg(i+1, name, `Entity values of '=' cannot follow a blank value for the previous chart.`)
          }
          
        }
      })
    }
  })

  return errHtmlEl.selectAll('tr').size() === 1
}

function restructureCsv(data) {
  //const charts = data.columns.filter((c,i) => i >= 4)
  const charts = Object.keys(data[0]).slice(4)
  const typeAndEntity = data.filter(d => d.type && d.type !== 'chart'  && d.type !== 'default').map(d => {
    return {type: d.type, entity: d.entity, z: d.z}
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
  const tdata = {charts:[], }
  tdata.charts = charts.map(c => {
    const chart = {
      id: c,
      defaults: {},
      metrics: {},
      defs: {}
    }
    elementTypes.forEach(et => {
      chart[et] = []
    })
    return chart
  })

  // Chart-metric to chart metrics collection
  data.filter(d => d.type === 'chart' && d.entity === 'metric' && d.property).forEach(d => {
    charts.forEach(chartName => {
      const chart = tdata.charts.find(c => c.id === chartName)
      if (d[chartName] !== ''){
        chart.metrics[d.property] = d[chartName]
      }
    })
  })
  // Chart-def to chart defs collection
  data.filter(d => d.type === 'chart' && d.entity === 'def' && d.property).forEach(d => {
    charts.forEach(chartName => {
      const chart = tdata.charts.find(c => c.id === chartName)
      if (d[chartName]) {
        chart.defs[d.property] = d[chartName]
      }
    })
  })
  // Defaults to defaults for chart
  data.filter(d => d.type === 'chart' && d.entity === 'default' && d.property).forEach(d => {
    charts.forEach(chartName => {
      const chart = tdata.charts.find(c => c.id === chartName)
      chart.defaults[d.property] = d[chartName]
    })
  })
  // Now populate the chart entities
  //console.log('typeAndEntity', typeAndEntity)
  typeAndEntity.forEach(te => {
    const rows = data.filter(d => d.type === te.type && d.entity === te.entity)
    const header = rows[0]
    const forCharts = charts.filter(name => header[name] === 'yes')
    const properties = rows.slice(1)
    properties.forEach((p,i) => {
      const propName = p.property
      forCharts.forEach(name => {
        const tChart = tdata.charts.find(c => c.id === name)
        const tEntityArray = tChart[`${te.type}s`]
        let tEntity = tEntityArray.find(e => e.id === te.entity)
        if (!tEntity) {
          tEntity = {id: te.entity, z: te.z}
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

  // Add an element to the transformed data which contains all the unique
  // combinations of element type and z value. This will be used to
  // create SVG g elements - the z value being used to order them.
  let grps = data.filter(d => d.type && d.z).map(d => `${d.z}-${d.type}s`)
  grps = grps.filter((d,i) => grps.indexOf(d) === i).map(g => {
    const ag = g.split('-')
    return {type: ag[1], z: Number(ag[0])}
  }).sort((a,b) => {
    if (a.z < b.z) {
      return 1
    } else if (a.z > b.z) {
      return -1
    } else {
      return 0
    }
  })
  tdata.grps = grps

  return tdata
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

function propogateDefaultProps(data) {
  const propDefs = getProperties()
  data.charts.forEach(chart => {
    const chartDefaults = chart.defaults ? chart.defaults : {}
    elementTypes.forEach(elementType => {
      if (chart[elementType]) {
        // Get the chart element type defaults which apply to all elements of this entity type
        const elementDefaults = chart[elementType].find(e => e.id === 'default')
        // Identify properties allowed on this element type that have a default value
        const propDefDefaults = propDefs.filter(propDef => {
          return propDef.optionalOn.find(et => et === elementType) && propDef.hasOwnProperty('default')
        })
        // Now update any elements with defaults from these levels
        chart[elementType].filter(element => element.id !== 'default' && !element.id.startsWith('default-')).forEach(element => {
          // First element collection targeted defaults (highest priority)
          chart[elementType].filter(e => e.id.startsWith('default-')).forEach(targetedDefaults => {
            const target = targetedDefaults.id.substring(8)
            if (element.id.startsWith(`${target}-`)) {
              Object.keys(targetedDefaults).filter(prop => prop !== 'z' && prop !== 'id').forEach(elementDefault => {
                // If the default does not exist on the element then add.
                if (!element[elementDefault]) {
                  element[elementDefault] = targetedDefaults[elementDefault]
                }
              })
            }
          })
          // Now element collection defaults 
          if (elementDefaults) {
            Object.keys(elementDefaults).forEach(elementDefault => {
              // If the default does not exist on the element then add.
              if (!element[elementDefault]) {
                element[elementDefault] = elementDefaults[elementDefault]
              }
            })
          }
          // Now chart defaults
          Object.keys(chartDefaults).forEach(chartDefault => {
            // If the chart default does not exist on the element then add if it
            // is allowed on this element type
            const propDef = propDefs.find(pd => pd.name === chartDefault)
            const allowed =  [...propDef.mandatoryOn, ...propDef.optionalOn].includes(elementType)
            if (allowed && !element[chartDefault]) {
              element[chartDefault] = chartDefaults[chartDefault]
            }
          })
          // By this point, all recipe defined defaults are propogated.
          // Now go through any optional properties for this element type 
          // that have a default value defined in the defition and if
          // not defined on element, set it with the default value.
          propDefDefaults.forEach(propDef => {
            if (!element[propDef.name]) {
              element[propDef.name] = propDef.default
            }
          })
        })
      }
    })
  })
  // Remove all objects with id 'default' or id that startswith 'default-id'
  data.charts.forEach(chart => {
    elementTypes.forEach(type => {
      if (chart[type]) {
        const reduce = chart[type].filter(e => e.id !== 'default' && !e.id.startsWith('default-'))
        chart[type] = reduce
      }
    })
  })
}

function validateProps(data, errHtmlEl) {

  const errMsg = (row, type, entity, prop, chart, value, msg) => {
    const tr = errHtmlEl.append('tr')
    tr.append('td').html(row)
    tr.append('td').html(type)
    tr.append('td').html(entity)
    tr.append('td').html(prop)
    tr.append('td').html(chart)
    tr.append('td').html(value)
    tr.append('td').html(msg)
  }

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Row')
  errTableHdrRow.append('th').text('type')
  errTableHdrRow.append('th').text('entity')
  errTableHdrRow.append('th').text('property')
  errTableHdrRow.append('th').text('chart')
  errTableHdrRow.append('th').text('value')
  errTableHdrRow.append('th').text('Permitted formats')

  let cType, cEntity
  const propDefs = getProperties()
  const charts = Object.keys(data[0]).slice(4)

  data.forEach((d,irow) => {
    if (d.type) {
      cType = d.type
      cEntity = d.entity
    } else {
      // Check property value for each chart
      charts.forEach(chart => {
        if (cEntity !== 'def' && cEntity !== 'metric' && d[chart] !== '=' && d[chart] !== '') {
          const propDef = propDefs.find(propdef => propdef.name === d.property)
          if (propDef) {
            let permittedFormat = false
            for (let i=0; i<propDef.formats.re.length; i++) {
              const regex = new RegExp(propDef.formats.re[i])
              if (regex.test(d[chart])) {
                permittedFormat = true
              }
            }
            if (!permittedFormat) {
              let err = '<ul>'
              propDef.formats.disp.forEach((d,i) => {
                err = `${err}<li><b>${d}</b> - e.g. <b>${propDef.formats.example[i]}</b></li>`
              })
              err = `${err}</ul> ${propDef.formats.expl}`
              errMsg(irow+1, cType, cEntity, d.property, chart, d[chart], err)
            }
          } else {
            errMsg(irow+1, cType, cEntity, d.property, chart, d[chart], 'No definition')
          }
        }
      })
    }
  })

  return errHtmlEl.selectAll('tr').size() === 1
}

function missingProps(data, errHtmlEl) {

  const errMsg = (row, type, entity, prop, chart, msg) => {
    const tr = errHtmlEl.append('tr')
    tr.append('td').html(row)
    tr.append('td').html(type)
    tr.append('td').html(entity)
    tr.append('td').html(prop)
    tr.append('td').html(chart)
    tr.append('td').html(msg)
  }

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')

  errTableHdrRow.append('th').text('row')
  errTableHdrRow.append('th').text('type')
  errTableHdrRow.append('th').text('entity')
  errTableHdrRow.append('th').text('property')
  errTableHdrRow.append('th').text('chart')
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
          if (!element.id.startsWith('default-')) { // Doesn't apply to special entities that define a default group
            mandatoryProps.forEach(mandatoryProp => {
              if (!Object.keys(element).find(prop => prop === mandatoryProp)) {
                const msg = `
                  Mandatory prop not found. Specify it either:
                  <ul>
                  <li>directly on the element (type <i>${elementType}</i> and entity <i>${element.id}</i>),</li>
                  <li>or the element with type <i>${elementType}</i> and entity <i>default</i>,</li>
                  <li>or under type <i>charts</i> and entity <i>defaults</i>.
                  </ul>
                `
                // Find the row in CSV corresponding to element
                let iRow
                for (let i=0; i < dataCsv.length; i++) {
                  if (`${dataCsv[i].type}s` === elementType && dataCsv[i].entity === element.id) {
                    iRow = i+1
                    break
                  }
                }
                errMsg(iRow, elementType, element.id, mandatoryProp, chart.id, msg)
              }
            })
          }
        })
      }
    })
  })

  return errHtmlEl.selectAll('tr').size() === 1
}

function unpermittedProps(data, errHtmlEl) {

  const errMsg = (row, type, entity, prop, msg) => {
    const tr = errHtmlEl.append('tr')
    tr.append('td').html(row)
    tr.append('td').html(type)
    tr.append('td').html(entity)
    tr.append('td').html(prop)
    tr.append('td').html(msg)
  }

  errHtmlEl.html('')
  const errTableHdrRow = errHtmlEl.append('tr')
  errTableHdrRow.append('th').text('Row')
  errTableHdrRow.append('th').text('type')
  errTableHdrRow.append('th').text('entity')
  errTableHdrRow.append('th').text('property')
  errTableHdrRow.append('th').text('Permitted formats')

  let cType, cEntity
  const propDefs = getProperties()

  data.forEach((d,irow) => {
    if (d.type) {
      cType = d.type
      cEntity = d.entity
    } else {
      if (cType !== 'chart' && cType !== 'default') {
        const propDef = propDefs.find(propdef => propdef.name === d.property)
        let permitted = [...propDef.mandatoryOn, ...propDef.optionalOn]
        if (!permitted.find(type => type === `${cType}s`)) {
          errMsg (irow+1, cType, cEntity, d.property, 'Property not allowed on this element type.')
        }
      }
    }
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

// function recordImageAspectRatio(data) {

//   const allPromises = []

//   data.charts.forEach(async chart => {
//     chart.images.forEach(async img => {
//       if (img.location) {
//         allPromises.push(getImageWidth(img.location, img))
//       }
//     })
//   })
//   return allPromises

//   function getImageWidth(src, dataImage){
//     return new Promise((resolve, reject) => {
//       let img = new Image()
//       img.onload = () => {
//         // dataImage.origWidth = img.width
//         // dataImage.origHeight = img.height
//         dataImage.aspectRatio = img.width / img.height
//         img = null
//         resolve()
//       }
//       img.onerror = reject
//       img.src = src
//     })
//   }
// }