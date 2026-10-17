import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BellRing, CalendarClock, Check, CheckCircle2, ChevronRight, Clock, MapPin, Pill, RotateCcw, Video } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../lib/cx'
import { dayOfMonth, fmtDate, fmtTime, relativeDay, weekday } from '../lib/time'
import { MOODS, ENERGY_LABELS } from '../data/seed'
import type { Appointment, Doctor, MoodLevel, Task } from '../state/types'
import type { DoseStatus } from '../state/store'
import { Badge, Card } from './Card'
import { Button } from './Button'

/* ── Task checklist ─────────────────────────────────────────── */

export function TaskItem({ task, onToggle, onOpen }: { task: Task; onToggle: () => void; onOpen?: () => void }) {
  return (
    <li className="flex items-center gap-1">
      <button
        role="checkbox"
        aria-checked={task.done}
        onClick={onToggle}
        className="group flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-[12px] px-2 text-left transition-colors hover:bg-surface-muted"
      >
        <span
          className={cx(
            'flex size-5 flex-none items-center justify-center rounded-full border-[1.5px] transition-colors duration-150',
            task.done ? 'border-success bg-success text-white' : 'border-ink-400/70 group-hover:border-action',
          )}
          aria-hidden
        >
          {task.done && <Check size={12} strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1 py-1.5">
          <span className={cx('block text-callout', task.done ? 'text-text-muted line-through decoration-ink-400' : 'text-text')}>{task.title}</span>
          {task.due && !task.done && <span className="block text-caption text-text-muted">Due {relativeDay(task.due)}</span>}
          {task.done && <span className="block text-caption text-text-muted">Done</span>}
        </span>
      </button>
      {onOpen && !task.done && (
        <button onClick={onOpen} aria-label={`Open: ${task.title}`} className="flex size-11 flex-none items-center justify-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text">
          <ChevronRight size={16} aria-hidden />
        </button>
      )}
    </li>
  )
}

export function TaskList({ tasks, onToggle, onOpen }: { tasks: Task[]; onToggle: (t: Task) => void; onOpen?: (t: Task) => (() => void) | undefined }) {
  const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done))
  return (
    <ul className="-mx-2 flex flex-col">
      {sorted.map((t) => (
        <TaskItem key={t.id} task={t} onToggle={() => onToggle(t)} onOpen={onOpen?.(t)} />
      ))}
    </ul>
  )
}

/* ── Medication reminder ────────────────────────────────────── */

export function doseBadge(status: DoseStatus) {
  switch (status.kind) {
    case 'no-reminder':
      return <Badge tone="neutral">No reminder</Badge>
    case 'upcoming':
      return <Badge tone="brand" icon={Clock}>{fmtTime(status.time)}</Badge>
    case 'due':
      return <Badge tone="attention" icon={BellRing}>Reminder due</Badge>
    case 'snoozed':
      return <Badge tone="warning" icon={Clock}>Snoozed to {fmtTime(status.until)}</Badge>
    case 'taken':
      return <Badge tone="success" icon={CheckCircle2}>Taken {fmtTime(status.at)}</Badge>
  }
}

/** Medication reminder card (schedule row). Instruction is read-only (from care plan). */
export function MedicationReminderCard({
  name,
  instruction,
  prescribedBy,
  status,
  onTaken,
  onSnooze,
  onEdit,
  onSet,
  onUndo,
  compact,
}: {
  name: string
  instruction: string
  prescribedBy: string
  status: DoseStatus
  onTaken?: () => void
  onSnooze?: () => void
  onEdit?: () => void
  onSet?: () => void
  onUndo?: () => void
  compact?: boolean
}) {
  const time = status.kind === 'no-reminder' ? null : status.time
  return (
    <Card as="article" className={cx(compact && 'p-3')}>
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-action-soft text-action-hover" aria-hidden>
          <Pill size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <h3 className="text-headline font-medium">{name}</h3>
            {doseBadge(status)}
          </div>
          <p className="text-caption text-text-muted">
            {instruction} · Prescribed by {prescribedBy}
          </p>
          <p className="mt-1 text-caption font-medium text-text">{time ? <>Reminder daily at {fmtTime(time)}</> : 'No reminder set'}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
        {status.kind === 'no-reminder' && onSet && (
          <Button size="sm" icon={BellRing} onClick={onSet}>
            Set reminder
          </Button>
        )}
        {(status.kind === 'upcoming' || status.kind === 'due' || status.kind === 'snoozed') && (
          <>
            {onTaken && (
              <Button size="sm" icon={Check} onClick={onTaken}>
                Taken
              </Button>
            )}
            {onSnooze && (
              <Button size="sm" variant="secondary" onClick={onSnooze}>
                Snooze
              </Button>
            )}
          </>
        )}
        {status.kind === 'taken' && onUndo && (
          <Button size="sm" variant="secondary" icon={RotateCcw} onClick={onUndo}>
            Undo
          </Button>
        )}
        {status.kind !== 'no-reminder' && onEdit && (
          <Button size="sm" variant="ghost" onClick={onEdit}>
            Edit reminder
          </Button>
        )}
        {status.kind === 'no-reminder' && onTaken && (
          <Button size="sm" variant="secondary" icon={Check} onClick={onTaken}>
            Log as taken
          </Button>
        )}
      </div>
    </Card>
  )
}

