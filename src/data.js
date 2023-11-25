
export function postprocessData(data) {

  // Canvas default values
  dv(data, 'canvas', {})
  dv(data.canvas, 'width', 650)
  dv(data.canvas, 'height', 650)
  dv(data.canvas, 'angle0', 0)
  dv(data.canvas, 'c_unit', 150)
  dv(data.canvas, 'r_unit', data.canvas.c_unit)

  // Update numeric values specified in real units (<field>_ru creates attr <field>)
  updateNumericForUnits(data, data.canvas.r_unit, data.canvas.c_unit)

  // Propagate properties down object??

  // Charts
  dv(data.charts, {})
  data.charts.forEach(chart => {
    dv(chart, 'id', null)
    
    // Images warn if values missing
    chart.images.forEach((img, i) => {
      dv(img, 'id', null)
      dv(img, 'opacity', 1)
      wm(img.width, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the width attribute. It will be ignored.`)
      wm(img.location, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the location attribute. It will be ignored.`)
      //cr(chart.images, i, 'width', 'location')
    })
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

function updateNumericForUnits (obj, r_unit, c_unit) {
  if (r_unit) {
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] !== 'object') {
        //console.log(`key: ${key}, value: ${obj[key]}`)
        if (key.endsWith('_ru')) {
          const newKey = key.substring(0,key.length-3)
          obj[newKey] = obj[key] / r_unit * c_unit
        }
      }
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        updateNumericForUnits(obj[key], r_unit, c_unit)
      }
    })
  }
}
