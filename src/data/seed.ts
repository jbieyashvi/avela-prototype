import type { AppState, MoodLevel, SlotRef } from '../state/types'

export const STATE_VERSION = 3

export const DOCTOR_ID = 'dr-morgan'

export function seedState(): AppState {
  return {
    version: STATE_VERSION,
    profile: { firstName: 'Eva', lastName: 'Smith', age: 32, initials: 'ES' },
    tasks: [
      { id: 't1', title: 'Prepare questions for the follow-up', done: false, due: '2026-05-27', link: 'visit-prep' },
      { id: 't2', title: 'Collect prescription from Riverside Pharmacy', done: false, due: '2026-05-26' },
      { id: 't3', title: 'Schedule a blood test', done: false },
    ],
    medications: [
      {
        id: 'med-a',
        name: 'Medication A',
        instruction: 'One tablet daily',
        prescribedBy: 'Dr Erica Morgan',
        form: 'Tablet',
      },
    ],
    reminders: [],
    logs: [
      { id: 'l1', medId: 'med-a', date: '2026-05-24', at: '21:12', kind: 'taken' },
      { id: 'l2', medId: 'med-a', date: '2026-05-23', at: '20:47', kind: 'taken' },
      { id: 'l3', medId: 'med-a', date: '2026-05-21', at: '21:30', kind: 'taken' },
    ],
    snoozes: [],
    doctors: [
      {
        id: DOCTOR_ID,
        name: 'Dr Erica Morgan',
        speciality: 'General practitioner',
        clinic: 'Riverside Health Clinic',
        address: '14 Elm Row, Room 204',
        context: 'Your primary clinician · manages your care plan',
      },
    ],
    appointments: [
      {
        id: 'a-follow',
        doctorId: DOCTOR_ID,
        date: '2026-05-27',
        time: '14:00',
        visitType: 'in-person',
        kind: 'Follow-up visit',
        reason: 'Review how the care plan is going',
        status: 'upcoming',
      },
      {
        id: 'a-past',
        doctorId: DOCTOR_ID,
        date: '2026-05-06',
        time: '10:30',
        visitType: 'in-person',
        kind: 'Care plan visit',
        reason: 'Started Medication A',
        status: 'completed',
      },
    ],
    careTeam: [
      { id: 'c1', name: 'Dr Erica Morgan', role: 'General practitioner', detail: 'Riverside Health Clinic', initials: 'EM', tone: 'brand' },
      { id: 'c2', name: 'Riverside Pharmacy', role: 'Pharmacy', detail: 'Prescription pickup', initials: 'RP', tone: 'green' },
      { id: 'c3', name: 'Maya Smith', role: 'Sister · support contact', detail: 'Added by you', initials: 'MS', tone: 'coral' },
    ],
    journal: [
      { id: 'j1', date: '2026-05-24', time: '21:30', mood: 3, energy: 2, note: 'Felt tired after lunch again. Slept about six hours.' },
      { id: 'j2', date: '2026-05-22', time: '20:10', mood: 4, energy: 3, note: 'Walked for 30 minutes. Remembered Medication A with dinner.' },
      { id: 'j3', date: '2026-05-20', time: '22:05', mood: 2, energy: 2, note: 'Headache in the afternoon, eased after resting. Tired by evening.' },
      { id: 'j4', date: '2026-05-18', time: '19:45', mood: 4, energy: 4, note: 'Good day at work. Slept well.' },
    ],
    visitPrep: {
      topics: [],
      questions: ['Is there a best time of day to take Medication A?', 'When should I have the blood test done?'],
      draft: '',
    },
    notifications: [
      { id: 'n1', title: 'Follow-up on Wednesday', body: 'Dr Erica Morgan · Wed 27 May, 2:00 PM', when: 'Today, 9:00 AM', read: false, to: '/care/appointment' },
      { id: 'n2', title: 'Prescription ready', body: 'Riverside Pharmacy says your prescription is ready to collect.', when: 'Yesterday', read: false },
    ],
    chat: [],
    takenSlots: [],
    settings: { readAloud: false, simulatedNotifications: true },
  }
}

export const MOODS: { value: MoodLevel; label: string; emoji: string }[] = [
  { value: 1, label: 'Rough', emoji: '😣' },
  { value: 2, label: 'Low', emoji: '😕' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Good', emoji: '🙂' },
  { value: 5, label: 'Great', emoji: '😄' },
]

export const ENERGY_LABELS = ['Very low', 'Low', 'Steady', 'Good', 'High']

export function moodLabel(v: number) {
  return MOODS.find((m) => m.value === v)?.label ?? ''
}

/** Fictional availability for Dr Erica Morgan. */
export const AVAILABILITY: Record<string, string[]> = {
  '2026-05-26': ['16:30'],
  '2026-05-27': ['09:30', '14:00', '15:30'],
  '2026-05-28': ['09:00', '10:30', '13:15'],
  '2026-05-29': ['11:00', '16:00'],
  '2026-06-01': ['10:00', '14:30'],
}

/**
 * This slot is "taken by someone else" the first time Eva tries to confirm it,
 * to demonstrate the slot-unavailable recovery path.
 */
export const CONTESTED_SLOT: SlotRef = { date: '2026-05-28', time: '10:30' }

export const slotKey = (s: SlotRef) => `${s.date}|${s.time}`

export const APPOINTMENT_TYPES = [
  { id: 'in-person' as const, title: 'In-person follow-up', body: 'At Riverside Health Clinic · 20 min' },
  { id: 'video' as const, title: 'Video follow-up', body: 'Join from your phone · 15 min' },
]

export const REASONS = [
  'Review how the care plan is going',
  'Talk about Medication A',
  'Discuss blood test',
  'Something else',
]