/* ── Appointment ────────────────────────────────────────────── */

export function AppointmentSummary({ appt, doctor, children }: { appt: Appointment; doctor: Doctor; children?: ReactNode }) {
  const VisitIcon = appt.visitType === 'video' ? Video : MapPin
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="flex size-11 flex-none flex-col items-center justify-center rounded-[12px] bg-royal-100 text-royal-500" aria-hidden>
          <span className="text-[10px] font-medium leading-none">{weekday(appt.date, true)}</span>
          <span className="text-[17px] font-semibold leading-tight">{dayOfMonth(appt.date)}</span>
        </span>
        <div className="min-w-0">
          <p className="text-headline font-medium">{doctor.name}</p>
          <p className="text-caption text-text-muted">
            {appt.kind} · {doctor.speciality}
          </p>
        </div>
      </div>
      <div className="mt-2.5 flex flex-col gap-1 text-caption text-text">
        <span className="flex items-center gap-2">
          <CalendarClock size={14} className="flex-none text-text-muted" aria-hidden />
          {fmtDate(appt.date)}, {fmtTime(appt.time)}
        </span>
        <span className="flex items-center gap-2">
          <VisitIcon size={14} className="flex-none text-text-muted" aria-hidden />
          {appt.visitType === 'video' ? 'Video visit · link in appointment details' : `${doctor.clinic}, ${doctor.address}`}
        </span>
      </div>
      {children}
    </div>
  )
}

export function AppointmentCard({ appt, doctor }: { appt: Appointment; doctor: Doctor }) {
  const navigate = useNavigate()
  return (
    <Card as="article">
      <div className="mb-2.5 flex items-center justify-between">
        <Badge tone="brand">Upcoming · {relativeDay(appt.date)}</Badge>
      </div>
      <AppointmentSummary appt={appt} doctor={doctor} />
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => navigate('/care/appointment')}>
          View details
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate('/care/book')}>
          Reschedule
        </Button>
      </div>
    </Card>
  )
}

/* ── Time slots ─────────────────────────────────────────────── */

