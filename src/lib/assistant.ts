/**
 * Deterministic local assistant. No model is called: messages are matched to a small
 * set of supported care actions, and every action is proposed as a review card that
 * the user must confirm before app state changes.
 */
import { availableDates, availableSlots, doctorById, uid, upcomingAppointment } from '../state/store'
import type { AppState, ChatMessage, SlotRef } from '../state/types'
import { fmtDate, fmtTime, parseTime } from './time'

export interface EngineContext {
  awaiting?: 'reminder-time' | 'task-title'
}

export const SUGGESTED_PROMPTS = [
  'Remind me to take Medication A at 8 PM.',
  'Book my follow-up appointment.',
  'Add a blood test to my tasks.',
  'Help me prepare for my next visit.',
]

const say = (text: string, card?: ChatMessage['card']): ChatMessage => ({ id: uid('m'), role: 'assistant', text, card })

const STOP = new Set(['a', 'an', 'the', 'my', 'to', 'for', 'of', 'and', 'add', 'task', 'tasks', 'list', 'please', 'book', 'schedule', 'get', 'do', 'from'])
const keywords = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w))

export function findSimilarTask(state: AppState, title: string) {
  const k = keywords(title)
  if (!k.length) return undefined
  return state.tasks.find((t) => {
    const tk = keywords(t.title)
    const overlap = k.filter((w) => tk.includes(w)).length
    return overlap >= Math.min(2, k.length)
  })
}

