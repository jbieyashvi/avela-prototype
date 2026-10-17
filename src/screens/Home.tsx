import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CalendarDays, ChevronDown, ChevronRight, ClipboardList, NotebookPen, Pill, Plus, Sparkles } from 'lucide-react'
import { Screen, Composer } from '../components/Chrome'
import { Avatar, Badge, Card, CardHeader } from '../components/Card'
import { Button, IconButton } from '../components/Button'
import { FilterChips } from '../components/Form'
import { AppointmentCard, MedicationReminderCard, TaskList, doseBadge } from '../components/Domain'
import { EmptyState } from '../components/Feedback'
import { Sheet } from '../components/Sheet'
import { AddCareMemberSheet, AddTaskSheet, CheckInSheet, ReminderSheet, SnoozeSheet } from '../components/Sheets'
import { useStore, doctorById, doseStatus, todaysEntry, upcomingAppointment } from '../state/store'
import { useMedicationActions } from '../state/hooks'
import { TODAY, addDays, dayOfMonth, daysFromToday, fmtDate, fmtTime, greeting, relativeDay, weekday } from '../lib/time'
import { ENERGY_LABELS, MOODS } from '../data/seed'
import { cx } from '../lib/cx'

type Filter = 'all' | 'insights' | 'meds' | 'tasks' | 'appointments'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'insights', label: 'Insights' },
  { id: 'meds', label: 'Meds' },
  { id: 'tasks', label: 'To-do list' },
  { id: 'appointments', label: 'Appointments' },
]

export function Home() {
  const navigate = useNavigate()
  const { state } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [sheet, setSheet] = useState<null | 'mood' | 'task' | 'reminder' | 'snooze' | 'care' | 'notifications' | 'day'>(null)
  const [weekOpen, setWeekOpen] = useState(false)
  const [day, setDay] = useState(TODAY)
  const close = () => setSheet(null)
  const unread = state.notifications.some((n) => !n.read)

  return (
    <Screen
      label="Today"
      scrollClassName="home-backdrop"
      footer={
        <div className="flex-none bg-gradient-to-t from-[#f0f1fc] via-[#f0f1fc]/95 to-[#f0f1fc]/0 px-4 pb-2.5 pt-2">
          <Composer onOpen={() => navigate('/assistant')} onVoice={() => navigate('/voice')} />
        </div>
      }
    >
      <div className="on-dark px-4 pt-[max(10px,env(safe-area-inset-top))] text-white">
        {/* Profile / date / notifications */}
        <div className="flex min-h-12 items-center gap-1">
          <button onClick={() => navigate('/profile')} aria-label="Profile: Eva Smith" className="flex size-11 items-center justify-center rounded-full">
            <span className="rounded-full ring-2 ring-white/35">
              <Avatar initials={state.profile.initials} tone="coral" size={36} />
            </span>
          </button>
          <button
            onClick={() => setWeekOpen((v) => !v)}
            aria-expanded={weekOpen}
            aria-controls="week-strip"
            className="flex min-h-11 items-center gap-1 rounded-full px-2 text-callout font-medium text-white/90 hover:text-white"
          >
            {fmtDate(TODAY, { short: true })}
            <ChevronDown size={15} className={cx('transition-transform duration-200', weekOpen && 'rotate-180')} aria-hidden />
          </button>
          <span className="flex-1" />
          <IconButton icon={Bell} size="sm" label={unread ? 'Notifications, unread' : 'Notifications'} tone="glass" badge={unread} onClick={() => setSheet('notifications')} />
        </div>

        {weekOpen && <WeekStrip onPick={(d) => (d === TODAY ? setWeekOpen(false) : (setDay(d), setSheet('day')))} />}

        <h1 className="mt-3 text-display font-medium">
          {greeting()},
          <br />
          {state.profile.firstName} {state.profile.lastName}!
        </h1>

        <div className="mt-2">
          <FilterChips label="Filter today’s cards" options={FILTERS} value={filter} onChange={setFilter} onDark />
        </div>
      </div>

      <div className="px-4 pb-5 pt-2">
        {filter === 'all' && (
          <div className="grid grid-cols-2 gap-2.5">
            <MoodCard onLog={() => setSheet('mood')} />
            <AppointmentMini />
            <TasksCard className="col-span-2" onAdd={() => setSheet('task')} />
            <MedicationMini onSet={() => setSheet('reminder')} onSnooze={() => setSheet('snooze')} />
            <VisitPrepMini />
            <CareTeamCard className="col-span-2" onAdd={() => setSheet('care')} />
          </div>
        )}
        {filter === 'insights' && (
          <div className="grid grid-cols-2 gap-2.5">
            <WeekMoodCard className="col-span-2" />
            <MoodCard onLog={() => setSheet('mood')} />
            <VisitPrepMini />
          </div>
        )}
        {filter === 'meds' && <MedsSection onSet={() => setSheet('reminder')} onSnooze={() => setSheet('snooze')} onEdit={() => setSheet('reminder')} />}
        {filter === 'tasks' && <TasksCard onAdd={() => setSheet('task')} />}
        {filter === 'appointments' && <AppointmentsSection onAddCare={() => setSheet('care')} />}
      </div>

      <CheckInSheet open={sheet === 'mood'} onClose={close} />
      <AddTaskSheet open={sheet === 'task'} onClose={close} />
      <ReminderSheet open={sheet === 'reminder'} onClose={close} />
      <SnoozeSheet open={sheet === 'snooze'} onClose={close} />
      <AddCareMemberSheet open={sheet === 'care'} onClose={close} />
      <NotificationsSheet open={sheet === 'notifications'} onClose={close} />
      <DayAgendaSheet open={sheet === 'day'} date={day} onClose={close} />
    </Screen>
  )
}

