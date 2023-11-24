function dv(prop, value) {
  // Default value
  if (!prop) {
    prop = value
  }
}

function wm(prop, message) {
  // Warning message
  if (!prop) {
    console.warn(message)
    prop
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

export function expandData(data) {

  // Canvas default values
  dv(data.canvas, {})
  dv(data.canvas.width, 650)
  dv(data.canvas.height, 650)

  cr(data, 'canvas', 'width', 'height')

  // Images warn if values missing
  if (data.images) {
    data.images.forEach((img, i) => {
      wm(img.id, 'Warning: an image is lacking the id attribute. It will be ignored.')
      wm(img.width, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the id attribute. It will be ignored.`)
      wm(img.location, `Warning: image with id '${img.id ? img.id : '(not specified)'}' is lacking the location attribute. It will be ignored.`)
      cr(data.images, i, 'id', 'width', 'location')
    })
  }
}