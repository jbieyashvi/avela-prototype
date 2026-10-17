export type MoodLevel = 1 | 2 | 3 | 4 | 5
export type VisitType = 'in-person' | 'video'

export interface Profile {
  firstName: string
  lastName: string
  age: number
  initials: string
}

export interface Task {
  id: string
  title: string
  done: boolean
  due?: string // ISO date
  doneAt?: string
  link?: 'visit-prep' | 'booking'
}

export interface Medication {
  id: string
  name: string
  instruction: string // read-only, from care plan
  prescribedBy: string
  form: string
}

export interface Reminder {
  id: string
  medId: string
  time: string // HH:MM
  repeat: 'daily'
}

export interface MedLog {
  id: string
  medId: string
  date: string
  at: string // HH:MM
  kind: 'taken' | 'snoozed'
  minutes?: number
}

export interface Snooze {
  medId: string
  date: string
  until: string
}

export interface Doctor {
  id: string
  name: string
  speciality: string
  clinic: string
  address: string
  context: string
}

export interface Appointment {
  id: string
  doctorId: string
  date: string
  time: string
  visitType: VisitType
  kind: string
  reason: string
  status: 'upcoming' | 'completed'
}

export interface CareMember {
  id: string
  name: string
  role: string
  detail: string
  initials: string
  tone: 'brand' | 'violet' | 'coral' | 'green'
  addedByUser?: boolean
}

export interface JournalEntry {
  id: string
  date: string
  time: string
  mood: MoodLevel
  energy: MoodLevel
  note: string
}

export interface VisitPrep {
  topics: string[]
  questions: string[]
  draft: string
  savedAt?: string
  sharedAt?: string
  sharedWith?: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  when: string
  read: boolean
  to?: string
}

export type CardStatus = 'pending' | 'confirmed' | 'cancelled'

export type ChatCard =
  | { type: 'reminder-review'; medId: string; time: string; replacing?: string; status: CardStatus }
  | { type: 'reminder-existing'; medId: string; time: string }
  | { type: 'appointment-current'; apptId: string; status: 'pending' | 'kept' | 'changing' }
  | { type: 'slot-picker'; options: SlotRef[]; status: 'pending' | 'chosen' }
  | { type: 'appointment-review'; slot: SlotRef; visitType: VisitType; replacing?: SlotRef; status: CardStatus | 'unavailable' }
  | { type: 'task-review'; title: string; due?: string; status: CardStatus }
  | { type: 'task-duplicate'; taskId: string; title: string; candidate: string; status: 'pending' | 'resolved' }
  | { type: 'visit-summary' }
  | { type: 'question-add'; question: string; status: CardStatus }
  | { type: 'suggestions'; options: string[] }

export interface SlotRef {
  date: string
  time: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  card?: ChatCard
}

export interface AppState {
  version: number
  profile: Profile
  tasks: Task[]
  medications: Medication[]
  reminders: Reminder[]
  logs: MedLog[]
  snoozes: Snooze[]
  doctors: Doctor[]
  appointments: Appointment[]
  careTeam: CareMember[]
  journal: JournalEntry[]
  visitPrep: VisitPrep
  notifications: AppNotification[]
  chat: ChatMessage[]
  takenSlots: string[] // "date|time" no longer available
  settings: { readAloud: boolean; simulatedNotifications: boolean }
}