/* ── Header week strip ─────────────────────────────────────── */

function WeekStrip({ onPick }: { onPick: (d: string) => void }) {
  const { state } = useStore()
  const appt = upcomingAppointment(state)
  const days = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i))
  return (
    <div id="week-strip" className="mt-1 flex animate-rise justify-between gap-1 rounded-[16px] bg-white/12 p-1 backdrop-blur" role="group" aria-label="This week">
      {days.map((d) => {
        const isToday = d === TODAY
        const hasAppt = appt?.date === d
        return (
          <button
            key={d}
            onClick={() => onPick(d)}
            aria-label={`${fmtDate(d)}${hasAppt ? ', appointment' : ''}${isToday ? ', today' : ''}`}
            aria-current={isToday ? 'date' : undefined}
            className={cx('relative flex min-h-12 flex-1 flex-col items-center justify-center rounded-[12px] transition-colors', isToday ? 'bg-white text-royal-500' : 'hover:bg-white/15')}
          >
            <span className={cx('text-micro', isToday ? 'text-royal-500/80' : 'text-white/80')}>{weekday(d, true)}</span>
            <span className="text-callout font-medium">{dayOfMonth(d)}</span>
            {hasAppt && <span className="absolute bottom-1 size-1.5 rounded-full bg-attention" aria-hidden />}
          </button>
        )
      })}
    </div>
  )
}

