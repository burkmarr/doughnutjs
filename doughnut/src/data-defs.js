// If a property that is optional has a default value specified,
// then the property will be added with the default value for any
// of the optional element types in the recipe that do not include
// the value after all recipe defaults are propagated. 
// That means it is safe for code to expect the value
// to be there, but allows recipies to be defined without specifying
// a value.

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
    re: ['^[a-z]+$', '^#?[A-Fa-f0-9]{6}$', '^rgb\\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})\\)$', '^def-[a-z]+$'],
    disp: ['named HTML colour', 'hex colour specification', 'rgb colour specification', 'colour definition name'],
    example: ['magenta', '\'#B3C9F4\'', 'rgb(179,201,0)', 'def-rockred'],
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
  SEM: {
    re: ['^start$', '^end$', '^middle$'],
    disp: ['start', 'end', 'middle'],
    example: ['start', 'end', 'middle'],
    expl: 'If not set, middle is default'
  },
  textPathStyle: {
    re: ['^line$', '^arc$'],
    disp: ['line', 'arc'],
    example: ['line', 'arc'],
    expl: 'If not set, line is default'
  }
}

// Error check definitions
const properties = [
  {
    name: 'remove',
    optionalOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
    mandatoryOn: [],
    formats: f.trueFalse,
    number: false,
    threeable: false,
  },
  {
    name: 'id',
    optionalOn: [],
    mandatoryOn: ['images', 'arcs', 'arclines', 'spokes', 'texts', 'arrows'],
    formats: f.string,
    number: false,
    threeable: false
  },
  {
    name: 'location',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.url,
    number: false,
    threeable: false,
  },
  {
    name: 'width',
    optionalOn: [],
    mandatoryOn: ['images'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'radius',
    optionalOn: [],
    mandatoryOn: ['images', 'arclines', 'texts', 'arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'radius1',
    optionalOn: [],
    mandatoryOn: ['arcs', 'spokes'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'radius2',
    optionalOn: [],
    mandatoryOn: ['arcs', 'spokes'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'angle',
    optionalOn: [],
    mandatoryOn: ['texts', 'images', 'spokes', 'arrows'],
    formats: f.numberWithMod,
    span: 'angleSpan',
    number: true,
    threeable: true,
  },
  {
    name: 'angle1',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.numberWithMod,
    span: 'angleSpan',
    number: true,
    threeable: true,
  },
  {
    name: 'angle2',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arclines'],
    formats: f.numberWithMod,
    span: 'angleSpan',
    number: true,
    threeable: true,
  },
  {
    name: 'rot',
    optionalOn: ['images', 'texts', 'arrows'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: true,
  },
  {
    name: 'opacity',
    optionalOn: ['images', 'arclines', 'arcs', 'texts', 'arrows'],
    mandatoryOn: [],
    formats: f.zeroToOne,
    default: 1,
    number: true,
    threeable: true,
  },
  {
    name: 'colour',
    optionalOn: [],
    mandatoryOn: ['arcs', 'arrows'],
    formats: f.colour,
    number: false,
    threeable: true,
  },
  {
    name: 'stroke',
    optionalOn: ['arcs', 'arclines', 'spokes', 'arrows'],
    mandatoryOn: [],
    formats: f.colour,
    default: 'black',
    number: false,
    threeable: true,
  },
  {
    name: 'strokeWidth',
    optionalOn: ['arcs', 'arclines', 'spokes', 'arrows'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: true,
  },
  {
    name: 'strokeDasharray',
    optionalOn: ['arcs', 'arclines', 'spokes', 'arrows'],
    mandatoryOn: [],
    formats: f.strokeDasharry,
    number: false,
    threeable: true,
  },
  {
    name: 'angle0',
    optionalOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: false,
  },
  {
    name: 'angleSpan',
    optionalOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 360,
    number: true,
    threeable: false,
  },
  {
    name: 'radiusSpanPx',
    optionalOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 150,
    number: true,
    threeable: false,
  },
  {
    name: 'radiusSpanReal',
    optionalOn: ['images', 'arcs', 'arclines', 'spokes', 'texts'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 100,
    number: true,
    threeable: false,
  },
  {
    name: 'cornerRadius',
    optionalOn: ['arcs'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: true,
  },
  {
    name: 'padAngle',
    optionalOn: ['arcs'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: true,
  },
  {
    name: 'padRadius',
    optionalOn: ['arcs'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: true,
  },
  {
    name: 'text',
    optionalOn: [],
    mandatoryOn: ['texts'],
    formats: f.text,
    number: false,
    threeable: false,
  },
  {
    name: 'fontSize',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 10,
    number: true,
    threeable: true,
  },
  {
    name: 'fontStyle',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.fontStyle,
    default: 'normal',
    number: false,
    threeable: false,
  },
  {
    name: 'fontFamily',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.text,
    default: 'arial',
    number: false,
    threeable: false
  },
  {
    name: 'fontWeight',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.oneTo1000,
    default: 500,
    number: true,
    threeable: true,
  },
  {
    name: 'fontFilter',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.fontFilter,
    default: null,
    number: false,
    threeable: false,
  },
  {
    name: 'fontColour',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.colour,
    default: 'black',
    number: false,
    threeable: false
  },
  {
    name: 'textReverse',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.trueFalse,
    default: false,
    number: false,
    threeable: false,
  },
  {
    name: 'textAlign',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.SEM,
    default: 'middle',
    number: false,
    threeable: false,
  },
  {
    name: 'textOffset',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.numberWithMod,
    default: 0,
    span: 'textOffsetSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'textOffsetSpanPx',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.numberWithMod,
    default: 10,
    number: true,
    threeable: true,
  },
  {
    name: 'textPathStyle',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.textPathStyle,
    default: 'arc',
    number: false,
    threeable: false,
  },
  {
    name: 'textSpacing',
    optionalOn: ['texts'],
    mandatoryOn: [],
    formats: f.numberNoMod,
    default: 0,
    number: true,
    threeable: false,
  },
  {
    name: 'al1',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'al37',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'al28',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'al5',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'al46',
    optionalOn: ['arrows'],
    mandatoryOn: [],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'aw46',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'aw28',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
  {
    name: 'aw37',
    optionalOn: [],
    mandatoryOn: ['arrows'],
    formats: f.numberWithMod,
    span: 'radiusSpanPx',
    number: true,
    threeable: true,
  },
]

export function getProperties () {
  return properties
}