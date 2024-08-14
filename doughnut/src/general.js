import * as yaml from 'js-yaml'
import * as d3 from 'd3'

export function addDef(el, def) {

  console.log('addDef', def)
  let defs
  if (el.select('defs').size()) {
    defs = el.select('defs')
    defs.html(`${defs.html()}${def}`)
  } else {
    defs = el.append('defs')
    defs.html(def)
  }
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