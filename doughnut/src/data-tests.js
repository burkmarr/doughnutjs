
//### TODO ###
// What about properties that can have negative angles??

// Named formats
const f = {
  numberWithMod: {
    re: ['^[-.0-9]+(\\s+[rx%])?$', '^[-.0-9]+\\s+[-.0-9]+(\\s+[rx%])?$', '^[-.0-9]+\\s+[-.0-9]+\\s+[-.0-9]+(\\s+[rx%])?$'],
    disp: ['n', 'n m', 'n n', 'n m', 'n n n', 'n n n m'],
    example: ['80', '80 %', '0 80', '0 80 r', '0 80 0', '0 80 0 x'],
    expl: 'Where n is a number and m is a modifier (x, % or r).'
  },
  numberNoMod: {
    re: ['^[-.0-9]+$', '^[-.0-9]+\\s+[-.0-9]+\\s+[-.0-9]+$'],
    disp: ['n', 'n n n'],
    example: ['80', '0 80 0'],
    expl: 'Where n is a number and m is a modifier (x, % or r).'
  },
  oneTo1000: {
    re: ['^[1-9]$', '^[1-9][0-9]$', '^[1-9][0-9][0-9]$', '^1000$'],
    disp: ['n'],
    example: ['500'],
    expl: 'Where n is a number between 1 and 1000 (no fractions).'
  },
  zeroToOne: {
    re: ['^[01]$|^0\.[0-9]$', '([01]|0\.[0-9])\\s+([01]|0\.[0-9])\\s+([01]|0\.[0-9])$'],
    disp: ['0|1', '0.d', '0|1|0.d 0|1|0.d 0|1|0.d' ],
    example: ['0', '0.5', '0 0.5 1'],
    expl: 'Where d is a single digit.'
  },
  colour: {
    re: ['^[a-z]+$', '^#?[A-Da-f0-9]{6}$', '^rgb\\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})\\)$'],
    disp: ['named HTML color', 'hex color specification', 'rgb colour specification'],
    example: ['magenta', '\'#B3C9F4\'', 'rgb(179,201,0)'],
    expl: ''
  },
  string: {
    re: ['^\\S+$'],
    disp: ['A string without spaces'],
    example: ['chart1'],
    expl: ''
  },
  fontFilter: {
    re: ['^\\S+$'],
    disp: ['A string without spaces'],
    example: ['whiteOutlineEffect'],
    expl: 'The id of a filter defined in the defs section of the data yaml.'
  },
  url: {
    re: ['^\\S+$'],
    disp: ['A string without spaces'],
    example: ['images/rockstrom-earth.png'],
    expl: ''
  },
  text: {
    re: ['^(?!\\s*$).+'],
    disp: ['A string that can include spaces'],
    example: ['Change in land use'],
    expl: ''
  },
  strokeDasharry: {
    re: ['^[1-9]$', '^[1-9]-[0-9]$'],
    disp: ['Either a single digit or two separated by a dash'],
    example: ['2', '2-1'],
    expl: 'Dasharray attribute'
  },
  trueFalse: {
    re: ['^true$', '^false$'],
    disp: ['Either true or false'],
    example: ['true'],
    expl: ''
  },
  fontStyle: {
    re: ['^normal$', '^italic$', '^oblique$'],
    disp: ['normal', 'italic', 'oblique'],
    example: ['normal', 'italic', 'oblique'],
    expl: 'If not set, normal is default'
  },
}

// Error check definitions
const properties = [
  {
    name: 'remove',
    optionalOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
    mandatoryOn: [],
    formats: f.trueFalse,
  },
  {
    name: 'id',
    optionalOn: [],
    mandatoryOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
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
    mandatoryOn: ['images', 'arclines', 'texts'],
    formats: f.numberWithMod,
  },
  {
    name: 'radius1',
    optionalOn: [],
    mandatoryOn: ['arcs', 'spokes'],
    formats: f.numberWithMod,
  },
  {
    name: 'radius2',
    optionalOn: [],
    mandatoryOn: ['arcs', 'spokes'],
    formats: f.numberWithMod,
  },
  {
    name: 'angle',
    optionalOn: [],
    mandatoryOn: ['images', 'spokes'],
    formats: f.numberWithMod,
  },
  {
    name: 'angle1',
    optionalOn: ['texts'],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.numberWithMod,
  },
  {
    name: 'angle2',
    optionalOn: ['texts'],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.numberWithMod,
  },
  {
    name: 'rot',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.numberNoMod,
  },
  {
    name: 'opacity',
    optionalOn: ['arcs', 'texts'],
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
    mandatoryOn: ['arclines', 'spokes'],
    formats: f.colour,
  },
  {
    name: 'strokeWidth',
    optionalOn: ['arcs'],
    mandatoryOn: ['arclines', 'spokes'],
    formats: f.numberNoMod,
  },
  {
    name: 'strokeDasharray',
    optionalOn: ['arcs', 'arclines', 'spokes'],
    mandatoryOn: [],
    formats: f.strokeDasharry,
  },
  {
    name: 'angle0',
    optionalOn: ['arcs'],
    mandatoryOn: [],
    formats: f.numberNoMod,
  },
  {
    name: 'angleSpan',
    optionalOn: [],
    mandatoryOn: [],
    formats: f.numberNoMod,
  },
  {
    name: 'radiusSpanReal',
    optionalOn: [],
    mandatoryOn: [],
    formats: f.numberNoMod,
  },
  {
    name: 'cornerRadius',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberNoMod,
  },
  {
    name: 'padAngle',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberNoMod,
  },
  {
    name: 'padRadius',
    optionalOn: [],
    mandatoryOn: ['arcs'],
    formats: f.numberNoMod,
  },
  {
    name: 'text',
    optionalOn: [],
    mandatoryOn: ['texts'],
    formats: f.text,
  },
  {
    name: 'fontSize',
    optionalOn: [],
    mandatoryOn: ['texts'],
    formats: f.numberNoMod,
  },
  {
    name: 'fontStyle',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.fontStyle,
  },
  {
    name: 'fontFamily',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.text,
  },
  {
    name: 'fontWeight',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.oneTo1000,
  },
  {
    name: 'fontFilter',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.fontFilter,
  },
  {
    name: 'fontColour',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.text,
  },
]

export function getProperties () {
  return properties
}