export function DateStrip({ dates, value, onChange, counts }: { dates: string[]; value: string; onChange: (d: string) => void; counts?: Record<string, number> }) {
  return (
    <div role="radiogroup" aria-label="Choose a date" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1">
      {dates.map((d) => {
        const active = d === value
        const count = counts?.[d]
        return (
          <button
            key={d}
            role="radio"
            aria-checked={active}
            aria-label={`${fmtDate(d)}${count !== undefined ? `, ${count} times available` : ''}`}
            onClick={() => onChange(d)}
            className={cx(
              'flex min-h-[64px] w-[54px] flex-none flex-col items-center justify-center rounded-[14px] border transition-colors duration-150',
              active ? 'border-action bg-action text-white' : 'border-border bg-surface hover:bg-surface-muted',
            )}
          >
            <span className={cx('text-micro', active ? 'text-white/85' : 'text-text-muted')}>{weekday(d, true)}</span>
            <span className="text-[18px] font-medium leading-6">{dayOfMonth(d)}</span>
            {count !== undefined && <span className={cx('text-[11px] leading-4', active ? 'text-white/85' : count ? 'text-text-muted' : 'text-text-subtle')}>{count ? `${count} open` : 'Full'}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function SlotGrid({ slots, value, onChange, currentTime }: { slots: string[]; value?: string; onChange: (t: string) => void; currentTime?: string }) {
  return (
    <div role="radiogroup" aria-label="Available times" className="grid grid-cols-3 gap-2">
      {slots.map((t) => {
        const isCurrent = t === currentTime
        const active = t === value
        return (
          <button
            key={t}
            role="radio"
            aria-checked={active}
            disabled={isCurrent}
            onClick={() => onChange(t)}
            className={cx(
              'flex min-h-11 flex-col items-center justify-center rounded-[12px] border px-2 text-callout font-medium transition-colors duration-150',
              active ? 'border-action bg-action text-white' : isCurrent ? 'border-dashed border-ink-200 bg-lavender-50 text-text-muted' : 'border-border bg-surface hover:border-action',
            )}
          >
            {fmtTime(t)}
            {isCurrent && <span className="text-[10px] leading-3">Current</span>}
          </button>
        )
      })}
    </div>
  )
}

/* ── Mood & energy ──────────────────────────────────────────── */

export function MoodScale({ value, onChange }: { value?: MoodLevel; onChange: (v: MoodLevel) => void }) {
  return (
    <div role="radiogroup" aria-label="Mood" className="grid grid-cols-5 gap-1.5">
      {MOODS.map((m) => {
        const active = m.value === value
        return (
          <button
            key={m.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.value)}
            className={cx(
              'flex min-h-[60px] flex-col items-center justify-center gap-1 rounded-[14px] border transition-colors duration-150',
              active ? 'border-action bg-action-soft ring-1 ring-action' : 'border-border bg-surface hover:bg-surface-muted',
            )}
          >
            <span className="text-[22px] leading-none" aria-hidden>
              {m.emoji}
            </span>
            <span className={cx('text-micro', active ? 'font-medium text-action-hover' : 'text-text-muted')}>{m.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function EnergyScale({ value, onChange }: { value?: MoodLevel; onChange: (v: MoodLevel) => void }) {
  return (
    <div>
      <div role="radiogroup" aria-label="Energy" className="flex gap-1.5">
        {([1, 2, 3, 4, 5] as MoodLevel[]).map((v) => {
          const active = value !== undefined && v <= value
          return (
            <button
              key={v}
              role="radio"
              aria-checked={v === value}
              aria-label={`Energy ${v} of 5, ${ENERGY_LABELS[v - 1]}`}
              onClick={() => onChange(v)}
              className="flex min-h-11 flex-1 items-end justify-center rounded-[10px] p-1 hover:bg-surface-muted"
            >
              <span className={cx('block w-full rounded-[6px] transition-colors duration-150', active ? 'bg-brand' : 'bg-lavender-100')} style={{ height: 10 + v * 5 }} />
            </button>
          )
        })}
      </div>
      <p className="mt-1.5 text-caption text-text-muted" aria-live="polite">
        {value ? `${ENERGY_LABELS[value - 1]} · ${value}/5` : 'Tap a bar to set your energy'}
      </p>
    </div>
  )
}

/* ── Action review card (used by assistant and voice) ───────── */

export function ActionReviewCard({
  icon: Icon,
  question,
  title,
  details,
  confirmLabel,
  onConfirm,
  onEdit,
  editLabel = 'Edit',
  onCancel,
  status = 'pending',
  confirmedText,
  cancelledText = 'Cancelled — nothing was changed.',
  note,
}: {
  icon: LucideIcon
  question: string
  title: ReactNode
  details: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onEdit?: () => void
  editLabel?: string
  onCancel?: () => void
  status?: 'pending' | 'confirmed' | 'cancelled' | 'unavailable'
  confirmedText?: ReactNode
  cancelledText?: ReactNode
  note?: ReactNode
}) {
  return (
    <div className={cx('rounded-[var(--radius-card)] border bg-surface p-3.5 shadow-[var(--shadow-card)]', status === 'confirmed' ? 'border-success/30' : 'border-action/25')}>
      <p className="text-caption font-medium text-action-hover">{question}</p>
      <div className="mt-2 flex items-start gap-2.5">
        <span className="flex size-9 flex-none items-center justify-center rounded-[10px] bg-action-soft text-action-hover" aria-hidden>
          <Icon size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-headline font-medium">{title}</p>
          <div className="text-caption text-text-muted">{details}</div>
        </div>
      </div>
      {note && <div className="mt-3 text-caption text-text-muted">{note}</div>}
      {status === 'pending' && (
        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
          <Button size="sm" icon={Check} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          {onEdit && (
            <Button size="sm" variant="secondary" onClick={onEdit}>
              {editLabel}
            </Button>
          )}
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              Not now
            </Button>
          )}
        </div>
      )}
      {status === 'confirmed' && (
        <p className="mt-3 flex items-center gap-2 text-callout font-medium text-success">
          <CheckCircle2 size={16} aria-hidden /> {confirmedText ?? 'Done'}
        </p>
      )}
      {status === 'cancelled' && <p className="mt-3 text-callout text-text-muted">{cancelledText}</p>}
    </div>
  )
}
