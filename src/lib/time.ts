/**
 * Demo clock. The story is fixed to Monday 25 May 2026, starting at 2:30 PM.
 * Minutes advance with real elapsed time so logged times feel natural.
 */
export const TODAY = '2026-05-25'
const START_MINUTES = 14 * 60 + 30
const loadedAt = Date.now()

export function nowMinutes(): number {
  const elapsed = Math.floor((Date.now() - loadedAt) / 60000)
  return Math.min(START_MINUTES + elapsed, 23 * 60 + 59)
}

export function nowHHMM(): string {
  return minutesToHHMM(nowMinutes())
}

export function minutesToHHMM(m: number): string {
  const h = Math.floor(m / 60) % 24
  const min = m % 60
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

export function hhmmToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** "20:00" → "8:00 PM" */
export function fmtTime(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

/** "20:00" → "8 PM" when on the hour */
export function fmtTimeShort(t: string): string {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${h12} ${suffix}` : `${h12}:${String(m).padStart(2, '0')} ${suffix}`
}

export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(iso: string, n: number): string {
  const d = parseDate(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function weekday(iso: string, short = false): string {
  const w = WEEKDAYS[parseDate(iso).getDay()]
  return short ? w.slice(0, 3) : w
}

/** "Wednesday, 27 May" / short: "Wed, 27 May" */
export function fmtDate(iso: string, opts: { short?: boolean; year?: boolean } = {}): string {
  const d = parseDate(iso)
  const month = opts.short ? MONTHS[d.getMonth()].slice(0, 3) : MONTHS[d.getMonth()]
  return `${weekday(iso, opts.short)}, ${d.getDate()} ${month}${opts.year ? ` ${d.getFullYear()}` : ''}`
}

export function dayOfMonth(iso: string): number {
  return parseDate(iso).getDate()
}

/** "Today", "Tomorrow", "Yesterday" or "Wed, 27 May" */
export function relativeDay(iso: string): string {
  if (iso === TODAY) return 'Today'
  if (iso === addDays(TODAY, 1)) return 'Tomorrow'
  if (iso === addDays(TODAY, -1)) return 'Yesterday'
  return fmtDate(iso, { short: true })
}

export function daysFromToday(iso: string): number {
  return Math.round((parseDate(iso).getTime() - parseDate(TODAY).getTime()) / 86400000)
}

export function greeting(): string {
  const m = nowMinutes()
  if (m < 12 * 60) return 'Good morning'
  if (m < 18 * 60) return 'Good afternoon'
  return 'Good evening'
}

/** Parse a spoken or typed time ("8 PM", "8pm", "20:00", "eight PM", "8 in the evening"). */
export function parseTime(input: string): string | null {
  const text = input.toLowerCase().replace(/\./g, '')
  const words: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  }
  let hour: number | null = null
  let minute = 0
  const num = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/)
  if (num) {
    hour = Number(num[1])
    minute = num[2] ? Number(num[2]) : 0
  } else {
    const w = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b(?:\s+(thirty|fifteen|forty[- ]five))?/)
    if (w) {
      hour = words[w[1]]
      if (w[2] === 'thirty') minute = 30
      else if (w[2] === 'fifteen') minute = 15
      else if (w[2]) minute = 45
    }
  }
  if (text.includes('noon') && hour === null) return '12:00'
  if (hour === null || hour > 23 || minute > 59) return null
  const pm = /\bpm\b|evening|night|tonight/.test(text)
  const am = /\bam\b|morning/.test(text)
  if (hour <= 12) {
    if (pm && hour < 12) hour += 12
    else if (am && hour === 12) hour = 0
    else if (!pm && !am && hour >= 1 && hour <= 6) hour += 12
  }
  return minutesToHHMM(hour * 60 + minute)
}
