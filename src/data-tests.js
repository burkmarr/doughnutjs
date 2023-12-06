
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
  url: {
    re: ['^\\S+$'],
    disp: ['A string without spaces'],
    example: ['images/rockstrom-earth.png'],
    expl: ''
  },
}

// Error text literals
const eTrans1 = 'value at the start of a transition'
const eTrans2 = 'the actual value after the transition'
const eTrans3 = 'the value at the end of the transition before exiting'
const eNoQuotes = '(Omit single quotes used here to demarcate the formats.)'

const eMandatory = `The property ##prop_path## is mandatory. You can specify it
  directly or in one of the default specifications - ##el_default_path## or ##global_default_path##`

//  where n1 is the ${eTrans1}, 2 ${eTrans2} and n3 ${eTrans3}. ${eNoQuotes}

// Error check definitions
const  properties = [
  {
    name: 'location',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.url,
    missingError: eMandatory
  },
  {
    name: 'width',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.numberWithMod,
    missingError: eMandatory
  },
  {
    name: 'rad',
    optionalOn: [],
    mandatoryOn: ['images', 'arclines'],
    formats: f.numberWithMod,
    missingError: eMandatory
  },
  {
    name: 'rad1',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberWithMod,
    missingError: eMandatory
  },
  {
    name: 'rad2',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberWithMod,
    missingError: eMandatory
  },
  {
    name: 'ang',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.NumberNoMod,
    missingError: eMandatory
  },
  {
    name: 'ang1',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.NumberNoMod,
    missingError: eMandatory
  },
  {
    name: 'ang2',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.NumberNoMod,
    missingError: eMandatory
  },
  {
    name: 'rot',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.NumberNoMod,
    missingError: eMandatory
  },
  {
    name: 'opacity',
    optionalOn: ['arcs'],
    mandatoryOn: ['images', 'arclines'],
    formats: f.zeroToOne,
    missingError: eMandatory
  },
  {
    name: 'colour',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.colour,
    missingError: eMandatory
  },
  {
    name: 'stroke',
    optionalOn: ['arcs'],
    mandatoryOn: ['arclines'],
    formats: f.colour,
    missingError: eMandatory
  },
  {
    name: 'stroke-width',
    optionalOn: ['arcs'],
    mandatoryOn: ['arclines'],
    formats: f.NumberNoMod,
    missingError: eMandatory
  }
]

export function getProperties () {
  return properties
}