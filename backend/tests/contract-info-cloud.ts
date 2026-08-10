import worker from '../src/index'

class MemoryR2 {
  private values = new Map<string, string>()
  constructor(bookings: Record<string, unknown>[]) {
    this.values.set('data/bookings.json', JSON.stringify({ bookings }))
  }
  async get(key: string) {
    const value = this.values.get(key)
    if (value == null) return null
    return { json: async () => JSON.parse(value) }
  }
  async put(key: string, value: string) {
    this.values.set(key, String(value))
  }
}

const storage = new MemoryR2([{
  id: 218,
  naam_organisator: 'Cloud test',
  email: 'cloud@example.invalid',
  type_feest: 'Verjaardag',
  feest_datum: '2030-01-04',
  basisprijs: 500,
  extra_prijzen: JSON.stringify({ ceremonie_set: '250', karaoke: '150' }),
  ceremonie_set: 1,
  karaoke: 0,
}])
const env = { STORAGE: storage as unknown as R2Bucket, ENVIRONMENT: 'test' }
const request = (path: string, init?: RequestInit) => worker.fetch(new Request(`https://test.local${path}`, init), env as never, {} as ExecutionContext)

const first = await request('/api/bookings/218/contract-info')
if (first.status !== 200) throw new Error(`GET contract-info gaf ${first.status}: ${await first.text()}`)
const initial = (await first.json() as { contract_info: Record<string, unknown> }).contract_info
if (Number(initial.ceremonie_set) !== 1 || Number(initial.karaoke) !== 0) throw new Error('Initiële cloudselecties zijn fout')

const saved = await request('/api/bookings/218/contract-info', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    booking_id: 218,
    naam: 'Cloud test',
    email: 'cloud@example.invalid',
    gsm: '0400000000',
    klant_adres: 'Teststraat 1',
    event_type: 'Verjaardag',
    event_datum: '2030-01-04',
    locatie_naam: 'Testzaal',
    locatie_adres: 'Zaalstraat 2',
    basisprijs: 500,
    extra_prijzen: JSON.stringify({ ceremonie_set: '250', karaoke: '150' }),
    ceremonie_set: 0,
    karaoke: 1,
  }),
})
if (saved.status !== 200) throw new Error(`PUT contract-info gaf ${saved.status}: ${await saved.text()}`)

const second = await request('/api/bookings/218/contract-info')
const updated = (await second.json() as { contract_info: Record<string, unknown> }).contract_info
const bookingResponse = await request('/api/bookings/218')
const booking = (await bookingResponse.json() as { booking: Record<string, unknown> }).booking

if (Number(updated.ceremonie_set) !== 0 || Number(updated.karaoke) !== 1) throw new Error('Contract Info las de opgeslagen selecties niet terug')
if (Number(booking.ceremonie_set) !== 0 || Number(booking.karaoke) !== 1) throw new Error('Booking werd niet gesynchroniseerd')
if (String(updated.extra_prijzen) !== JSON.stringify({ ceremonie_set: '250', karaoke: '150' })) throw new Error('Extra prijzen gingen verloren')

console.log(JSON.stringify({
  success: true,
  get_contract_info: 200,
  put_contract_info: 200,
  booking_synced: true,
  selected_for_pdf: ['karaoke'],
  expected_pdf_total: 650,
}, null, 2))
