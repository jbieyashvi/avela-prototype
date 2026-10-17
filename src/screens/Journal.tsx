import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookHeart, ClipboardList, Pencil, Trash2 } from 'lucide-react'
import { Screen } from '../components/Chrome'
import { Card, SectionTitle } from '../components/Card'
import { Button, IconButton } from '../components/Button'
import { EmptyState } from '../components/Feedback'
import { TextArea } from '../components/Form'
import { EnergyScale, MoodScale } from '../components/Domain'
import { CheckInSheet } from '../components/Sheets'
import { Dialog } from '../components/Sheet'
import { ENERGY_LABELS, MOODS } from '../data/seed'
import { todaysEntry, upcomingAppointment, useStore } from '../state/store'
import type { JournalEntry, MoodLevel } from '../state/types'
import { fmtDate, fmtTime, relativeDay } from '../lib/time'

export function Journal() {
  const navigate = useNavigate()
  const { state, actions, showToast } = useStore()
  const today = todaysEntry(state)
  const appt = upcomingAppointment(state)
  const [mood, setMood] = useState<MoodLevel>()
  const [energy, setEnergy] = useState<MoodLevel>()
  const [note, setNote] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [toDelete, setToDelete] = useState<JournalEntry | null>(null)

  const entries = [...state.journal].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))

  const save = () => {
    if (!mood || !energy) return
    actions.saveCheckIn({ mood, energy, note: note.trim() })
    setMood(undefined)
    setEnergy(undefined)
    setNote('')
    showToast({ message: 'Check-in saved to your journal', tone: 'success' })
  }

  return (
    <Screen
      label="Journal"
      className="bg-canvas"
      header={
        <header className="flex-none bg-canvas px-5 pb-2 pt-[max(16px,env(safe-area-inset-top))]">
          <h1 className="text-title font-medium">Journal</h1>
          <p className="text-callout text-text-muted">Your own notes on how you’re feeling.</p>
        </header>
      }
    >
      <div className="px-5 pb-8 pt-3">
        {/* Check-in */}
        {today ? (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-caption font-medium text-text-muted">Today’s check-in</p>
                <p className="mt-1 text-headline font-medium">
                  {MOODS.find((m) => m.value === today.mood)?.emoji} {MOODS.find((m) => m.value === today.mood)?.label} · Energy {ENERGY_LABELS[today.energy - 1].toLowerCase()}
                </p>
                {today.note && <p className="mt-1 text-callout text-text-muted">“{today.note}”</p>}
              </div>
              <IconButton icon={Pencil} label="Edit today’s check-in" tone="plain" onClick={() => setEditOpen(true)} />
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-headline font-medium">How are you feeling today?</h2>
            <p className="mb-4 text-callout text-text-muted">A quick check-in, just for you.</p>
            <p className="mb-2 text-callout font-medium" id="j-mood">
              Mood
            </p>
            <MoodScale value={mood} onChange={setMood} />
            <p className="mb-2 mt-5 text-callout font-medium" id="j-energy">
              Energy
            </p>
            <EnergyScale value={energy} onChange={setEnergy} />
            <div className="mt-5">
              <TextArea label="Note (optional)" placeholder="Anything you want to remember…" value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} hint={`${note.length}/280`} rows={3} />
            </div>
            <Button block className="mt-4" disabled={!mood || !energy} onClick={save}>
              {!mood ? 'Choose a mood to continue' : !energy ? 'Set your energy to continue' : 'Save check-in'}
            </Button>
          </Card>
        )}

        {/* Prepare CTA */}
        <Card className="mt-4 bg-[linear-gradient(135deg,#2447d8,#6250d8)] text-white">
          <div className="flex items-start gap-3">
            <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-white/15" aria-hidden>
              <ClipboardList size={22} />
            </span>
            <div className="min-w-0">
              <h2 className="text-headline font-medium">Prepare for my visit</h2>
              <p className="text-callout text-white/85">
                {appt ? `Turn your entries and questions into notes for ${fmtDate(appt.date, { short: true })}.` : 'Turn your entries and questions into notes for your next visit.'}
              </p>
            </div>
          </div>
          <div className="on-dark mt-4">
            <Button variant="inverse" size="sm" onClick={() => navigate('/journal/prepare')}>
              {state.visitPrep.savedAt ? 'Review my visit notes' : 'Prepare for my visit'}
            </Button>
          </div>
        </Card>

        {/* Entries */}
        <SectionTitle>Recent entries</SectionTitle>
        {entries.length === 0 ? (
          <Card>
            <EmptyState icon={BookHeart} title="No entries yet" body="Your check-ins will appear here." />
          </Card>
        ) : (
          <ul className="flex flex-col gap-2">
            {entries.map((e) => {
              const m = MOODS.find((x) => x.value === e.mood)!
              return (
                <li key={e.id}>
                  <Card as="article">
                    <div className="flex items-start gap-3">
                      <span className="flex size-9 flex-none items-center justify-center rounded-full bg-lavender-50 text-[18px]" aria-hidden>
                        {m.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">
                          {m.label} · Energy {ENERGY_LABELS[e.energy - 1].toLowerCase()}
                        </p>
                        <p className="text-caption text-text-muted">
                          {relativeDay(e.date)} · {fmtTime(e.time)}
                        </p>
                        {e.note && <p className="mt-1.5 text-callout">{e.note}</p>}
                      </div>
                      <IconButton icon={Trash2} label={`Delete entry from ${fmtDate(e.date)}`} tone="plain" onClick={() => setToDelete(e)} />
                    </div>
                  </Card>
                </li>
              )
            })}
          </ul>
        )}
        <p className="mt-4 text-caption text-text-muted">Entries are what you report. Avela doesn’t score or interpret them.</p>
      </div>

      <CheckInSheet open={editOpen} onClose={() => setEditOpen(false)} />
      <Dialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete this entry?"
        tone="attention"
        actions={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setToDelete(null)}>
              Keep
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                if (toDelete) actions.deleteEntry(toDelete.id)
                setToDelete(null)
                showToast({ message: 'Entry deleted' })
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        {toDelete && `Your ${fmtDate(toDelete.date, { short: true })} check-in will be removed from your journal and visit notes.`}
      </Dialog>
    </Screen>
  )
}
