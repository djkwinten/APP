import { readFileSync } from 'node:fs'

import {
  DISCOUNT_NOTE_EXTRA_KEY,
  WEDDING_FORMULAS,
  WEDDING_TIMING_NOTICE,
  getWeddingFormulaFromExtraPrices,
  parseExtraPrices,
  selectMinimumWeddingFormula,
  selectWeddingFormula,
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

const ceremonyUpgrade = selectWeddingFormula(stringifyExtraPrices({
  _trouw_formule: 'receptie_avondfeest',
  ceremonie_set: 250,
  digital_booth: 175,
}), 'ceremonie_receptie_avondfeest')
const ceremonyPrices = parseExtraPrices(ceremonyUpgrade.extra_prijzen)
if (
  ceremonyUpgrade.basisprijs !== 1200 ||
  ceremonyUpgrade.ceremonie_set !== 0 ||
  ceremonyPrices.ceremonie_set !== undefined ||
  Number(ceremonyPrices.digital_booth) !== 175
) {
  throw new Error('De ceremoniekeuze wordt niet correct naar de volledige formule omgezet.')
}

const entranceUpgrade = selectMinimumWeddingFormula(
  stringifyExtraPrices({ _trouw_formule: 'avondfeest', _korting: 50 }),
  'receptie_avondfeest',
)
if (
  entranceUpgrade.formula.key !== 'receptie_avondfeest' ||
  entranceUpgrade.basisprijs !== 950 ||
  Number(parseExtraPrices(entranceUpgrade.extra_prijzen)._korting) !== 50
) {
  throw new Error('Een zaalintrede schakelt niet correct naar Receptie + avondfeest.')
}

const fullPackagePreserved = selectMinimumWeddingFormula(
  stringifyExtraPrices({ _trouw_formule: 'ceremonie_receptie_avondfeest' }),
  'receptie_avondfeest',
)
if (fullPackagePreserved.formula.key !== 'ceremonie_receptie_avondfeest' || fullPackagePreserved.basisprijs !== 1200) {
  throw new Error('Een zaalintrede mag de volledige ceremonieformule niet verlagen.')
}

const customerFormSource = readFileSync(new URL('../src/pages/CustomerForm.tsx', import.meta.url), 'utf8')
for (const requiredText of ['Feestelijke intrede in de zaal', 'Feestelijke intrede toevoegen?', 'Ja, toevoegen', 'Annuleren', 'toonZaalintredeMuziek']) {
  if (!customerFormSource.includes(requiredText)) throw new Error(`De zaalintredeflow mist: ${requiredText}`)
}
for (const removedText of ['{WEDDING_TIMING_NOTICE}', 'Ceremonie is geen losse extra van €250', '{WEDDING_FORMULA_FOOTNOTE}']) {
  if (customerFormSource.includes(removedText)) throw new Error(`Overbodige trouwinformatie staat nog in het klantformulier: ${removedText}`)
}

const contractInfoSource = readFileSync(new URL('../src/features/event-workspace/components/ContractInfoForm.tsx', import.meta.url), 'utf8')
for (const removedText of ['{WEDDING_TIMING_NOTICE}', 'Ceremonie is geen losse extra van €250', '{WEDDING_FORMULA_FOOTNOTE}']) {
  if (contractInfoSource.includes(removedText)) throw new Error(`Overbodige trouwinformatie staat nog bij Factuur & contract: ${removedText}`)
}

console.log(JSON.stringify({ success: true, formulas: expected.length, discountReason: true, packageUpgrades: true, entranceChoiceGatesMusic: true, conciseCeremonyCopy: true }, null, 2))
