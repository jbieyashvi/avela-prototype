import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarPlus, ChevronRight, ListChecks, Plus, UserPlus } from 'lucide-react'
import { Screen } from '../components/Chrome'
import { Avatar, Badge, Card, SectionTitle } from '../components/Card'
import { Button } from '../components/Button'
import { EmptyState } from '../components/Feedback'
import { AppointmentCard, MedicationReminderCard, TaskList } from '../components/Domain'
import { AddCareMemberSheet, AddTaskSheet, ReminderSheet, SnoozeSheet } from '../components/Sheets'
import { doctorById, doseStatus, upcomingAppointment, useStore } from '../state/store'
import { useMedicationActions } from '../state/hooks'
import { fmtDate, fmtTime } from '../lib/time'

export function Care() {
  const navigate = useNavigate()
  const location = useLocation()
  const { state, actions } = useStore()
  const { markTaken, undoTaken } = useMedicationActions()
  const [sheet, setSheet] = useState<null | 'task' | 'reminder' | 'snooze' | 'member'>(null)
  const [showDone, setShowDone] = useState(false)

  const appt = upcomingAppointment(state)
  const past = state.appointments.filter((a) => a.status === 'completed')
  const med = state.medications[0]
  const status = doseStatus(state, med.id)
  const reminder = state.reminders.find((r) => r.medId === med.id)
  const open = state.tasks.filter((t) => !t.done)
  const done = state.tasks.filter((t) => t.done)

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1))
      el?.scrollIntoView({ block: 'start' })
    }
  }, [location.hash])

  return (
    <Screen
      label="Care"
      header={
        <header className="flex-none bg-canvas px-5 pb-2 pt-[max(16px,env(safe-area-inset-top))]">
          <h1 className="text-title font-medium">Care</h1>
          <p className="text-callout text-text-muted">Appointments, medication, tasks and your care team.</p>
        </header>
      }
      className="bg-canvas"
    >
      <div className="flex flex-col gap-7 px-5 pb-8 pt-3">
        {/* Appointments */}
        <section aria-labelledby="care-appts">
          <SectionTitle id="care-appts" action={appt && <Button size="sm" variant="ghost" icon={CalendarPlus} onClick={() => navigate('/care/book')}>Reschedule</Button>}>
            Appointments
          </SectionTitle>
          {appt ? (
            <AppointmentCard appt={appt} doctor={doctorById(state, appt.doctorId)} />
          ) : (
            <Card>
              <EmptyState icon={CalendarDays} title="No upcoming appointments" body="Book a follow-up with Dr Erica Morgan when you’re ready." action={<Button onClick={() => navigate('/care/book')}>Book a follow-up</Button>} />
            </Card>
          )}
          {past.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {past.map((p) => (
                <li key={p.id} className="flex min-h-12 items-center justify-between gap-3 rounded-[16px] bg-surface/70 px-4 py-2.5 text-callout">
                  <span className="min-w-0">
                    <span className="block font-medium">{p.kind}</span>
                    <span className="block text-text-muted">
                      {fmtDate(p.date, { short: true })}, {fmtTime(p.time)} · {p.reason}
                    </span>
                  </span>
                  <Badge>Past</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Medication */}
        <section aria-labelledby="care-meds">
          <SectionTitle id="care-meds" action={<Button size="sm" variant="ghost" iconRight={ChevronRight} onClick={() => navigate('/care/medications')}>Schedule</Button>}>
            Medication
          </SectionTitle>
          <MedicationReminderCard
            name={med.name}
            instruction={med.instruction}
            prescribedBy={med.prescribedBy}
            status={status}
            onSet={() => setSheet('reminder')}
            onTaken={() => markTaken(med.id)}
            onSnooze={() => setSheet('snooze')}
            onEdit={() => setSheet('reminder')}
            onUndo={status.kind === 'taken' ? () => undoTaken(status.logId) : undefined}
          />
        </section>

        {/* Tasks */}
        <section aria-labelledby="care-tasks">
          <SectionTitle id="care-tasks" action={<Button size="sm" variant="ghost" icon={Plus} onClick={() => setSheet('task')}>Add task</Button>}>
            Tasks
          </SectionTitle>
          <Card className="p-2">
            {open.length ? (
              <TaskList tasks={open} onToggle={(t) => actions.setTaskDone(t.id, !t.done)} onOpen={(t) => (t.link === 'visit-prep' ? () => navigate('/journal/prepare') : undefined)} />
            ) : (
              <EmptyState icon={ListChecks} title="You’re all caught up" body="Add a task when something comes up." />
            )}
            {done.length > 0 && (
              <div className="border-t border-border px-2 pt-1">
                <button onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="flex min-h-11 w-full items-center justify-between text-callout font-medium text-text-muted">
                  Completed ({done.length})
                  <ChevronRight size={18} className={showDone ? 'rotate-90 transition-transform' : 'transition-transform'} aria-hidden />
                </button>
                {showDone && <TaskList tasks={done} onToggle={(t) => actions.setTaskDone(t.id, !t.done)} />}
              </div>
            )}
          </Card>
        </section>

        {/* Care team */}
        <section aria-labelledby="care-team" id="team" className="scroll-mt-4">
          <SectionTitle id="care-team">Care team</SectionTitle>
          <Card className="p-2">
            <ul>
              {state.careTeam.map((m) => (
                <li key={m.id} className="flex min-h-12 items-center gap-2.5 px-2 py-1.5">
                  <Avatar initials={m.initials} tone={m.tone} size={40} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-body font-medium">{m.name}</span>
                    <span className="block truncate text-callout text-text-muted">
                      {m.role}
                      {m.detail ? ` · ${m.detail}` : ''}
                    </span>
                  </span>
                  {m.addedByUser && <Badge tone="violet">Added by you</Badge>}
                </li>
              ))}
            </ul>
            <button onClick={() => setSheet('member')} className="mt-1 flex min-h-12 w-full items-center gap-3 rounded-[14px] px-2 text-left text-body font-medium text-action-hover hover:bg-surface-muted">
              <span className="flex size-10 items-center justify-center rounded-full border border-dashed border-action/50" aria-hidden>
                <UserPlus size={18} />
              </span>
              Add a care member
            </button>
          </Card>
        </section>
      </div>

      <AddTaskSheet open={sheet === 'task'} onClose={() => setSheet(null)} />
      <ReminderSheet open={sheet === 'reminder'} onClose={() => setSheet(null)} medId={med.id} initialTime={reminder?.time} />
      <SnoozeSheet open={sheet === 'snooze'} onClose={() => setSheet(null)} medId={med.id} />
      <AddCareMemberSheet open={sheet === 'member'} onClose={() => setSheet(null)} />
    </Screen>
  )
}
