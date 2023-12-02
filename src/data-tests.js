

// Named formats
const f = {
  name: simpleNumber = '$\d+^',
}

// Error text literals
const eTrans1 = 'value at the start of a transition'
const eTrans2 = 'the actual value after the transition'
const eTrans3 = 'the value at the end of the transition before exiting'
const eNoQuotes = '(Omit single quotes used here to demarcate the formats.)'
const eMandatory = `The property ##prop_path## is mandatory. You can specify it
  directly or in one of the defats specification - ##el_default_path## or ##global_default_path##`

// Error check definitions
const  properties = [
  {
      name: 'rad',
      opitionaOn: [arcs, arclines],
      mandatoryOn: [],
      formats: [f.simpleNumber, '$\d+\s+\d+\s+\d+(\s*(x%)*)*^', '$\d+\.\d+\s+\d+\.\d+\s+\d+\.\d+\s+ (x%)*^'],
      formatError: `The property ##prop_path## must be specified with one of these formats; 'n <m>'
        where n is a number and m is a modifier (x, % or r), or 'n1 n2 n3 m') where n1 is the ${eTrans1}, 
        n2 ${eTrans2} and n3 ${eTrans3}. ${eNoQuotes}`,
      missingError: eMandatory
  }
]

export function getProperties () {
  return properties
}