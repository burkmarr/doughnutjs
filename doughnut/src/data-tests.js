
//### TODO ###
// What about properties that can have negative angles??

// Named formats
const f = {
  numberWithMod: {
    re: ['^[-.0-9]+(\\s+[rx%])?$', '^[-.0-9]+\\s+[-.0-9]+\\s+[-.0-9]+(\\s+[rx%])?$'],
    disp: ['n', 'n m', 'n n n', 'n n n m'],
    example: ['80', '80 %', '0 80 0', '0 80 0 *'],
    expl: 'Where n is a number and m is a modifier (x, % or r).'
  },
  NumberNoMod: {
    re: ['^[-.0-9]+$', '^[-.0-9]+\\s+[-.0-9]+\\s+[-.0-9]+$'],
    disp: ['n', 'n m', 'n n n', 'n n m'],
    example: ['80', '80 %', '0 80 0', '0 80 0 %'],
    expl: 'Where n is a number and m is a modifier (x, % or r).'
  },
  zeroToOne: {
    re: ['^[01]+$', '^0\.[0-9]$'],
    disp: ['0 or 1', '0.d'],
    example: ['0 or 1', '0.5'],
    expl: 'Where d is a single digit.'
  },
  colour: {
    re: ['^[a-z]+$', '^#?[A-Da-f0-9]{6}$', '^rgb\\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})\\)$'],
    disp: ['named HTML color', 'hex color specification', 'rgb colour specification'],
    example: ['magenta', '#B3C9F4', 'rgb(179,201,0)'],
    expl: ''
  },
  string: {
    re: ['^\\S+$'],
    disp: ['A string without spaces'],
    example: ['chart1'],
    expl: ''
  },
  url: {
    re: ['^\\S+$'],
    disp: ['A string without spaces'],
    example: ['images/rockstrom-earth.png'],
    expl: ''
  },
}

// Error check definitions
const  properties = [
  {
    name: 'id',
    optionalOn: [],
    mandatoryOn: ['images', 'arcs', 'arclines'],
    formats: f.string,
  },
  {
    name: 'location',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.url,
  },
  {
    name: 'width',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.numberWithMod,
  },
  {
    name: 'radius',
    optionalOn: [],
    mandatoryOn: ['images', 'arclines'],
    formats: f.numberWithMod,
  },
  {
    name: 'radius1',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberWithMod,
  },
  {
    name: 'radius2',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberWithMod,
  },
  {
    name: 'angle',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.NumberNoMod,
  },
  {
    name: 'angle1',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.NumberNoMod,
  },
  {
    name: 'angle2',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.NumberNoMod,
  },
  {
    name: 'rot',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.NumberNoMod,
  },
  {
    name: 'opacity',
    optionalOn: ['arcs'],
    mandatoryOn: ['images', 'arclines'],
    formats: f.zeroToOne,
  },
  {
    name: 'colour',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.colour,
  },
  {
    name: 'stroke',
    optionalOn: ['arcs'],
    mandatoryOn: ['arclines'],
    formats: f.colour,
  },
  {
    name: 'stroke-width',
    optionalOn: ['arcs'],
    mandatoryOn: ['arclines'],
    formats: f.NumberNoMod,
  },
  {
    name: 'angle0',
    optionalOn: [],
    mandatoryOn: [],
    formats: f.NumberNoMod,
  },
  {
    name: 'angleSpan',
    optionalOn: [],
    mandatoryOn: [],
    formats: f.NumberNoMod,
  },
  {
    name: 'angleSpan',
    optionalOn: [],
    mandatoryOn: [],
    formats: f.NumberNoMod,
  },
  {
    name: 'radiusSpanReal',
    optionalOn: [],
    mandatoryOn: [],
    formats: f.NumberNoMod,
  },
  {
    name: 'cornerRadius',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.NumberNoMod,
  },
  {
    name: 'padAngle',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.NumberNoMod,
  },
  {
    name: 'padRadius',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.NumberNoMod,
  }
]

export function getProperties () {
  return properties
}