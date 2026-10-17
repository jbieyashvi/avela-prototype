import { useState } from 'react'
import { BellPlus, CheckCircle2, ChevronLeft, ChevronRight, Clock, History, Info } from 'lucide-react'
import { Screen, ScreenHeader } from '../components/Chrome'
import { Badge, Card, SectionTitle } from '../components/Card'
import { Button, IconButton } from '../components/Button'
import { EmptyState, Notice } from '../components/Feedback'
import { MedicationReminderCard } from '../components/Domain'
import { AddReminderSheet, ReminderSheet, SnoozeSheet } from '../components/Sheets'
import { doseStatus, useStore } from '../state/store'
import { useMedicationActions } from '../state/hooks'
import { TODAY, addDays, daysFromToday, fmtDate, fmtTime, relativeDay } from '../lib/time'
import { useBack } from '../lib/useBack'

const RANGE = 7 // days either side of today

export function Medications() {
  const back = useBack('/care')
  const { state } = useStore()
  const { markTaken, undoTaken } = useMedicationActions()
  const [date, setDate] = useState(TODAY)
  const [sheet, setSheet] = useState<null | 'add' | 'reminder' | 'snooze'>(null)
  const [reminderMed, setReminderMed] = useState(state.medications[0].id)

  const offset = daysFromToday(date)
  const isToday = offset === 0
  const isFuture = offset > 0

  const dayLogs = state.logs.filter((l) => l.date === date).sort((a, b) => b.at.localeCompare(a.at))
  const takenLogs = dayLogs.filter((l) => l.kind === 'taken')
  const upcoming = state.medications.filter((m) => !takenLogs.some((l) => l.medId === m.id))

  const recent = state.logs
    .filter((l) => l.kind === 'taken' && daysFromToday(l.date) <= 0 && daysFromToday(l.date) > -7)
    .sort((a, b) => (b.date + b.at).localeCompare(a.date + a.at))

  const medName = (id: string) => state.medications.find((m) => m.id === id)?.name ?? 'Medication'
  const openReminder = (medId: string) => {
    setReminderMed(medId)
    setSheet('reminder')
  }

  return (
    <Screen
      label="Medication schedule"
      className="bg-canvas"
      header={
        <ScreenHeader
          title="Medication"
          subtitle="Schedule and log"
          onBack={() => back()}
          trailing={
            <Button size="sm" variant="soft" icon={BellPlus} onClick={() => setSheet('add')}>
              Add reminder
            </Button>
          }
        />
      }
    >
      <div className="px-5 pb-8">
        {/* Date navigation */}
        <div className="flex items-center gap-2 rounded-[18px] bg-surface p-1.5 shadow-[var(--shadow-card)]">
          <IconButton icon={ChevronLeft} label="Previous day" tone="plain" disabled={offset <= -RANGE} onClick={() => setDate(addDays(date, -1))} />
          <div className="min-w-0 flex-1 text-center" aria-live="polite">
            <p className="text-body font-medium">{relativeDay(date)}</p>
            <p className="text-caption text-text-muted">{fmtDate(date)}</p>
          </div>
          <IconButton icon={ChevronRight} label="Next day" tone="plain" disabled={offset >= RANGE} onClick={() => setDate(addDays(date, 1))} />
        </div>
        {!isToday && (
          <div className="mt-2 flex justify-center">
            <Button size="sm" variant="ghost" onClick={() => setDate(TODAY)}>
              Back to today
            </Button>
          </div>
        )}

        {/* Upcoming */}
        {!(offset < 0) && (
          <section aria-labelledby="meds-upcoming">
            <SectionTitle id="meds-upcoming">Upcoming</SectionTitle>
            {upcoming.length === 0 ? (
              <Card>
                <EmptyState icon={CheckCircle2} title="Nothing else today" body="Everything scheduled for today has been logged." />
              </Card>
            ) : (
              <div className="flex flex-col gap-3">
                {upcoming.map((m) => {
                  const status = doseStatus(state, m.id, date)
                  return isToday ? (
                    <MedicationReminderCard
                      key={m.id}
                      name={m.name}
                      instruction={m.instruction}
                      prescribedBy={m.prescribedBy}
                      status={status}
                      onSet={() => openReminder(m.id)}
                      onTaken={() => markTaken(m.id)}
                      onSnooze={() => setSheet('snooze')}
                      onEdit={() => openReminder(m.id)}
                    />
                  ) : (
                    <MedicationReminderCard key={m.id} name={m.name} instruction={m.instruction} prescribedBy={m.prescribedBy} status={status} onSet={() => openReminder(m.id)} onEdit={() => openReminder(m.id)} />
                  )
                })}
                {isFuture && <p className="px-1 text-caption text-text-muted">You can log a dose on the day itself.</p>}
              </div>
            )}
          </section>
        )}

        {/* Logged */}
        {!isFuture && (
          <section aria-labelledby="meds-logged">
            <SectionTitle id="meds-logged">Logged</SectionTitle>
            {dayLogs.length === 0 ? (
              <Card>
                <EmptyState icon={History} title="Nothing logged" body={isToday ? 'When you mark a dose as taken, it appears here.' : 'Nothing was logged in Avela on this day. That doesn’t mean a dose was missed.'} />
              </Card>
            ) : (
              <Card className="p-2">
                <ul>
                  {dayLogs.map((l) => (
                    <li key={l.id} className="flex min-h-12 items-center gap-2.5 px-2 py-1.5">
                      <span className={`flex size-10 flex-none items-center justify-center rounded-full ${l.kind === 'taken' ? 'bg-success-soft text-success' : 'bg-warning-soft text-warning'}`} aria-hidden>
                        {l.kind === 'taken' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body font-medium">{medName(l.medId)}</span>
                        <span className="block text-callout text-text-muted">{l.kind === 'taken' ? `Taken at ${fmtTime(l.at)}` : `Snoozed ${l.minutes} min at ${fmtTime(l.at)}`}</span>
                      </span>
                      {isToday && l.kind === 'taken' && (
                        <Button size="sm" variant="ghost" onClick={() => undoTaken(l.id)}>
                          Undo
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </section>
        )}

        {/* Recent log */}
        <section aria-labelledby="meds-recent">
          <SectionTitle id="meds-recent">Last 7 days</SectionTitle>
          <Card>
            <ol className="grid grid-cols-7 gap-1" aria-label="Doses logged in the last 7 days">
              {Array.from({ length: 7 }, (_, i) => addDays(TODAY, i - 6)).map((d) => {
                const log = recent.find((l) => l.date === d)
                return (
                  <li key={d} className="flex flex-col items-center gap-1.5" aria-label={`${fmtDate(d)}: ${log ? `taken at ${fmtTime(log.at)}` : 'nothing logged'}`}>
                    <span className="text-[12px] font-medium text-text-muted">{relativeDay(d) === 'Today' ? 'Today' : fmtDate(d, { short: true }).split(',')[0]}</span>
                    <span className={`flex size-8 items-center justify-center rounded-full ${log ? 'bg-success text-white' : 'border border-dashed border-ink-200 text-text-subtle'}`} aria-hidden>
                      {log ? <CheckCircle2 size={16} /> : '–'}
                    </span>
                  </li>
                )
              })}
            </ol>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-caption text-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-success" aria-hidden /> Logged as taken
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-full border border-dashed border-ink-400" aria-hidden /> Nothing logged
              </span>
            </div>
            {recent.length > 0 && (
              <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-callout">
                {recent.slice(0, 4).map((l) => (
                  <li key={l.id} className="flex justify-between">
                    <span>{relativeDay(l.date)}</span>
                    <Badge tone="success">Taken {fmtTime(l.at)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <div className="mt-6">
          <Notice tone="info" icon={Info} title="About this schedule">
            Avela only records what you log. It never changes your dose or suggests an extra one. If you’re not sure whether you took a dose, check with your pharmacist or clinician. Notifications are simulated in this prototype.
          </Notice>
        </div>
      </div>

      <AddReminderSheet
        open={sheet === 'add'}
        onClose={() => setSheet(null)}
        onReviewExisting={(id) => openReminder(id)}
        onCreate={(id) => openReminder(id)}
      />
      <ReminderSheet open={sheet === 'reminder'} onClose={() => setSheet(null)} medId={reminderMed} />
      <SnoozeSheet open={sheet === 'snooze'} onClose={() => setSheet(null)} medId={reminderMed} />
    </Screen>
  )
}
