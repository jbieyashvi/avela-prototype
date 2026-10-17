import { useEffect, useState } from 'react'
import { BellRing, Lock, Trash2 } from 'lucide-react'
import { Sheet } from './Sheet'
import { Button } from './Button'
import { ChoiceCard, TextArea, TextField } from './Form'
import { EnergyScale, MoodScale } from './Domain'
import { Notice } from './Feedback'
import { useStore, todaysEntry, upcomingAppointment } from '../state/store'
import { TODAY, addDays, fmtTime } from '../lib/time'
import type { MoodLevel } from '../state/types'

/* ── Add task ───────────────────────────────────────────────── */

export function AddTaskSheet({ open, onClose, initialTitle = '' }: { open: boolean; onClose: () => void; initialTitle?: string }) {
  const { state, actions, showToast } = useStore()
  const [title, setTitle] = useState(initialTitle)
  const [due, setDue] = useState<string | undefined>()
  const [error, setError] = useState<string>()
  const appt = upcomingAppointment(state)

  useEffect(() => {
    if (open) {
      setTitle(initialTitle)
      setDue(undefined)
      setError(undefined)
    }
  }, [open, initialTitle])

  const dueOptions = [
    { id: undefined, label: 'No date' },
    { id: TODAY, label: 'Today' },
    { id: addDays(TODAY, 1), label: 'Tomorrow' },
    ...(appt ? [{ id: addDays(appt.date, -1), label: 'Before follow-up' }] : []),
  ]

  const save = () => {
    if (!title.trim()) {
      setError('Give the task a short name.')
      return
    }
    const dup = state.tasks.find((t) => t.title.toLowerCase() === title.trim().toLowerCase() && !t.done)
    if (dup) {
      setError('This task is already on your list.')
      return
    }
    actions.addTask(title, due)
    showToast({ message: 'Task added', tone: 'success' })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a care task"
      footer={
        <Button block onClick={save}>
          Add task
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField
          label="Task"
          placeholder="e.g. Book a blood test"
          value={title}
          maxLength={80}
          error={error}
          onChange={(e) => {
            setTitle(e.target.value)
            setError(undefined)
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
        <div>
          <p className="mb-2 text-callout font-medium">Due</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Due date">
            {dueOptions.map((o) => (
              <button
                key={o.label}
                role="radio"
                aria-checked={due === o.id}
                onClick={() => setDue(o.id)}
                className={`min-h-11 rounded-full border px-4 text-callout font-medium transition-colors ${due === o.id ? 'border-action bg-action-soft text-action-hover' : 'border-border bg-surface hover:bg-surface-muted'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Sheet>
  )
}

/* ── Mood / energy check-in ─────────────────────────────────── */

export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, showToast } = useStore()
  const existing = todaysEntry(state)
  const [mood, setMood] = useState<MoodLevel | undefined>()
  const [energy, setEnergy] = useState<MoodLevel | undefined>()
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setMood(existing?.mood)
      setEnergy(existing?.energy)
      setNote(existing?.note ?? '')
    }
  }, [open, existing])

  const save = () => {
    if (!mood || !energy) return
    actions.saveCheckIn({ mood, energy, note: note.trim() }, existing?.id)
    showToast({ message: existing ? 'Check-in updated' : 'Check-in saved to your journal', tone: 'success' })
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Edit today’s check-in' : 'How are you feeling today?'}
      description="Just for you. Saved to your journal as your own notes."
      footer={
        <Button block disabled={!mood || !energy} onClick={save}>
          {!mood ? 'Choose a mood to continue' : !energy ? 'Set your energy to continue' : 'Save check-in'}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-2 text-callout font-medium">Mood</p>
          <MoodScale value={mood} onChange={setMood} />
        </div>
        <div>
          <p className="mb-2 text-callout font-medium">Energy</p>
          <EnergyScale value={energy} onChange={setEnergy} />
        </div>
        <TextArea label="Note (optional)" placeholder="Anything you want to remember…" value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} hint={`${note.length}/280`} />
      </div>
    </Sheet>
  )
}

/* ── Set / edit medication reminder ─────────────────────────── */

const TIME_PRESETS = ['08:00', '12:00', '18:00', '20:00', '21:30']

export function ReminderSheet({ open, onClose, medId = 'med-a', initialTime, onSaved }: { open: boolean; onClose: () => void; medId?: string; initialTime?: string; onSaved?: (time: string) => void }) {
  const { state, actions, showToast } = useStore()
  const med = state.medications.find((m) => m.id === medId)!
  const existing = state.reminders.find((r) => r.medId === medId)
  const [time, setTime] = useState(initialTime ?? existing?.time ?? '20:00')

  useEffect(() => {
    if (open) setTime(initialTime ?? existing?.time ?? '20:00')
  }, [open, initialTime, existing?.time])

  const save = () => {
    actions.setReminder(medId, time)
    showToast({ message: existing ? `Reminder moved to ${fmtTime(time)}` : `Daily reminder set for ${fmtTime(time)}`, tone: 'success' })
    onSaved?.(time)
    onClose()
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={existing ? 'Edit reminder' : 'Set a reminder'}
      footer={
        <div className="flex flex-col gap-2">
          <Button block icon={BellRing} onClick={save} disabled={existing?.time === time}>
            {existing ? (existing.time === time ? 'No changes' : `Save · ${fmtTime(time)}`) : `Set daily reminder · ${fmtTime(time)}`}
          </Button>
          {existing && (
            <Button
              block
              variant="danger"
              icon={Trash2}
              onClick={() => {
                actions.removeReminder(medId)
                showToast({ message: 'Reminder turned off' })
                onClose()
              }}
            >
              Turn off reminder
            </Button>
          )}
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-[14px] bg-lavender-50 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-headline font-medium">{med.name}</p>
            <span className="inline-flex items-center gap-1 text-caption font-medium text-text-muted">
              <Lock size={13} aria-hidden /> From your care plan
            </span>
          </div>
          <p className="mt-1 text-callout text-text-muted">
            {med.instruction} · Prescribed by {med.prescribedBy}
          </p>
          <p className="mt-2 text-caption text-text-muted">Instructions can only be changed by your clinician. You can change when you’re reminded.</p>
        </div>

        <div>
          <label htmlFor="rem-time" className="mb-2 block text-callout font-medium">
            Remind me daily at
          </label>
          <input
            id="rem-time"
            type="time"
            value={time}
            onChange={(e) => e.target.value && setTime(e.target.value)}
            className="min-h-12 w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 text-headline font-medium focus:border-action focus:outline-none focus:ring-4 focus:ring-action/15"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {TIME_PRESETS.map((t) => (
              <button
                key={t}
                onClick={() => setTime(t)}
                aria-pressed={time === t}
                className={`min-h-11 rounded-full border px-3.5 text-callout font-medium transition-colors ${time === t ? 'border-action bg-action-soft text-action-hover' : 'border-border hover:bg-surface-muted'}`}
              >
                {fmtTime(t)}
              </button>
            ))}
          </div>
        </div>
        <p className="text-caption text-text-muted">Reminders are simulated in this prototype and only appear while Avela is open.</p>
      </div>
    </Sheet>
  )
}

/* ── Add reminder (chooses from care plan; duplicates route to review) ── */

export function AddReminderSheet({ open, onClose, onReviewExisting, onCreate }: { open: boolean; onClose: () => void; onReviewExisting: (medId: string) => void; onCreate: (medId: string) => void }) {
  const { state } = useStore()
  const [selected, setSelected] = useState(state.medications[0]?.id)
  const existing = state.reminders.find((r) => r.medId === selected)
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add a reminder"
      description="Choose a medication from your care plan."
      footer={
        <Button block onClick={() => (existing ? onReviewExisting(selected!) : onCreate(selected!))}>
          {existing ? 'Review existing reminder' : 'Continue'}
        </Button>
      }
    >
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Medication">
        {state.medications.map((m) => {
          const r = state.reminders.find((x) => x.medId === m.id)
          return <ChoiceCard key={m.id} selected={selected === m.id} onSelect={() => setSelected(m.id)} title={m.name} body={`${m.instruction}${r ? ` · Reminder at ${fmtTime(r.time)}` : ''}`} />
        })}
        {existing && (
          <Notice tone="info" title="Already has a reminder">
            {state.medications.find((m) => m.id === selected)?.name} is reminded daily at {fmtTime(existing.time)}. Review it instead of adding a second one.
          </Notice>
        )}
        <p className="text-caption text-text-muted">Only medications in your care plan can have reminders. To add a new medication, ask your clinician to update your care plan.</p>
      </div>
    </Sheet>
  )
}

/* ── Snooze ─────────────────────────────────────────────────── */

export function SnoozeSheet({ open, onClose, medId = 'med-a' }: { open: boolean; onClose: () => void; medId?: string }) {
  const { state, actions, showToast } = useStore()
  const med = state.medications.find((m) => m.id === medId)!
  return (
    <Sheet open={open} onClose={onClose} title="Snooze reminder" description={`Remind me about ${med.name} again in…`}>
      <div className="grid grid-cols-3 gap-2 pb-2">
        {[10, 20, 30].map((m) => (
          <button
            key={m}
            onClick={() => {
              const until = actions.snooze(medId, m)
              showToast({ message: `Snoozed until ${fmtTime(until)}` })
              onClose()
            }}
            className="flex min-h-20 flex-col items-center justify-center rounded-[16px] border border-border bg-surface hover:border-action hover:bg-action-soft/50"
          >
            <span className="text-title font-medium">{m}</span>
            <span className="text-caption text-text-muted">minutes</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}

/* ── Add care member ────────────────────────────────────────── */

const ROLES = ['Family or friend', 'Caregiver', 'Clinician', 'Pharmacy']

export function AddCareMemberSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actions, showToast } = useStore()
  const [name, setName] = useState('')
  const [role, setRole] = useState(ROLES[0])
  const [detail, setDetail] = useState('')
  const [error, setError] = useState<string>()
  useEffect(() => {
    if (open) {
      setName('')
      setRole(ROLES[0])
      setDetail('')
      setError(undefined)
    }
  }, [open])
  const save = () => {
    if (!name.trim()) return setError('Add a name.')
    actions.addCareMember({ name: name.trim(), role, detail: detail.trim() })
    showToast({ message: `${name.trim()} added to your care team`, tone: 'success' })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Add a care member" footer={<Button block onClick={save}>Add to care team</Button>}>
      <div className="flex flex-col gap-4">
        <TextField label="Name" value={name} error={error} onChange={(e) => (setName(e.target.value), setError(undefined))} placeholder="e.g. Sam Patel" />
        <div>
          <p className="mb-2 text-callout font-medium">Role</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Role">
            {ROLES.map((r) => (
              <button key={r} role="radio" aria-checked={role === r} onClick={() => setRole(r)} className={`min-h-11 rounded-full border px-4 text-callout font-medium ${role === r ? 'border-action bg-action-soft text-action-hover' : 'border-border hover:bg-surface-muted'}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <TextField label="Note (optional)" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="e.g. Helps with pharmacy pickups" />
        <p className="text-caption text-text-muted">Saved on this device only. They won’t be contacted or given access.</p>
      </div>
    </Sheet>
  )
}

