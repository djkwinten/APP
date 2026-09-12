import { calendarSubscriptionUrls } from '../src/lib/calendarSubscription'

const cases = [
  {
    name: 'same-origin Cloudflare app',
    apiRoot: '',
    pageOrigin: 'https://djapp.dentandtkwinten.workers.dev',
    expectedHttps: 'https://djapp.dentandtkwinten.workers.dev/api/calendar/bookings.ics',
    expectedWebcal: 'webcal://djapp.dentandtkwinten.workers.dev/api/calendar/bookings.ics',
  },
  {
    name: 'aparte API Worker',
    apiRoot: 'https://api.example.workers.dev/',
    pageOrigin: 'https://app.example.workers.dev',
    expectedHttps: 'https://api.example.workers.dev/api/calendar/bookings.ics',
    expectedWebcal: 'webcal://api.example.workers.dev/api/calendar/bookings.ics',
  },
]

for (const testCase of cases) {
  const actual = calendarSubscriptionUrls(testCase.apiRoot, testCase.pageOrigin)
  if (actual.httpsUrl !== testCase.expectedHttps || actual.webcalUrl !== testCase.expectedWebcal) {
    throw new Error(`${testCase.name} mislukt: ${JSON.stringify(actual)}`)
  }
}

console.log(JSON.stringify({
  success: true,
  cases: cases.map(testCase => testCase.name),
  iphoneUrl: cases[0].expectedWebcal,
}, null, 2))
