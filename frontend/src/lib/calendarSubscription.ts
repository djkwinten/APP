const CALENDAR_FEED_PATH = '/api/calendar/bookings.ics'

export type CalendarSubscriptionUrls = {
  httpsUrl: string
  webcalUrl: string
}

/**
 * iOS opent een agenda-abonnement alleen betrouwbaar via een absolute webcal-URL.
 * Bij een same-origin productiebuild is VITE_API_URL leeg, dus gebruiken we de
 * zichtbare app-origin in plaats van een relatief /api-pad.
 */
export function calendarSubscriptionUrls(
  apiRoot: string | undefined,
  pageOrigin: string,
): CalendarSubscriptionUrls {
  const base = (apiRoot || pageOrigin).trim().replace(/\/+$/, '')
  const resolvedBase = new URL(base || pageOrigin, pageOrigin)
  const basePath = resolvedBase.pathname.replace(/\/+$/, '')

  resolvedBase.pathname = `${basePath}${CALENDAR_FEED_PATH}`
  resolvedBase.search = ''
  resolvedBase.hash = ''

  const httpsUrl = resolvedBase.toString()
  const webcalUrl = httpsUrl.replace(/^https?:\/\//i, 'webcal://')

  return { httpsUrl, webcalUrl }
}