export function extractTaskTitle(text: string): string {
  let t = text.trim().replace(/[.!?]+$/, '')
  t = t.replace(/^(please\s+)?(can you\s+)?(add|create|put|new)\s+(a\s+|an\s+)?(care\s+)?(task\s+)?(to\s+)?/i, '')
  t = t.replace(/\s+(to|on|onto)\s+(my\s+)?(care\s+)?(tasks?|list|to-?do( list)?)$/i, '')
  t = t.replace(/^(a|an)\s+/i, '')
  if (/^(care\s+)?task$/i.test(t) || !t) return ''
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function nextSlots(state: AppState, exclude?: SlotRef, limit = 4): SlotRef[] {
  const out: SlotRef[] = []
  for (const date of availableDates()) {
    for (const time of availableSlots(state, date)) {
      if (exclude && exclude.date === date && exclude.time === time) continue
      out.push({ date, time })
    }
  }
  return out.slice(0, limit)
}

function reminderReply(state: AppState, text: string): { replies: ChatMessage[]; ctx: EngineContext } {
  const med = state.medications[0]
  const time = parseTime(text.replace(/medication\s+[a-z]\b/i, ''))
  const existing = state.reminders.find((r) => r.medId === med.id)
  if (!time) {
    if (existing) {
      return {
        replies: [say(`${med.name} already has a daily reminder at ${fmtTime(existing.time)}. Want to keep it or change the time?`, { type: 'reminder-existing', medId: med.id, time: existing.time })],
        ctx: {},
      }
    }
    return {
      replies: [
        say(`Sure. ${med.name} is in your care plan as ${med.instruction.toLowerCase()}. What time would you like the reminder?`, {
          type: 'suggestions',
          options: ['8 PM', '9 PM', '8 AM'],
        }),
      ],
      ctx: { awaiting: 'reminder-time' },
    }
  }
  if (existing && existing.time === time) {
    return {
      replies: [say(`You already have a daily ${fmtTime(existing.time)} reminder for ${med.name}, so I won’t add another.`, { type: 'reminder-existing', medId: med.id, time: existing.time })],
      ctx: {},
    }
  }
  return {
    replies: [
      say(existing ? `${med.name} is currently reminded at ${fmtTime(existing.time)}. Here’s the change:` : 'Here’s the reminder. Nothing is set until you confirm.', {
        type: 'reminder-review',
        medId: med.id,
        time,
        replacing: existing?.time,
        status: 'pending',
      }),
    ],
    ctx: {},
  }
}

function bookingReply(state: AppState): ChatMessage[] {
  const current = upcomingAppointment(state)
  if (current) {
    const doc = doctorById(state, current.doctorId)
    return [
      say(`Your follow-up with ${doc.name} is already booked for ${fmtDate(current.date)} at ${fmtTime(current.time)}. Keep it, or choose another time?`, {
        type: 'appointment-current',
        apptId: current.id,
        status: 'pending',
      }),
    ]
  }
  return [say('Here are the next available times with Dr Erica Morgan:', { type: 'slot-picker', options: nextSlots(state), status: 'pending' })]
}

function taskReply(state: AppState, title: string): ChatMessage[] {
  const similar = findSimilarTask(state, title)
  if (similar) {
    return [
      say(similar.done ? `“${similar.title}” is on your list and marked done.` : `“${similar.title}” is already on your list.`, {
        type: 'task-duplicate',
        taskId: similar.id,
        title: similar.title,
        candidate: title,
        status: 'pending',
      }),
    ]
  }
  const appt = upcomingAppointment(state)
  return [say('Add this to your care tasks?', { type: 'task-review', title, due: appt && /blood|test|question|prescription/i.test(title) ? appt.date : undefined, status: 'pending' })]
}

const MEDICAL_ADVICE = /\b(dose|dosage|double|extra (tablet|dose|pill)|skip(ped)?|stop taking|side[- ]effects?|should i (take|stop|be worried)|is it (normal|safe|serious)|diagnos|what('?s| is) wrong|symptom|chest pain|interact)/i

export function respond(text: string, state: AppState, ctx: EngineContext): { replies: ChatMessage[]; ctx: EngineContext } {
  const t = text.toLowerCase()

  if (MEDICAL_ADVICE.test(t)) {
    const appt = upcomingAppointment(state)
    const q = text.trim().replace(/[.!]+$/, '')
    return {
      replies: [
        say(
          `I can’t give medical advice or suggest medication changes. Your clinician is the right person for this${appt ? ` — your follow-up is ${fmtDate(appt.date)}` : ''}. If it feels urgent, contact your clinic or local emergency services.`,
          { type: 'question-add', question: q.endsWith('?') ? q : `${q}?`, status: 'pending' },
        ),
      ],
      ctx: {},
    }
  }

  if (ctx.awaiting === 'reminder-time') {
    const time = parseTime(text)
    if (time) return reminderReply(state, `remind me at ${text}`)
    if (!/cancel|never ?mind|stop/.test(t)) {
      return { replies: [say('Sorry, I didn’t catch a time. Try something like “8 PM”.', { type: 'suggestions', options: ['8 PM', '9 PM', 'Cancel'] })], ctx }
    }
    return { replies: [say('No problem — nothing was changed.')], ctx: {} }
  }

  if (ctx.awaiting === 'task-title') {
    if (/^(cancel|never ?mind|stop)/.test(t)) return { replies: [say('Okay — no task added.')], ctx: {} }
    const title = extractTaskTitle(text) || text.trim()
    return { replies: taskReply(state, title.charAt(0).toUpperCase() + title.slice(1)), ctx: {} }
  }

  if (/remind|reminder/.test(t) || (/medication|meds?\b|tablet|pill/.test(t) && /\d|evening|morning|night|time/.test(t))) {
    return reminderReply(state, text)
  }

  if (/prepar|next visit|questions? for|summari[sz]e my|visit notes/.test(t)) {
    return { replies: [say('Here’s a starting point based on your journal entries. You can review and edit everything before saving.', { type: 'visit-summary' })], ctx: {} }
  }

  if (/\btasks?\b|to-?do|\blist\b/.test(t) || /^add\b/.test(t)) {
    const title = extractTaskTitle(text)
    if (!title) return { replies: [say('What’s the task? For example, “Collect prescription on Tuesday”.')], ctx: { awaiting: 'task-title' } }
    return { replies: taskReply(state, title), ctx: {} }
  }

  if (/book|appointment|follow[- ]?up|reschedul|see (dr|the doctor)|doctor/.test(t)) {
    return { replies: bookingReply(state), ctx: {} }
  }

  if (/^(hi|hello|hey|thanks|thank you|good (morning|afternoon|evening))\b/.test(t)) {
    return { replies: [say('Hi Eva! Here’s what I can help with:', { type: 'suggestions', options: SUGGESTED_PROMPTS })], ctx: {} }
  }

  return {
    replies: [
      say('I can’t help with that one. In this prototype I only handle a few care actions — reminders, appointments, tasks and visit prep. Try one of these:', {
        type: 'suggestions',
        options: SUGGESTED_PROMPTS,
      }),
    ],
    ctx: {},
  }
}

export { say }
