import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AVAILABILITY, CONTESTED_SLOT, DOCTOR_ID, STATE_VERSION, seedState, slotKey } from '../data/seed'
import { TODAY, addDays, hhmmToMinutes, minutesToHHMM, nowHHMM, nowMinutes } from '../lib/time'
import type { AppState, Appointment, CareMember, ChatCard, ChatMessage, JournalEntry, MedLog, SlotRef, Task, VisitPrep, VisitType } from './types'

const STORAGE_KEY = 'avela-demo-state'

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AppState
      if (parsed.version === STATE_VERSION) return parsed
    }
  } catch {
    /* storage unavailable — fall back to seed */
  }
  return seedState()
}

let idCounter = 0
export const uid = (p = 'id') => `${p}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`

export interface Toast {
  id: string
  message: string
  tone?: 'default' | 'success'
  action?: { label: string; onClick: () => void }
}

export type BookResult = { ok: true; appointment: Appointment; replaced?: Appointment } | { ok: false; reason: 'unavailable' }

function useStoreValue() {
  const [state, setState] = useState<AppState>(load)
  const [toast, setToast] = useState<Toast | null>(null)
  const [reminderBanner, setReminderBanner] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore quota / private mode */
    }
  }, [state])

  const showToast = useCallback((t: Omit<Toast, 'id'>) => {
    window.clearTimeout(toastTimer.current)
    setToast({ ...t, id: uid('toast') })
    toastTimer.current = window.setTimeout(() => setToast(null), t.action ? 6000 : 3200)
  }, [])
  const dismissToast = useCallback(() => setToast(null), [])

  const actions = useMemo(
    () => ({
      // Tasks
      addTask(title: string, due?: string): Task {
        const task: Task = { id: uid('task'), title: title.trim(), done: false, due }
        setState((s) => ({ ...s, tasks: [...s.tasks, task] }))
        return task
      },
      setTaskDone(id: string, done: boolean) {
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, done, doneAt: done ? nowHHMM() : undefined } : t)),
        }))
      },

      // Medication reminders
      setReminder(medId: string, time: string) {
        setState((s) => {
          const existing = s.reminders.find((r) => r.medId === medId)
          const reminders = existing
            ? s.reminders.map((r) => (r.medId === medId ? { ...r, time } : r))
            : [...s.reminders, { id: uid('rem'), medId, time, repeat: 'daily' as const }]
          return { ...s, reminders, snoozes: s.snoozes.filter((z) => z.medId !== medId) }
        })
      },
      removeReminder(medId: string) {
        setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.medId !== medId), snoozes: s.snoozes.filter((z) => z.medId !== medId) }))
      },
      logTaken(medId: string): MedLog {
        const log: MedLog = { id: uid('log'), medId, date: TODAY, at: nowHHMM(), kind: 'taken' }
        setState((s) => ({ ...s, logs: [log, ...s.logs], snoozes: s.snoozes.filter((z) => !(z.medId === medId && z.date === TODAY)) }))
        return log
      },
      undoLog(logId: string) {
        setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== logId) }))
      },
      snooze(medId: string, minutes: number) {
        const until = minutesToHHMM(Math.min(nowMinutes() + minutes, 23 * 60 + 59))
        const log: MedLog = { id: uid('log'), medId, date: TODAY, at: nowHHMM(), kind: 'snoozed', minutes }
        setState((s) => ({
          ...s,
          logs: [log, ...s.logs],
          snoozes: [...s.snoozes.filter((z) => !(z.medId === medId && z.date === TODAY)), { medId, date: TODAY, until }],
        }))
        return until
      },

      // Appointments
      book(slot: SlotRef, visitType: VisitType, reason: string): BookResult {
        const s = stateRef.current
        const key = slotKey(slot)
        if (s.takenSlots.includes(key)) return { ok: false, reason: 'unavailable' }
        if (key === slotKey(CONTESTED_SLOT)) {
          const next = { ...s, takenSlots: [...s.takenSlots, key] }
          stateRef.current = next
          setState(next)
          return { ok: false, reason: 'unavailable' }
        }
        const current = s.appointments.find((a) => a.status === 'upcoming' && a.doctorId === DOCTOR_ID)
        const appointment: Appointment = {
          id: current?.id ?? uid('appt'),
          doctorId: DOCTOR_ID,
          date: slot.date,
          time: slot.time,
          visitType,
          kind: 'Follow-up visit',
          reason,
          status: 'upcoming',
        }
        const changed = current && (current.date !== slot.date || current.time !== slot.time || current.visitType !== visitType)
        const appointments = current ? s.appointments.map((a) => (a.id === current.id ? appointment : a)) : [...s.appointments, appointment]
        const next = { ...s, appointments }
        stateRef.current = next
        setState(next)
        return { ok: true, appointment, replaced: changed ? current : undefined }
      },

      // Care team
      addCareMember(m: Omit<CareMember, 'id' | 'initials' | 'tone' | 'addedByUser'>) {
        const initials = m.name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
        setState((s) => ({ ...s, careTeam: [...s.careTeam, { ...m, id: uid('care'), initials, tone: 'violet', addedByUser: true }] }))
      },

      // Journal
      saveCheckIn(entry: Omit<JournalEntry, 'id' | 'date' | 'time'>, replaceId?: string) {
        setState((s) => {
          if (replaceId) return { ...s, journal: s.journal.map((j) => (j.id === replaceId ? { ...j, ...entry } : j)) }
          const full: JournalEntry = { ...entry, id: uid('j'), date: TODAY, time: nowHHMM() }
          return { ...s, journal: [full, ...s.journal] }
        })
      },
      deleteEntry(id: string) {
        setState((s) => ({ ...s, journal: s.journal.filter((j) => j.id !== id) }))
      },
      updateVisitPrep(patch: Partial<VisitPrep>) {
        setState((s) => ({ ...s, visitPrep: { ...s.visitPrep, ...patch } }))
      },
      addQuestion(q: string) {
        setState((s) => ({ ...s, visitPrep: { ...s.visitPrep, questions: [...s.visitPrep.questions, q] } }))
      },

      // Notifications & settings
      markNotificationsRead() {
        setState((s) => ({ ...s, notifications: s.notifications.map((n) => ({ ...n, read: true })) }))
      },
      updateSettings(patch: Partial<AppState['settings']>) {
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
      },

      // Assistant conversation
      appendChat(...msgs: ChatMessage[]) {
        setState((s) => ({ ...s, chat: [...s.chat, ...msgs] }))
      },
      updateCard(msgId: string, card: ChatCard) {
        setState((s) => ({ ...s, chat: s.chat.map((m) => (m.id === msgId ? { ...m, card } : m)) }))
      },
      clearChat() {
        setState((s) => ({ ...s, chat: [] }))
      },

      reset() {
        try {
          localStorage.removeItem(STORAGE_KEY)
        } catch {
          /* ignore */
        }
        setState(seedState())
      },
    }),
    [],
  )

  return { state, actions, toast, showToast, dismissToast, reminderBanner, setReminderBanner }
}

