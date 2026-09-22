import {
  DISCOUNT_NOTE_EXTRA_KEY,
  WEDDING_FORMULAS,
  WEDDING_TIMING_NOTICE,
  getWeddingFormulaFromExtraPrices,
  parseExtraPrices,
  stringifyExtraPrices,
} from '../src/config/weddingFormulas'

const expected = [
  ['avondfeest', 'Aanwezig vanaf het hoofdgerecht', 850],
  ['receptie_avondfeest', 'Aanwezig vanaf de receptie', 950],
  ['ceremonie_receptie_avondfeest', 'Aanwezig vanaf de ceremonie', 1200],
] as const

for (const [key, arrivalMoment, price] of expected) {
  const formula = WEDDING_FORMULAS.find(item => item.key === key)
  if (!formula || formula.arrivalMoment !== arrivalMoment || formula.price !== price) {
    throw new Error(`Onjuiste trouwformule: ${key}`)
  }
}

if (!WEDDING_TIMING_NOTICE.includes('+ € 100') || !WEDDING_TIMING_NOTICE.includes('+ € 350')) {
  throw new Error('De formuleclausule mist een prijsverschil.')
}

const discountReason = 'De zaal voorziet de geluids- en lichtinstallatie.'
const stored = stringifyExtraPrices({
  _trouw_formule: 'avondfeest',
  _korting: '125',
  [DISCOUNT_NOTE_EXTRA_KEY]: discountReason,
})
const parsed = parseExtraPrices(stored)
const formula = getWeddingFormulaFromExtraPrices(stored)

if (parsed[DISCOUNT_NOTE_EXTRA_KEY] !== discountReason || formula?.key !== 'avondfeest') {
  throw new Error('De kortingsuitleg of trouwformule blijft niet correct bewaard.')
}

console.log(JSON.stringify({ success: true, formulas: expected.length, discountReason: true }, null, 2))
