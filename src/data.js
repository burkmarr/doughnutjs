export async function postprocessData(data) {

  // First check and ensure data integrity

  // Canvas default values
  dv(data, 'canvas', {})
  dv(data, 'defaults', {})
  dv(data.canvas, 'width_px', 650)
  dv(data.canvas, 'height_px', 650)
  dv(data.canvas, 'angle_origin', 340)
  dv(data.canvas, 'angle_delta', 0)
  dv(data.canvas, 'radius_px', 150)
  dv(data.canvas, 'radius_real', null)

  // Charts default values and missing value warnings
  dv(data.charts, {})
  data.charts.forEach(async chart => {
    dv(chart, 'id', null)
    dv(chart, 'images', [])
    dv(chart, 'arcs', [])
    
    // Images
    chart.images.forEach(async (img, i) => {
      // Default values
      dv(img, 'id', null)
      // dv(img, 'opacity', [1, 1, 1])
      dv(img, 'ang', [0, 0, 0])
      dv(img, 'rad', [0, 0, 0])
      dv(img, 'rot', [0, 0, 0])
      // Missing data warnings
      wm(img.width, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the width attribute. It will be ignored.`)
      wm(img.location, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the location attribute. It will be ignored.`)
    })
  })

  // Propagate default values
  propagateDefaults(data)

  // Update images with aspect ratio of image
  const pp = []
  data.charts.forEach(async chart => {
    chart.images.forEach(async img => {
      if (img.location) {
        pp.push(getImageWidth(img.location, img))
      }
    })
  })

  // Resolve all the number formats
  resolveNumericFormats(data, data.canvas.radius_real, data.canvas.radius_px, data.canvas.angle_delta)

  // Initialise the currentArcParams property
  data.charts.forEach(chart => {
    chart.arcs.forEach(arc => {
      arc.currentArcParams = getArcParams(arc, 0)
    })
  })

  await Promise.all(pp)
}

export function getArcParams (d, i) {
  return {
    innerRadius: d.rad1[i],
    outerRadius: d.rad2[i],
    startAngle: (d.angle_origin + d.ang1[i]) * Math.PI / 180,
    endAngle: (d.angle_origin + d.ang2[i]) * Math.PI / 180
  }
}

function propagateDefaults(data) {
  const elementTypes = ['images', 'arcs', 'spokes', 'text', 'arrows']
  data.charts.forEach(chart => {
    elementTypes.forEach(type => {
      if (chart[type]) {
        const defaults = chart[type].find(e => e.id === 'default')
        // console.log('defaults1', defaults)
        // console.log('defaults0', data.defaults)
        chart[type].forEach(element => {
          if (defaults && element.id !== 'default') {
            // Element collection level defaults
            Object.keys(defaults).forEach(def => {
              // If the default does not exist on the other elements then add.
              if (!element[def]) {
                element[def] = defaults[def]
              }
            })
          }
          // Top level defaults
          if (data.defaults) {
            data.defaults.forEach(tlDef => {
              const def = Object.keys(tlDef)[0]
              // If the default does not exist on the other elements then add.
              if (!element[def]) {
                element[def] = tlDef[def]
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

function dv(obj, prop, value) {
  // Default value
  if (!obj[prop]) {
    obj[prop] = value
  }
}

function wm(prop, message) {
  // Warning message
  if (!prop) {
    console.warn(message)
  }
}

function cr(parent, idexOrName, ...props) {
  // Conditional removal of array item or object property.
  // If any of the properties are missing, the property or
  // array item is removed.
  // If an array, second argument is a numeric array index
  // otherwise it is the name of a property.

  let obj = parent[idexOrName]
  let remove
  for (let i=0; i<props.length; i++) {
    if (!obj[props[i]]) {
      remove = true
      break
    }
  }
  if (remove) {
    if (Array.isArray(parent)) {
      parent.splice(idexOrName, 1)
    } else {
      delete parent[idexOrName]
    }
  }
}

function resolveNumericFormats (obj, radius_real, radius_px, angle_delta) {

  const keys = [
    ['rad', 'px'],
    ['rad1', 'px'],
    ['rad2', 'px'],
    ['ang', 'deg'],
    ['ang1', 'deg'],
    ['ang2', 'deg'],
    ['width', 'px'],
    ['rot', 'n'],
    ['opacity', 'n'],
    ['colour', 's'],
    ['stroke', 's'],
    ['stroke-width', 'n'],
    ['stroke-dasharray', 's']
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
        if (vals[vals.length-1] === '%' || vals[vals.length-1] === 'x') {
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
      resolveNumericFormats(obj[key], radius_real, radius_px, angle_delta)
    }
  })

  function convertValue(val, modifier, type) {

    let multiplier
    if (type === 'px') {
      multiplier = radius_px
    } else if (type === 'deg') {
      multiplier = angle_delta
    }
    if (modifier === '%' && multiplier) {
      // Value expressed as % of radius_px or angle_delta
      return Number(val) / 100 * multiplier
    } else if (modifier === 'x' && multiplier) {
      // Value expressed as a multiplier of radius_px or angle_delta
      return Number(val) * multiplier
    } else if (radius_real && type === 'px') {
      // Radius value expressed as in real units
      return Number(val) / radius_real * radius_px
    } else if (type === 's') {
      // Value expressed directly
      return  val
    } else {
      // Value expressed directly
      return  Number(val)
    }
  }
}