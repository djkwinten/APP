import { isVisibleCalendarBooking } from '../src/routes/calendar'

const today = '2030-06-15'
const cases = [
  {
    name: 'komende bevestigde boeking blijft zichtbaar',
    booking: { feest_datum: '2030-06-16', is_afgewezen: 0 },
    expected: true,
  },
  {
    name: 'komende open aanvraag blijft zichtbaar',
    booking: { feest_datum: '2030-07-01', is_afgewezen: 0 },
    expected: true,
  },
  {
    name: 'afgewezen aanvraag verdwijnt',
    booking: { feest_datum: '2030-07-01', is_afgewezen: 1 },
    expected: false,
  },
  {
    name: 'afgewezen stringwaarde verdwijnt ook',
    booking: { feest_datum: '2030-07-01', is_afgewezen: '1' as unknown as number },
    expected: false,
  },
  {
    name: 'boeking van vandaag blijft zichtbaar',
    booking: { feest_datum: '2030-06-15', is_afgewezen: 0 },
    expected: true,
  },
  {
    name: 'verlopen boeking verdwijnt',
    booking: { feest_datum: '2030-06-14', is_afgewezen: 0 },
    expected: false,
  },
]

for (const testCase of cases) {
  const actual = isVisibleCalendarBooking(testCase.booking, today)
  if (actual !== testCase.expected) {
    throw new Error(`${testCase.name}: verwacht ${testCase.expected}, kreeg ${actual}`)
  }
}

console.log(JSON.stringify({
  success: true,
  tested: cases.length,
  visible: cases.filter(testCase => testCase.expected).map(testCase => testCase.name),
  hidden: cases.filter(testCase => !testCase.expected).map(testCase => testCase.name),
}, null, 2))
