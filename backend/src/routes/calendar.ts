import { Hono } from 'hono'
import { query } from '../lib/db'
import { readCloudBookings } from '../lib/cloudBookings'

type Bindings = {
  DB?: D1Database
  STORAGE?: R2Bucket
}

export const calendarRoutes = new Hono<{ Bindings: Bindings }>()

interface BookingRow {
  id: number
  feest_datum: string
  type_feest: string
  naam_organisator: string
  naam_partner1?: string | null
  naam_partner2?: string | null
  locatie_naam?: string | null
  locatie_adres?: string | null
  uur_dansfeest?: string | null
  einduur?: string | null
  is_aanvraag: number
  is_afgewezen: number
  wedding_meeting_at?: string | null
  wedding_meeting_note?: string | null
  updated_at?: string | null
}

const CALENDAR_COLUMNS: Record<keyof BookingRow, string> = {
  id: '0',
  feest_datum: "''",
  type_feest: "'Algemeen'",
  naam_organisator: "''",
  naam_partner1: 'NULL',
  naam_partner2: 'NULL',
  locatie_naam: 'NULL',
  locatie_adres: 'NULL',
  uur_dansfeest: 'NULL',
  einduur: 'NULL',
  is_aanvraag: '0',
  is_afgewezen: '0',
  wedding_meeting_at: 'NULL',
  wedding_meeting_note: 'NULL',
  updated_at: 'NULL',
}

async function bookingColumnSet(env: Bindings) {
  const rows = await query<{ name: string }>(env, 'PRAGMA table_info(bookings)')
  return new Set(rows.map(r => r.name))
}

async function calendarSelectSql(env: Bindings) {
  const existing = await bookingColumnSet(env)
  const fields = Object.entries(CALENDAR_COLUMNS).map(([name, fallback]) =>
    existing.has(name) ? name : `${fallback} AS ${name}`
  )
  const orderBy = existing.has('feest_datum') ? 'ORDER BY feest_datum ASC' : 'ORDER BY id ASC'
  return `SELECT ${fields.join(', ')} FROM bookings ${orderBy}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function dateInBrussels(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function isTruthyFlag(value: unknown): boolean {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return value === true || Number(value) === 1
}

/** Alleen vandaag/toekomst, nooit afgewezen. Open aanvragen blijven zichtbaar. */
export function isVisibleCalendarBooking(
  booking: Pick<BookingRow, 'feest_datum' | 'is_afgewezen'>,
  today = dateInBrussels(),
): boolean {
  const eventDate = String(booking.feest_datum || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return false
  return eventDate >= today && !isTruthyFlag(booking.is_afgewezen)
}

function icalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(y, (m || 1) - 1, d || 1))
  date.setUTCDate(date.getUTCDate() + days)
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`
}

function icalDateTime(dateStr: string, timeStr?: string | null): string {
  const datePart = dateStr.replace(/-/g, '')
  if (!timeStr) return datePart
  const cleanTime = String(timeStr).slice(0, 5)
  const timePart = cleanTime.replace(':', '') + '00'
  return `${datePart}T${timePart}`
}

function icalDateTimeWithRollover(dateStr: string, startTime?: string | null, endTime?: string | null): string {
  if (!endTime) return icalDateTime(dateStr, '23:59')
  const cleanStart = String(startTime || '').slice(0, 5)
  const cleanEnd = String(endTime).slice(0, 5)
  const endDate = cleanStart && cleanEnd <= cleanStart ? addDays(dateStr, 1) : icalDate(dateStr)
  return `${endDate}T${cleanEnd.replace(':', '')}00`
}

function icalDateTimeFromLocal(value: string): string | null {
  const normalized = value.replace(' ', 'T')
  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!match) return null
  return `${match[1]}${match[2]}${match[3]}T${match[4]}${match[5]}00`
}

