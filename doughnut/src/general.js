import * as yaml from 'js-yaml'
import * as d3 from 'd3'

export function addDef(el, name, def) {

  let defs = el.select('defs')
  if (!defs.size()) {
    defs = el.append('defs')
  }
  let existing = defs.select(`#${name}`)
  if (existing.size()) {
    // Def already exists - replace it
    existing.remove()
  }
  defs.html(`${defs.html()}${def}`)
}

export function fetchYaml(file) {

  return new Promise((resolve, reject) => {
    fetch(`${file}?${Math.random()}`).then(response => {
      if (response.status !== 200) {
        console.log(`Fetch error. Status code: ${response.status}`)
        resolve({})
      }
      response.text().then(data => {
        try {
          yaml.loadAll(data, json => {
            //console.log(json)
            resolve(json)
          })
        } catch(e) {
          console.log('Error in yaml file:', e)
          resolve({})
        }
      })
    }).catch(err => {
      console.log('Fetch error: ', err)
      resolve({})
    })
  })
}

export function fetchCsv(file) {
  return d3.csv(file)
}

export function cloneObj(obj) {
  return JSON.parse(JSON.stringify(obj))
}