
export async function postprocessData(data) {

  // Canvas default values
  dv(data, 'canvas', {})
  dv(data.canvas, 'width_px', 650)
  dv(data.canvas, 'height_px', 650)
  dv(data.canvas, 'angle_origin', 340)
  dv(data.canvas, 'angle_delta', 0)
  dv(data.canvas, 'radius_px', 150)
  dv(data.canvas, 'radius_real', null)

  // Resolve all the number formats
  resolveNumericFormats(data, data.canvas.radius_real, data.canvas.radius_px, data.canvas.angle_delta)

  // Charts
  const pp = []
  dv(data.charts, {})
  data.charts.forEach(async chart => {
    dv(chart, 'id', null)
    dv(chart, 'images', [])
    dv(chart, 'arcs', [])
    
    // Images
    chart.images.forEach(async (img, i) => {
      // Default values
      dv(img, 'id', null)
      dv(img, 'opacity', [1, 1, 1])
      dv(img, 'ang', [0, 0, 0])
      dv(img, 'rad', [0, 0, 0])
      dv(img, 'rot', [0, 0, 0])
      // Missing data warnings
      wm(img.width, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the width attribute. It will be ignored.`)
      wm(img.location, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the location attribute. It will be ignored.`)

      if (img.location) {
        // Update data with aspect ratio of image
        pp.push(getImageWidth(img.location, img))
      }

      //cr(chart.images, i, 'width', 'location')
    })
  })

  await Promise.all(pp)
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

function updateNumericForUnits (obj, radius_real, radius_px) {
  if (radius_real) {
    Object.keys(obj).forEach(key => {
      //console.log(`key: ${key}, value: ${obj[key]}`)
      if (key.endsWith('_ru')) {
        const newKey = key.substring(0,key.length-3)
        obj[newKey] = [
          obj[key][0] / radius_real * radius_px,
          obj[key][1] / radius_real * radius_px,
          obj[key][2] / radius_real * radius_px
        ]
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        updateNumericForUnits(obj[key], radius_real, radius_px)
      }
    })
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
    ['rot', null],
    ['opacity', null]
  ]
  Object.keys(obj).forEach(key => {

    const keyMatch = keys.find(ki => ki[0] === key)
    
    if (keyMatch) {
      const key = keyMatch[0]
      const units = keyMatch[1]

      if (typeof obj[key] === 'string' || typeof obj[key] === 'number') {

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
          newVal[0] = convertValue(vals[0], modifier, units)
          newVal[1] = convertValue(vals[1], modifier, units)
          newVal[2] = convertValue(vals[2], modifier, units)
        } else {
          newVal[0] = convertValue(vals[0], modifier, units)
          newVal[1] = convertValue(vals[0], modifier, units)
          newVal[2] = convertValue(vals[0], modifier, units)
        }

        // Arc transitions don't work if the enter or exit radius is zero
        // so reset to small value.
        // if (units === 'px' && newVal[0] === 0 && newVal[2] === 0 && newVal[1] > 0) {
        //   newVal[0] = 1
        //   newVal[2] = 1
        // }
        // Update value
        obj[key] = newVal
      }
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      resolveNumericFormats(obj[key], radius_real, radius_px, angle_delta)
    }
  })

  function convertValue(val, modifier, units) {

    let multiplier
    if (units === 'px') {
      multiplier = radius_px
    } else if (units === 'deg') {
      multiplier = angle_delta
    }
    let ret
    if (modifier === '%' && multiplier) {
      // Value expressed as % of radius_px or angle_delta
      return Number(val) / 100 * multiplier
    } else if (modifier === 'x' && multiplier) {
      // Value expressed as a multiplier of radius_px or angle_delta
      return Number(val) * multiplier
    } else if (radius_real && units === 'px') {
      // Radius value expressed as in real units
      return Number(val) / radius_real * radius_px
    } else {
      // Value expressed directly
      return  Number(val)
    }
  }
}

