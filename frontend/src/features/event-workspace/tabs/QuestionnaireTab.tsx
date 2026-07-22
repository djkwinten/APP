import { useState, type ReactNode } from 'react'
import { Copy, ExternalLink, CheckCircle2, XCircle, ClipboardList, AlertTriangle, Pencil, ChevronDown, ChevronRight } from 'lucide-react'
import { Booking } from '../../../types/booking'

type DiffMap = Record<string, { oud: unknown; nieuw: unknown }>
type Field = { key: keyof Booking | string; label: string; type?: 'text' | 'bool' | 'date' | 'json-planning' | 'json-leveranciers' | 'uploads' }
type Section = { title: string; emoji: string; fields: Field[] }

const BOOL_LABELS: Record<string, string> = {
  speakers_aanwezig: 'Geluidsinstallatie aanwezig',
  licht_aanwezig: 'Lichtshow aanwezig',
  micro_aanwezig: 'Microfoon aanwezig',
  dj_booth_aanwezig: 'DJ-booth / DJ-tafel aanwezig',
  uplights_aanwezig: 'Uplights aanwezig',
  speakers_buiten: 'Speakers buiten',
  ceremonie_set: 'Ceremonie set',
  digital_booth: 'Digitale photobooth',
  retro_booth: 'Photobooth met prints',
  draadloze_speaker: 'Extra luidspreker receptie',
  karaoke: 'Karaoke',
  toestemming_foto: 'Toestemming foto/video',
}

const FIELD_LABELS: Record<string, string> = {
  naam_organisator: 'Naam organisator', naam_partner1: 'Partner 1', naam_partner2: 'Partner 2',
  email: 'E-mail', telefoon: 'Telefoon', adres_organisator: 'Adres organisator', bedrijfsnaam: 'Bedrijfsnaam', btw_nr: 'BTW-nummer',
  aantal_gasten: 'Aantal gasten', thema: 'Thema / stijl', publiek_leeftijd: 'Publiek & leeftijd',
  werk_partner1: 'Werk partner 1', werk_partner2: 'Werk partner 2', leeftijd_partner1: 'Leeftijd partner 1', leeftijd_partner2: 'Leeftijd partner 2', hobbys_interesses: 'Hobby’s / interesses', extra_koppel_info: 'Extra info koppel',
  anderstalige_gasten: 'Anderstalige gasten', anderstalige_talen: 'Talen',
  locatie_naam: 'Locatie', locatie_adres: 'Adres locatie', zaal_contact: 'Contact zaal', geluidsbeperking_info: 'Geluidsbeperking', wifi_code: 'Wifi', parkeren_info: 'Parkeren', gelijkvloers: 'Gelijkvloers', leveranciers_info: 'Leveranciers / partners',
  uur_ceremonie: 'Ceremonie', uur_receptie: 'Receptie start', uur_receptie_einde: 'Receptie einde', uur_receptie2: 'Receptie 2 start', uur_receptie2_einde: 'Receptie 2 einde', uur_diner: 'Diner', uur_dessert: 'Dessert', uur_dansfeest: 'Dansfeest', uur_midnightsnack: 'Midnight snack', einduur: 'Einduur', planning_extra: 'Extra planning',
  top_genres: 'Favoriete genres', top_genres_extra: 'Extra favoriete genres', flop_genres: 'Te vermijden genres', flop_genres_extra: 'Extra te vermijden genres', must_play: 'Must-play nummers', do_not_play: 'Do-not-play nummers', spotify_link: 'Spotify playlist', verzoeknummers: 'Verzoeknummers', muziek_receptie: 'Muziek receptie', muziek_receptie_extra: 'Receptie extra', muziek_diner: 'Muziek diner', muziek_diner_extra: 'Diner extra', einde_feest: 'Einde feest',
  intrede_zaal_nummer: 'Intrede zaal', intrede_eretafel_nummer: 'Intrede eretafel', intrede_bridesmaids_nummer: 'Intrede bridesmaids', intrede_groomsmen_nummer: 'Intrede groomsmen', intrede_koppel_nummer: 'Intrede koppel', intrede_anders_nummer: 'Intrede anders', intrede_taart_nummer: 'Intrede taart', openingsdans_nummer: 'Openingsdans', tweede_dans_nummer: 'Tweede dans', boeket_werpen_nummer: 'Boeket werpen', verjaardag_naam_leeftijd: 'Jarige',
  opmerkingen: 'Opmerkingen', zaal_fotos: 'Uploads', feedback_vragenlijst: 'Feedback vragenlijst', feedback_herkomst: 'Hoe gevonden',
  ...BOOL_LABELS,
}

