

// Named formats
const f = {
  simpleNumber: '^[-.0-9]+(\\s+[rx%])?$',
  transNumber: '^[-.0-9]+\\s+[-.0-9]+\\s+[-.0-9]+(\\s+[rx%])?$'
}

// Error text literals
const eTrans1 = 'value at the start of a transition'
const eTrans2 = 'the actual value after the transition'
const eTrans3 = 'the value at the end of the transition before exiting'
const eNoQuotes = '(Omit single quotes used here to demarcate the formats.)'
const eMandatory = `The property ##prop_path## is mandatory. You can specify it
  directly or in one of the default specifications - ##el_default_path## or ##global_default_path##`

// Error check definitions
const  properties = [
  {
    name: 'rad',
    opitionalOn: ['arcs', 'arclines'],
    mandatoryOn: [],
    formats: [f.simpleNumber, f.transNumber],
    formatError: `The property ##prop_path## must be specified with one of these formats; 'n <m>'
      where n is a number and m is a modifier (x, % or r), or 'n1 n2 n3 m') where n1 is the ${eTrans1}, 
      n2 ${eTrans2} and n3 ${eTrans3}. ${eNoQuotes}`,
    missingError: eMandatory
  },
  {
    name: 'ang',
    opitionalOn: ['arcs', 'arclines'],
    mandatoryOn: [],
    formats: [f.simpleNumber, f.transNumber],
    formatError: `The property ##prop_path## must be specified with one of these formats; 'n <m>'
      where n is a number and m is a modifier (x, % or r), or 'n1 n2 n3 m') where n1 is the ${eTrans1}, 
      n2 ${eTrans2} and n3 ${eTrans3}. ${eNoQuotes}`,
    missingError: eMandatory
}
]

export function getProperties () {

  // Tests
  let regex 
  
  // regex = new RegExp(f.simpleNumber)
  // console.log(regex.test('0.5'))
  // console.log(regex.test('4567'))
  // console.log(regex.test('0'))
  // console.log(regex.test('-3.4'))
  // console.log(regex.test('1 %'))
  // console.log(regex.test('1 x'))
  // console.log(regex.test('1 r'))

  regex = new RegExp(f.transNumber)
  console.log(regex.test('0.5 5 23'))
  console.log(regex.test('0.5  5 23   %'))
  console.log(regex.test('1 2'))


  return properties
}