type Store = ReturnType<typeof useStoreValue>
const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}

/* ── Selectors ─────────────────────────────────────────────── */

export function upcomingAppointment(s: AppState) {
  return s.appointments.find((a) => a.status === 'upcoming')
}

export function doctorById(s: AppState, id: string) {
  return s.doctors.find((d) => d.id === id)!
}

export type DoseStatus =
  | { kind: 'no-reminder' }
  | { kind: 'upcoming'; time: string }
  | { kind: 'due'; time: string }
  | { kind: 'snoozed'; until: string; time: string }
  | { kind: 'taken'; at: string; logId: string; time?: string }

/** Today's status for a medication. A missing log is never treated as a missed dose. */
export function doseStatus(s: AppState, medId: string, date = TODAY): DoseStatus {
  const reminder = s.reminders.find((r) => r.medId === medId)
  const taken = s.logs.find((l) => l.medId === medId && l.date === date && l.kind === 'taken')
  if (taken) return { kind: 'taken', at: taken.at, logId: taken.id, time: reminder?.time }
  if (!reminder) return { kind: 'no-reminder' }
  const snooze = s.snoozes.find((z) => z.medId === medId && z.date === date)
  if (snooze && date === TODAY) return { kind: 'snoozed', until: snooze.until, time: reminder.time }
  if (date === TODAY && hhmmToMinutes(reminder.time) <= nowMinutes()) return { kind: 'due', time: reminder.time }
  return { kind: 'upcoming', time: reminder.time }
}

export function availableSlots(s: AppState, date: string) {
  return (AVAILABILITY[date] ?? []).filter((t) => !s.takenSlots.includes(`${date}|${t}`))
}

export function availableDates() {
  return Object.keys(AVAILABILITY).sort()
}

export function openTasks(s: AppState) {
  return s.tasks.filter((t) => !t.done)
}

export function todaysEntry(s: AppState) {
  return s.journal.find((j) => j.date === TODAY)
}

export { TODAY, addDays }
