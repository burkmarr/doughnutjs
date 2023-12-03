import * as yaml from 'js-yaml'

export function addDef(el, name) {

  const filters = {
  // Text filter for Rockstrom 2009
  whiteOutlineEffect: `
      <filter id="whiteOutlineEffect" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" result="MORPH" operator="dilate" radius="1" />
      <feColorMatrix in="MORPH" result="WHITENED" type="matrix" values="-1 0 0 0 1, 0 -1 0 0 1, 0 0 -1 0 1, 0 0 0 1 0"/>
      <feMerge>
      <feMergeNode in="WHITENED"/>
      <feMergeNode in="SourceGraphic"/>
      </feMerge>
      </filter>
    `,
    otherOutlineEffect: `
      <filter id="otherOutlineEffect" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" result="MORPH" operator="dilate" radius="1" />
      <feColorMatrix in="MORPH" result="WHITENED" type="matrix" values="1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 1 0"/>
      <feMerge>
      <feMergeNode in="WHITENED"/>
      <feMergeNode in="SourceGraphic"/>
      </feMerge>
      </filter>
    `
  }

  let defs
  if (el.select('defs').size()) {
    defs = el.select('defs')
    defs.html(`${defs.html()}${filters[name]}`)
  } else {
    defs = el.append('defs')
    defs.html(filters[name])
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