function addMinutesToLocal(value: string, minutes: number): string | null {
  const d = new Date(value.replace(' ', 'T'))
  if (Number.isNaN(d.getTime())) return null
  d.setMinutes(d.getMinutes() + minutes)
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`
}

function escapeIcal(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line + '\r\n'

  const result: string[] = []
  let pos = 0
  while (pos < line.length) {
    const prefix = result.length === 0 ? '' : ' '
    const limit = result.length === 0 ? 75 : 74
    let chunk = ''
    let byteCount = encoder.encode(prefix).length
    for (let i = pos; i < line.length; i++) {
      const charBytes = encoder.encode(line[i]).length
      if (byteCount + charBytes > limit) break
      chunk += line[i]
      byteCount += charBytes
    }
    if (!chunk) break
    result.push(prefix + chunk)
    pos += chunk.length
  }
  return result.join('\r\n') + '\r\n'
}

function formatDtstamp(value?: string | null): string {
  const date = value ? new Date(value.replace(' ', 'T') + (/[zZ]$/.test(value) ? '' : 'Z')) : new Date()
  const d = Number.isNaN(date.getTime()) ? new Date() : date
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

calendarRoutes.get('/bookings.ics', async (c) => {
  const allBookings = !c.env.DB && c.env.STORAGE
    ? await readCloudBookings(c.env) as unknown as BookingRow[]
    : await query<BookingRow>(c.env, await calendarSelectSql(c.env))
  const bookings = allBookings.filter(booking => isVisibleCalendarBooking(booking))

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DJ Kwinten//Boekingen//NL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:DJ Kwinten Boekingen',
    'X-WR-CALDESC:Boekingen en aanvragen DJ Kwinten',
    'X-WR-TIMEZONE:Europe/Brussels',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ]

  for (const b of bookings) {
    if (!b.feest_datum) continue

    let titel = ''
    if (b.type_feest === 'Trouw' && (b.naam_partner1 || b.naam_partner2)) {
      const v1 = (b.naam_partner1 || '').split(' ')[0]
      const v2 = (b.naam_partner2 || '').split(' ')[0]
      titel = `💍 Trouw ${[v1, v2].filter(Boolean).join(' & ')}`
    } else if (b.type_feest === 'Trouw') {
      titel = `💍 Trouw ${b.naam_organisator || ''}`
    } else {
      titel = `🎉 ${b.naam_organisator || 'Feest'}`
    }

    if (b.is_aanvraag) {
      titel = `📋 [Aanvraag] ${titel.replace(/^[^\s]+\s/, '')}`
    }

    const hasStartTime = !!b.uur_dansfeest
    const dtstart = hasStartTime
      ? `DTSTART;TZID=Europe/Brussels:${icalDateTime(b.feest_datum, b.uur_dansfeest)}`
      : `DTSTART;VALUE=DATE:${icalDate(b.feest_datum)}`

    const dtend = hasStartTime
      ? `DTEND;TZID=Europe/Brussels:${icalDateTimeWithRollover(b.feest_datum, b.uur_dansfeest, b.einduur)}`
      // All-day event: DTEND is exclusive, so it must be the next day.
      : `DTEND;VALUE=DATE:${addDays(b.feest_datum, 1)}`

    const uid = `booking-${b.id}@djkwinten.be`
    const descParts: string[] = []
    if (b.type_feest) descParts.push(`Type: ${b.type_feest}`)
    if (b.is_aanvraag) descParts.push('Status: Aanvraag (nog te bevestigen)')
    const desc = descParts.join('\n')
    const locatie = [b.locatie_naam, b.locatie_adres].filter(Boolean).join(', ')
    const dtstamp = formatDtstamp(b.updated_at)

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dtstamp}`)
    lines.push(dtstart)
    lines.push(dtend)
    lines.push(`SUMMARY:${escapeIcal(titel)}`)
    if (locatie) lines.push(`LOCATION:${escapeIcal(locatie)}`)
    if (desc) lines.push(`DESCRIPTION:${escapeIcal(desc)}`)
    lines.push(`STATUS:${b.is_aanvraag ? 'TENTATIVE' : 'CONFIRMED'}`)
    lines.push('TRANSP:OPAQUE')
    lines.push('END:VEVENT')

    if (b.type_feest === 'Trouw' && b.wedding_meeting_at) {
      const meetingStart = icalDateTimeFromLocal(b.wedding_meeting_at)
      const meetingEnd = addMinutesToLocal(b.wedding_meeting_at, 60)
      if (meetingStart && meetingEnd) {
        const meetingDescParts = [
          `Voorbespreking voor: ${titel}`,
          b.feest_datum ? `Trouwfeest: ${b.feest_datum}` : '',
          b.wedding_meeting_note ? `Notitie: ${b.wedding_meeting_note}` : '',
        ].filter(Boolean)
        lines.push('BEGIN:VEVENT')
        lines.push(`UID:wedding-meeting-${b.id}@djkwinten.be`)
        lines.push(`DTSTAMP:${dtstamp}`)
        lines.push(`DTSTART;TZID=Europe/Brussels:${meetingStart}`)
        lines.push(`DTEND;TZID=Europe/Brussels:${meetingEnd}`)
        lines.push(`SUMMARY:${escapeIcal(`💍 Afspraak koppel — ${titel.replace(/^💍\s*/, '')}`)}`)
        if (b.locatie_naam) lines.push(`LOCATION:${escapeIcal(b.locatie_naam)}`)
        lines.push(`DESCRIPTION:${escapeIcal(meetingDescParts.join('\n'))}`)
        lines.push('STATUS:CONFIRMED')
        lines.push('TRANSP:OPAQUE')
        lines.push('END:VEVENT')
      }
    }
  }

  lines.push('END:VCALENDAR')
  const icsContent = lines.map(foldLine).join('')

  return new Response(icsContent, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="djkwinten-boekingen.ics"',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    }
  })
})