function parseDiff(raw?: string | null): DiffMap {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as DiffMap
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

function isEmpty(value: unknown) {
  return value === undefined || value === null || value === '' || value === '[]' || value === '{}'
}

function cleanMultiline(value: string) {
  return value.replace(/^MULTI:/, '').trim()
}

function formatBool(value: unknown) {
  if (value === 1 || value === '1' || value === true) return 'Ja'
  if (value === 0 || value === '0' || value === false) return 'Nee'
  return '—'
}

function formatPlanning(raw?: string | null) {
  if (!raw) return ''
  try {
    const items = JSON.parse(raw) as { label?: string; uur?: string; wie?: string }[]
    if (!Array.isArray(items) || items.length === 0) return ''
    return items
      .filter(item => item.label || item.uur || item.wie)
      .map(item => `${item.label || 'Moment'}${item.uur ? ` — ${String(item.uur).replace('Anders|', '')}` : ''}${item.wie ? ` (${item.wie})` : ''}`)
      .join('\n')
  } catch { return raw }
}

function formatLeveranciers(raw?: string | null) {
  if (!raw) return ''
  try {
    const labels: Record<string, string> = { catering: 'Catering', fotograaf: 'Fotograaf', videograaf: 'Videograaf', ceremoniemeester: 'Ceremoniemeester', weddingplanner: 'Weddingplanner', andere: 'Andere' }
    const parsed = JSON.parse(raw) as Record<string, string>
    return Object.entries(parsed)
      .filter(([, v]) => String(v || '').trim())
      .map(([k, v]) => `${labels[k] || k}: ${v}`)
      .join('\n')
  } catch { return raw }
}

type Upload = { naam?: string; category?: string; key?: string }
function formatUploads(raw?: string | null) {
  if (!raw) return ''
  try {
    const uploads = JSON.parse(raw) as Upload[]
    if (!Array.isArray(uploads) || uploads.length === 0) return ''
    const label = (cat?: string) => cat === 'uitnodiging' ? 'Uitnodiging' : cat === 'grondplan' ? 'Grondplan' : cat === 'zaal_foto' ? 'Zaalfoto' : 'Upload'
    return uploads.filter(u => u?.naam).map(u => `${label(u.category)}: ${u.naam}`).join('\n')
  } catch { return raw }
}

function formatValue(booking: Booking, field: Field, rawOverride?: unknown) {
  const value = rawOverride !== undefined ? rawOverride : (booking as unknown as Record<string, unknown>)[field.key]
  if (field.type === 'bool') return formatBool(value)
  if (field.type === 'json-planning') return formatPlanning(String(value || ''))
  if (field.type === 'json-leveranciers') return formatLeveranciers(String(value || ''))
  if (field.type === 'uploads') return formatUploads(String(value || ''))
  if (field.type === 'date' && value) {
    try { return new Date(String(value)).toLocaleDateString('nl-BE') } catch { return String(value) }
  }
  if (isEmpty(value)) return ''
  return cleanMultiline(String(value))
}

function sectionsFor(booking: Booking): Section[] {
  const isTrouw = booking.type_feest === 'Trouw'
  return [
    {
      title: isTrouw ? 'Koppel & contact' : 'Contact', emoji: isTrouw ? '💍' : '👤', fields: [
        ...(isTrouw ? [
          { key: 'naam_partner1', label: 'Partner 1' },
          { key: 'naam_partner2', label: 'Partner 2' },
          { key: 'werk_partner1', label: 'Werk partner 1' },
          { key: 'werk_partner2', label: 'Werk partner 2' },
          { key: 'leeftijd_partner1', label: 'Leeftijd partner 1' },
          { key: 'leeftijd_partner2', label: 'Leeftijd partner 2' },
          { key: 'hobbys_interesses', label: 'Hobby’s / interesses' },
          { key: 'extra_koppel_info', label: 'Extra info koppel' },
        ] : [{ key: 'naam_organisator', label: 'Naam organisator' }]),
        { key: 'email', label: 'E-mail' },
        { key: 'telefoon', label: 'Telefoon' },
        { key: 'adres_organisator', label: 'Adres organisator' },
        { key: 'bedrijfsnaam', label: 'Bedrijfsnaam' },
        { key: 'btw_nr', label: 'BTW-nummer' },
      ]
    },
    {
      title: 'Feest & gasten', emoji: '🎉', fields: [
        { key: 'feest_datum', label: 'Feestdatum', type: 'date' },
        { key: 'type_feest', label: 'Type feest' },
        { key: 'aantal_gasten', label: 'Aantal gasten' },
        { key: 'publiek_leeftijd', label: 'Publiek & leeftijd' },
        { key: 'thema', label: 'Thema / stijl' },
        { key: 'anderstalige_gasten', label: 'Anderstalige gasten' },
        { key: 'anderstalige_talen', label: 'Talen' },
        { key: 'verjaardag_naam_leeftijd', label: 'Jarige' },
      ]
    },
    {
      title: 'Zaal & techniek', emoji: '🏛️', fields: [
        { key: 'locatie_naam', label: 'Locatie' },
        { key: 'locatie_adres', label: 'Adres locatie' },
        { key: 'zaal_contact', label: 'Contact zaal' },
        { key: 'leveranciers_info', label: 'Leveranciers / partners', type: 'json-leveranciers' },
        { key: 'geluidsbeperking_info', label: 'Geluidsbeperking' },
        { key: 'wifi_code', label: 'Wifi' },
        { key: 'parkeren_info', label: 'Parkeren' },
        { key: 'gelijkvloers', label: 'Gelijkvloers', type: 'bool' },
        { key: 'speakers_aanwezig', label: BOOL_LABELS.speakers_aanwezig, type: 'bool' },
        { key: 'licht_aanwezig', label: BOOL_LABELS.licht_aanwezig, type: 'bool' },
        { key: 'micro_aanwezig', label: BOOL_LABELS.micro_aanwezig, type: 'bool' },
        { key: 'dj_booth_aanwezig', label: BOOL_LABELS.dj_booth_aanwezig, type: 'bool' },
        { key: 'uplights_aanwezig', label: BOOL_LABELS.uplights_aanwezig, type: 'bool' },
      ]
    },
    {
      title: 'Planning', emoji: '🕒', fields: [
        { key: 'uur_ceremonie', label: 'Ceremonie' },
        { key: 'uur_receptie', label: 'Receptie start' },
        { key: 'uur_receptie_einde', label: 'Receptie einde' },
        { key: 'uur_receptie2', label: 'Receptie 2 start' },
        { key: 'uur_receptie2_einde', label: 'Receptie 2 einde' },
        { key: 'uur_diner', label: 'Diner' },
        { key: 'uur_dessert', label: 'Dessert' },
        { key: 'uur_dansfeest', label: 'Dansfeest' },
        { key: 'uur_midnightsnack', label: 'Midnight snack' },
        { key: 'einduur', label: 'Einduur' },
        { key: 'planning_extra', label: 'Extra planning', type: 'json-planning' },
      ]
    },
    {
      title: 'Muziek', emoji: '🎧', fields: [
        { key: 'top_genres', label: 'Favoriete genres' },
        { key: 'top_genres_extra', label: 'Extra favoriete genres' },
        { key: 'flop_genres', label: 'Te vermijden genres' },
        { key: 'flop_genres_extra', label: 'Extra te vermijden genres' },
        { key: 'must_play', label: 'Must-play nummers' },
        { key: 'do_not_play', label: 'Do-not-play nummers' },
        { key: 'spotify_link', label: 'Spotify playlist' },
        { key: 'verzoeknummers', label: 'Verzoeknummers' },
        { key: 'muziek_receptie', label: 'Muziek receptie' },
        { key: 'muziek_receptie_extra', label: 'Receptie extra' },
        { key: 'muziek_diner', label: 'Muziek diner' },
        { key: 'muziek_diner_extra', label: 'Diner extra' },
        { key: 'einde_feest', label: 'Einde feest' },
      ]
    },
    {
      title: isTrouw ? 'Speciale trouwmomenten' : 'Speciale momenten', emoji: '✨', fields: [
        { key: 'intrede_zaal_nummer', label: 'Intrede zaal' },
        { key: 'intrede_eretafel_nummer', label: 'Intrede eretafel' },
        { key: 'intrede_bridesmaids_nummer', label: 'Intrede bridesmaids' },
        { key: 'intrede_groomsmen_nummer', label: 'Intrede groomsmen' },
        { key: 'intrede_koppel_nummer', label: 'Intrede koppel' },
        { key: 'intrede_anders_nummer', label: 'Intrede anders' },
        { key: 'intrede_taart_nummer', label: 'Intrede taart' },
        { key: 'openingsdans_nummer', label: 'Openingsdans' },
        { key: 'tweede_dans_nummer', label: 'Tweede dans / start feest' },
        { key: 'boeket_werpen_nummer', label: 'Boeket werpen' },
      ]
    },
    {
      title: 'Extra’s & bestanden', emoji: '📎', fields: [
        { key: 'ceremonie_set', label: BOOL_LABELS.ceremonie_set, type: 'bool' },
        { key: 'digital_booth', label: BOOL_LABELS.digital_booth, type: 'bool' },
        { key: 'retro_booth', label: BOOL_LABELS.retro_booth, type: 'bool' },
        { key: 'draadloze_speaker', label: BOOL_LABELS.draadloze_speaker, type: 'bool' },
        { key: 'karaoke', label: BOOL_LABELS.karaoke, type: 'bool' },
        { key: 'zaal_fotos', label: 'Uploads', type: 'uploads' },
        { key: 'toestemming_foto', label: BOOL_LABELS.toestemming_foto, type: 'bool' },
        { key: 'opmerkingen', label: 'Opmerkingen' },
        { key: 'feedback_vragenlijst', label: 'Feedback vragenlijst' },
        { key: 'feedback_herkomst', label: 'Hoe gevonden' },
      ]
    },
  ]
}

function FieldValue({ booking, field, changed }: { booking: Booking; field: Field; changed?: { oud: unknown; nieuw: unknown } }) {
  const current = formatValue(booking, field)
  if (!current && !changed) return null
  return (
    <div className={`rounded-xl border p-3 ${changed ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-start justify-between gap-3">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{field.label}</dt>
        {changed && <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">Gewijzigd</span>}
      </div>
      {changed && (
        <div className="mt-2 mb-2 rounded-lg bg-white/80 border border-amber-100 p-2 space-y-1">
          <div className="grid grid-cols-[42px_1fr] gap-2 text-xs">
            <span className="font-semibold text-red-400">Oud</span>
            <span className="text-red-600 line-through whitespace-pre-wrap break-words">{formatValue(booking, field, changed.oud) || '—'}</span>
          </div>
          <div className="grid grid-cols-[42px_1fr] gap-2 text-xs">
            <span className="font-semibold text-green-500">Nieuw</span>
            <span className="text-green-700 font-semibold whitespace-pre-wrap break-words">{formatValue(booking, field, changed.nieuw) || '—'}</span>
          </div>
        </div>
      )}
      <dd className="text-sm text-gray-900 whitespace-pre-wrap break-words leading-relaxed">{current || '—'}</dd>
    </div>
  )
}

function formatUpdatedAt(value?: string) {
  if (!value) return null
  try { return new Date(value).toLocaleString('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }) } catch { return value }
}

function AccordionSection({ title, emoji, count, changedCount, children }: { title: string; emoji: string; count: number; changedCount: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] overflow-hidden">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors" aria-expanded={open}>
        <span className="text-lg flex-shrink-0">{emoji}</span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-gray-600 uppercase tracking-wider">{title}</span>
          <span className="block text-xs text-gray-400 mt-0.5">{count} veld{count === 1 ? '' : 'en'}{changedCount > 0 ? ` · ${changedCount} gewijzigd` : ''}</span>
        </span>
        <span className="text-gray-400 flex-shrink-0">{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4"><dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</dl></div>}
    </section>
  )
}

export function QuestionnaireTab({ booking, onShowChanges }: { booking: Booking; onShowChanges: () => void }) {
  const portalPath = `/event/${booking.slug || booking.id}?section=vragenlijst`
  const directFormPath = booking.slug ? `/vragenlijst/${booking.slug}?direct=1` : `/formulier/${booking.id}?direct=1`
  const diff = parseDiff(booking.vragenlijst_diff)
  const diffCount = Object.keys(diff).length
  const updatedAt = formatUpdatedAt(booking.vragenlijst_updated_at)
  const copy = () => {
    const url = `${window.location.origin}${portalPath}`
    navigator.clipboard.writeText(url)
    alert(`Klantpagina-link gekopieerd!\n\nDe vragenlijst-sectie opent automatisch.\n\n${url}`)
  }

  const sections = sectionsFor(booking).map(section => ({
    ...section,
    fields: section.fields.filter(field => {
      const value = formatValue(booking, field)
      return !!value || !!diff[String(field.key)]
    })
  })).filter(section => section.fields.length > 0)

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.04)] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900 flex items-center gap-2"><ClipboardList size={18} className="text-[#007AFF]" /> Vragenlijst</h2>
            <p className="text-xs text-gray-400 mt-0.5">Volledige interne weergave per sectie. Je hoeft de klantenpagina niet te openen om de inhoud te controleren.</p>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${booking.status_vragenlijst ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
            {booking.status_vragenlijst ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {booking.status_vragenlijst ? 'Ingevuld' : 'Nog niet ingevuld'}
          </div>
        </div>

        {updatedAt && <p className="text-xs text-gray-500">Laatste indiening/aanpassing: <span className="font-semibold text-gray-700">{updatedAt}</span></p>}

        {diffCount > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">{diffCount} wijziging{diffCount === 1 ? '' : 'en'} sinds de vorige versie</p>
                <p className="text-xs text-amber-700 mt-1">Gewijzigde velden zijn hieronder geel gemarkeerd met oud → nieuw.</p>
              </div>
              <button onClick={onShowChanges} className="hidden sm:inline-flex text-xs font-semibold text-amber-800 bg-white/70 hover:bg-white border border-amber-200 px-3 py-1.5 rounded-lg">
                Pop-up overzicht
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.keys(diff).slice(0, 12).map(key => (
                <span key={key} className="text-[11px] font-semibold bg-white border border-amber-200 text-amber-800 px-2 py-1 rounded-full">{FIELD_LABELS[key] || key}</span>
              ))}
              {diffCount > 12 && <span className="text-[11px] font-semibold text-amber-700 px-2 py-1">+{diffCount - 12} meer</span>}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <a href={directFormPath} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-[#007AFF] hover:bg-[#0066CC] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Pencil size={15} /> Vragenlijst direct openen/aanpassen
          </a>
          <a href={portalPath} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <ExternalLink size={15} /> Klantpagina
          </a>
          <button onClick={copy} className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Copy size={15} /> Kopieer link
          </button>
        </div>
      </div>

      {!booking.status_vragenlijst && (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-bold text-gray-900">Nog geen ingevulde vragenlijst</p>
          <p className="text-sm text-gray-500 mt-1">Zodra de klant de vragenlijst indient, verschijnt hier automatisch de volledige inhoud per sectie.</p>
        </div>
      )}

      {booking.status_vragenlijst && sections.map(section => {
        const changedCount = section.fields.filter(field => !!diff[String(field.key)]).length
        return (
          <AccordionSection key={section.title} title={section.title} emoji={section.emoji} count={section.fields.length} changedCount={changedCount}>
            {section.fields.map(field => <FieldValue key={String(field.key)} booking={booking} field={field} changed={diff[String(field.key)]} />)}
          </AccordionSection>
        )
      })}

      {(booking.feedback_vragenlijst || booking.feedback_herkomst) && (
        <AccordionSection title="Feedback klant" emoji="💬" count={[booking.feedback_vragenlijst, booking.feedback_herkomst].filter(Boolean).length} changedCount={0}>
          {booking.feedback_vragenlijst && (
            <div className="rounded-xl border bg-blue-50 border-blue-200 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-blue-500">Hoe vond de klant de vragenlijst?</dt>
              <dd className="text-sm font-semibold text-blue-800 mt-1">{booking.feedback_vragenlijst}</dd>
            </div>
          )}
          {booking.feedback_herkomst && (
            <div className="rounded-xl border bg-purple-50 border-purple-200 p-3">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-purple-500">Hoe gevonden?</dt>
              <dd className="text-sm font-semibold text-purple-800 mt-1">{booking.feedback_herkomst}</dd>
            </div>
          )}
        </AccordionSection>
      )}
    </div>
  )
}
