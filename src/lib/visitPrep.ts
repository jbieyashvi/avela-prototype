/**
 * Visit preparation. Summarises only what Eva wrote herself — counts, ranges and her own
 * words. It never interprets entries as symptoms, risks or diagnoses.
 */
import { moodLabel } from '../data/seed'
import { upcomingAppointment } from '../state/store'
import type { AppState } from '../state/types'
import { dayOfMonth, fmtDate, fmtTime, parseDate } from './time'

const TOPIC_RULES: { test: RegExp; topic: string }[] = [
  { test: /tired|energy|exhaust/i, topic: 'Feeling tired in the afternoons' },
  { test: /slept|sleep/i, topic: 'Sleep' },
  { test: /headache/i, topic: 'Headaches I noted' },
  { test: /walk|exercise/i, topic: 'Staying active' },
]

export const STANDARD_TOPICS = ['Medication A routine', 'Blood test timing', 'Prescription refills']

export function entriesSinceLastVisit(state: AppState) {
  const last = state.appointments.filter((a) => a.status === 'completed').sort((a, b) => b.date.localeCompare(a.date))[0]
  return state.journal.filter((j) => !last || j.date > last.date).sort((a, b) => a.date.localeCompare(b.date))
}

export function visitSummary(state: AppState) {
  const entries = entriesSinceLastVisit(state)
  if (!entries.length) {
    return { summary: 'You haven’t added any journal entries since your last visit yet.', topics: STANDARD_TOPICS, count: 0 }
  }
  const first = entries[0]
  const last = entries[entries.length - 1]
  const moods = entries.map((e) => e.mood)
  const energies = entries.map((e) => e.energy)
  const mostCommon = moodLabel(
    [...moods].sort((a, b) => moods.filter((m) => m === b).length - moods.filter((m) => m === a).length)[0],
  )
  const tiredDays = entries.filter((e) => /tired/i.test(e.note)).length
  const range =
    first.date === last.date
      ? `on ${fmtDate(first.date, { short: true })}`
      : `between ${dayOfMonth(first.date)} and ${dayOfMonth(last.date)} ${parseDate(last.date).toLocaleString('en-GB', { month: 'long' })}`
  const parts = [
    `You logged ${entries.length} check-in${entries.length === 1 ? '' : 's'} ${range}.`,
    `Your mood ranged from ${moodLabel(Math.min(...moods))} to ${moodLabel(Math.max(...moods))}, most often ${mostCommon}.`,
    `Energy was ${Math.min(...energies)}–${Math.max(...energies)} out of 5.`,
  ]
  if (tiredDays) parts.push(`You mentioned feeling tired on ${tiredDays} day${tiredDays === 1 ? '' : 's'}.`)
  const noted = TOPIC_RULES.filter((r) => entries.some((e) => r.test.test(e.note))).map((r) => r.topic)
  return { summary: parts.join(' '), topics: [...noted, ...STANDARD_TOPICS], count: entries.length }
}

export function buildDraft(state: AppState, topics: string[], questions: string[]) {
  const appt = upcomingAppointment(state)
  const { summary } = visitSummary(state)
  const lines = [
    `Visit notes${appt ? ` — ${fmtDate(appt.date)}, ${fmtTime(appt.time)}` : ''}`,
    '',
    'From my journal:',
    summary,
    '',
    'Things I’d like to discuss:',
    ...(topics.length ? topics.map((t) => `• ${t}`) : ['• (none selected)']),
    '',
    'My questions:',
    ...(questions.length ? questions.map((q, i) => `${i + 1}. ${q}`) : ['(none yet)']),
  ]
  return lines.join('\n')
}
