import { format } from 'date-fns'
import { Booking } from '../types/booking'

function isTruthyFlag(value: unknown): boolean {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === '1' || normalized === 'true' || normalized === 'yes'
  }
  return value === true || Number(value) === 1
}

/**
 * De agenda bevat uitsluitend evenementen vanaf vandaag die niet afgewezen zijn.
 * Zowel bevestigde boekingen als nog openstaande aanvragen blijven zichtbaar.
 */
export function isVisibleInAgenda(booking: Booking, today = format(new Date(), 'yyyy-MM-dd')): boolean {
  const eventDate = String(booking.feest_datum || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return false
  if (eventDate < today) return false
  return !isTruthyFlag(booking.is_afgewezen)
}