function DayAgendaSheet({ open, date, onClose }: { open: boolean; date: string; onClose: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const appt = upcomingAppointment(state)
  const reminder = state.reminders[0]
  const tasks = state.tasks.filter((t) => t.due === date && !t.done)
  const items = [
    appt?.date === date && { key: 'a', label: `${fmtTime(appt.time)} · Follow-up with Dr Erica Morgan`, to: '/care/appointment' },
    reminder && { key: 'r', label: `${fmtTime(reminder.time)} · Medication A reminder`, to: '/care/medications' },
    ...tasks.map((t) => ({ key: t.id, label: `Task · ${t.title}`, to: '/care' })),
  ].filter(Boolean) as { key: string; label: string; to: string }[]
  return (
    <Sheet open={open} onClose={onClose} title={relativeDay(date)} description={fmtDate(date)}>
      {items.length ? (
        <ul className="flex flex-col gap-2 pb-2">
          {items.map((i) => (
            <li key={i.key}>
              <button onClick={() => navigate(i.to)} className="flex min-h-11 w-full items-center gap-3 rounded-[12px] border border-border px-3.5 text-left text-callout hover:bg-surface-muted">
                <span className="flex-1">{i.label}</span>
                <ChevronRight size={16} className="text-text-muted" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={CalendarDays} title="Nothing planned" body="No appointments, reminders or tasks for this day." />
      )}
    </Sheet>
  )
}

function NotificationsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, actions, setReminderBanner } = useStore()
  const navigate = useNavigate()
  const hasReminder = state.reminders.length > 0
  return (
    <Sheet
      open={open}
      onClose={() => {
        actions.markNotificationsRead()
        onClose()
      }}
      title="Notifications"
      description="Simulated in this prototype — Avela can’t notify you while the browser is closed."
    >
      <ul className="flex flex-col gap-2">
        {state.notifications.map((n) => (
          <li key={n.id}>
            <button
              disabled={!n.to}
              onClick={() => {
                actions.markNotificationsRead()
                if (n.to) navigate(n.to)
              }}
              className="flex w-full gap-2.5 rounded-[14px] border border-border p-3 text-left enabled:hover:bg-surface-muted disabled:cursor-default"
            >
              <span className={cx('mt-1.5 size-2 flex-none rounded-full', n.read ? 'bg-transparent' : 'bg-attention')} aria-label={n.read ? undefined : 'Unread'} />
              <span className="min-w-0 flex-1">
                <span className="block text-callout font-medium">{n.title}</span>
                <span className="block text-caption text-text-muted">{n.body}</span>
                <span className="mt-0.5 block text-micro text-text-subtle">{n.when}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 rounded-[14px] bg-lavender-50 p-3.5">
        <p className="text-callout font-medium">Preview a medication reminder</p>
        <p className="mt-0.5 text-caption text-text-muted">{hasReminder ? 'See how a reminder appears while Avela is open.' : 'Set a reminder for Medication A first.'}</p>
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          disabled={!hasReminder}
          onClick={() => {
            actions.markNotificationsRead()
            onClose()
            setReminderBanner(true)
          }}
        >
          Show preview
        </Button>
      </div>
    </Sheet>
  )
}

/* ── Cards ─────────────────────────────────────────────────── */

const miniTitle = 'text-headline font-medium text-text'
const miniMeta = 'text-caption text-text-muted'

function MoodCard({ onLog }: { onLog: () => void }) {
  const { state } = useStore()
  const entry = todaysEntry(state)
  const mood = MOODS.find((m) => m.value === entry?.mood)
  return (
    <Card className="flex min-h-[148px] flex-col">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-coral-100 text-[18px] leading-none" aria-hidden>
        {mood?.emoji ?? '🌤️'}
      </span>
      {entry && mood ? (
        <>
          <h3 className={cx(miniTitle, 'mt-2.5')}>Feeling {mood.label.toLowerCase()}</h3>
          <p className={miniMeta}>Energy: {ENERGY_LABELS[entry.energy - 1].toLowerCase()}</p>
          <Button size="sm" variant="secondary" className="mt-auto self-start" onClick={onLog} aria-label="Edit today’s check-in">
            Edit
          </Button>
        </>
      ) : (
        <>
          <h3 className={cx(miniTitle, 'mb-2.5 mt-2.5')}>How are you feeling today?</h3>
          <Button size="sm" className="mt-auto self-start !bg-coral-500 hover:!bg-coral-700" onClick={onLog}>
            Log mood
          </Button>
        </>
      )}
    </Card>
  )
}

function AppointmentMini() {
  const { state } = useStore()
  const navigate = useNavigate()
  const appt = upcomingAppointment(state)
  if (!appt)
    return (
      <Card className="flex min-h-[148px] flex-col">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-royal-100 text-brand" aria-hidden>
          <CalendarDays size={16} />
        </span>
        <h3 className={cx(miniTitle, 'mb-2.5 mt-2.5')}>No upcoming visits</h3>
        <Button size="sm" className="mt-auto self-start" onClick={() => navigate('/care/book')}>
          Book
        </Button>
      </Card>
    )
  const doc = doctorById(state, appt.doctorId)
  return (
    <Card className="flex min-h-[148px] flex-col">
      <div className="flex items-center justify-between gap-1">
        <span className="flex size-8 flex-col items-center justify-center rounded-[10px] bg-royal-100 text-royal-500" aria-hidden>
          <span className="text-[9px] font-medium leading-none">{weekday(appt.date, true)}</span>
          <span className="text-[13px] font-semibold leading-4">{dayOfMonth(appt.date)}</span>
        </span>
        <Badge tone="brand">{daysFromToday(appt.date) <= 1 ? relativeDay(appt.date) : `In ${daysFromToday(appt.date)} days`}</Badge>
      </div>
      <h3 className={cx(miniTitle, 'mt-2.5 line-clamp-2')}>{doc.name}</h3>
      <p className={cx(miniMeta, 'mb-2.5')}>
        {fmtDate(appt.date, { short: true })} · {fmtTime(appt.time)}
        {appt.visitType === 'video' ? ' · Video' : ''}
      </p>
      <Button size="sm" variant="secondary" className="mt-auto self-start" onClick={() => navigate('/care/appointment')} aria-label="View appointment details">
        Details
      </Button>
    </Card>
  )
}

function TasksCard({ className, onAdd }: { className?: string; onAdd: () => void }) {
  const { state, actions, showToast } = useStore()
  const navigate = useNavigate()
  const open = state.tasks.filter((t) => !t.done).length
  return (
    <Card className={cx('pb-2', className)}>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className={miniTitle}>To-do list</h3>
          <p className={miniMeta}>{open ? `${open} to do` : 'All done'}</p>
        </div>
        <button
          onClick={onAdd}
          aria-label="Add task"
          className="-mr-1 flex size-11 flex-none items-center justify-center rounded-full"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-ink-900 text-white transition-colors hover:bg-ink-600">
            <Plus size={16} strokeWidth={2.2} aria-hidden />
          </span>
        </button>
      </div>
      <div className="mt-1">
        {state.tasks.length ? (
          <TaskList
            tasks={state.tasks}
            onToggle={(t) => {
              actions.setTaskDone(t.id, !t.done)
              showToast(t.done ? { message: 'Task reopened' } : { message: 'Task completed', tone: 'success', action: { label: 'Undo', onClick: () => actions.setTaskDone(t.id, false) } })
            }}
            onOpen={(t) => (t.link === 'visit-prep' ? () => navigate('/journal/prepare') : undefined)}
          />
        ) : (
          <EmptyState icon={ClipboardList} title="No care tasks yet" body="Add things like picking up a prescription." />
        )}
      </div>
    </Card>
  )
}

function MedicationMini({ onSet, onSnooze }: { onSet: () => void; onSnooze: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const { markTaken, undoTaken } = useMedicationActions()
  const med = state.medications[0]
  const status = doseStatus(state, med.id)
  return (
    <Card className="flex flex-col">
      <button onClick={() => navigate('/care/medications')} className="-m-1.5 flex min-h-11 items-center justify-between rounded-[12px] p-1.5 text-left" aria-label="Open medication schedule">
        <span className="flex size-8 items-center justify-center rounded-[10px] bg-action-soft text-action-hover" aria-hidden>
          <Pill size={16} />
        </span>
        <ChevronRight size={16} className="text-text-muted" aria-hidden />
      </button>
      <p className={cx(miniMeta, 'mt-1.5')}>{status.kind === 'no-reminder' ? med.name : status.kind === 'taken' ? 'Logged today' : 'Next dose'}</p>
      {status.kind === 'no-reminder' && (
        <>
          <h3 className={miniTitle}>No reminder yet</h3>
          <p className={cx(miniMeta, 'mb-2.5')}>{med.instruction}</p>
          <Button size="sm" className="mt-auto self-start" onClick={onSet}>
            Set reminder
          </Button>
        </>
      )}
      {(status.kind === 'upcoming' || status.kind === 'due' || status.kind === 'snoozed') && (
        <>
          <h3 className={miniTitle}>{fmtTime(status.kind === 'snoozed' ? status.until : status.time)}</h3>
          <p className={cx(miniMeta, 'mb-2.5')}>{status.kind === 'snoozed' ? `Snoozed · ${med.name}` : `${med.name} · one tablet`}</p>
          <div className="mt-auto grid grid-cols-2 gap-1.5">
            <Button size="sm" className="w-full px-2" onClick={() => markTaken(med.id)} aria-label={`Mark ${med.name} as taken`}>
              Taken
            </Button>
            <Button size="sm" variant="secondary" className="w-full px-2" onClick={onSnooze} aria-label="Snooze reminder">
              Snooze
            </Button>
          </div>
        </>
      )}
      {status.kind === 'taken' && (
        <>
          <h3 className={miniTitle}>{med.name}</h3>
          <div className="mb-2.5 mt-1">{doseBadge(status)}</div>
          <Button size="sm" variant="secondary" className="mt-auto self-start" onClick={() => undoTaken(status.logId)}>
            Undo
          </Button>
        </>
      )}
    </Card>
  )
}

function VisitPrepMini() {
  const { state } = useStore()
  const navigate = useNavigate()
  const saved = !!state.visitPrep.savedAt
  return (
    <Card className="flex flex-col">
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-royal-100 text-brand" aria-hidden>
        <NotebookPen size={16} />
      </span>
      <p className={cx(miniMeta, 'mt-2.5')}>{saved ? 'Notes saved' : 'For Wednesday'}</p>
      <h3 className={cx(miniTitle, 'mb-2.5')}>{saved ? 'Review visit notes' : 'Prepare for your visit'}</h3>
      <Button size="sm" variant="secondary" className="mt-auto self-start" onClick={() => navigate('/journal/prepare')} aria-label={saved ? 'Open visit notes' : 'Start visit prep'}>
        {saved ? 'Open' : 'Start'}
      </Button>
    </Card>
  )
}

function CareTeamCard({ className, onAdd }: { className?: string; onAdd: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  return (
    <Card className={cx('flex items-center gap-2', className)}>
      <button onClick={() => navigate('/care#team')} className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[12px] text-left" aria-label="View care team">
        <span className="flex flex-none -space-x-2">
          {state.careTeam.slice(0, 3).map((m) => (
            <span key={m.id} className="rounded-full ring-2 ring-white">
              <Avatar initials={m.initials} tone={m.tone} size={32} />
            </span>
          ))}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cx(miniTitle, 'block')}>Your care team</span>
          <span className={cx(miniMeta, 'block truncate')}>{state.careTeam.length} people · {state.careTeam.map((m) => m.name.split(' ').slice(0, 2).join(' ')).join(', ')}</span>
        </span>
      </button>
      <button onClick={onAdd} aria-label="Add a care member" className="-mr-1 flex size-11 flex-none items-center justify-center rounded-full">
        <span className="flex size-8 items-center justify-center rounded-full bg-coral-500 text-white transition-colors hover:bg-coral-700">
          <Plus size={16} strokeWidth={2.2} aria-hidden />
        </span>
      </button>
    </Card>
  )
}

function WeekMoodCard({ className }: { className?: string }) {
  const { state } = useStore()
  const days = Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6))
  const entries = days.map((d) => state.journal.find((j) => j.date === d))
  const count = entries.filter(Boolean).length
  return (
    <Card className={className}>
      <CardHeader icon={Sparkles} tone="violet" eyebrow="Last 7 days" title={`${count} check-in${count === 1 ? '' : 's'}`} />
      <div className="mt-3 flex h-24 items-end justify-between gap-2" role="img" aria-label={`Mood from your check-ins over the last 7 days: ${entries.map((e, i) => `${weekday(days[i], true)} ${e ? MOODS[e.mood - 1].label : 'no entry'}`).join(', ')}`}>
        {entries.map((e, i) => (
          <div key={days[i]} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-16 w-full items-end justify-center">
              {e ? <div className="w-full max-w-7 rounded-[8px] bg-gradient-to-t from-brand to-peri-300" style={{ height: `${e.mood * 20}%` }} /> : <div className="h-1.5 w-full max-w-7 rounded-full bg-lavender-100" />}
            </div>
            <span className={cx('text-micro', days[i] === TODAY ? 'text-text' : 'text-text-muted')}>{weekday(days[i], true).slice(0, 2)}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-caption text-text-muted">Based on moods you logged. A personal record, not a medical assessment.</p>
    </Card>
  )
}

function MedsSection({ onSet, onSnooze, onEdit }: { onSet: () => void; onSnooze: () => void; onEdit: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const { markTaken, undoTaken } = useMedicationActions()
  const med = state.medications[0]
  const status = doseStatus(state, med.id)
  return (
    <div className="flex flex-col gap-2.5">
      <MedicationReminderCard
        name={med.name}
        instruction={med.instruction}
        prescribedBy={med.prescribedBy}
        status={status}
        onSet={onSet}
        onTaken={() => markTaken(med.id)}
        onSnooze={onSnooze}
        onEdit={onEdit}
        onUndo={status.kind === 'taken' ? () => undoTaken(status.logId) : undefined}
      />
      <Button variant="secondary" block iconRight={ChevronRight} onClick={() => navigate('/care/medications')}>
        Open medication schedule
      </Button>
    </div>
  )
}

function AppointmentsSection({ onAddCare }: { onAddCare: () => void }) {
  const { state } = useStore()
  const navigate = useNavigate()
  const appt = upcomingAppointment(state)
  return (
    <div className="flex flex-col gap-2.5">
      {appt ? (
        <AppointmentCard appt={appt} doctor={doctorById(state, appt.doctorId)} />
      ) : (
        <Card>
          <EmptyState icon={CalendarDays} title="No upcoming appointments" action={<Button onClick={() => navigate('/care/book')}>Book a follow-up</Button>} />
        </Card>
      )}
      <CareTeamCard onAdd={onAddCare} />
    </div>
  )
}
