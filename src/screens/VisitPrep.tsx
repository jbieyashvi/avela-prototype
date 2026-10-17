import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Check, CheckCircle2, Plus, RefreshCw, Send, Sparkles, X } from 'lucide-react'
import { Screen, ScreenHeader } from '../components/Chrome'
import { Badge, Card, SectionTitle } from '../components/Card'
import { Button, IconButton } from '../components/Button'
import { Notice, Skeleton } from '../components/Feedback'
import { ChoiceCard, Switch } from '../components/Form'
import { Dialog, Sheet } from '../components/Sheet'
import { MOODS } from '../data/seed'
import { upcomingAppointment, useStore } from '../state/store'
import { buildDraft, entriesSinceLastVisit, visitSummary } from '../lib/visitPrep'
import { fmtDate, fmtTime, relativeDay } from '../lib/time'
import { cx } from '../lib/cx'
import { useBack } from '../lib/useBack'

export function VisitPrep() {
  const back = useBack('/journal')
  const { state, actions, showToast } = useStore()
  const appt = upcomingAppointment(state)
  const prep = state.visitPrep
  const { summary, topics: suggested, count } = useMemo(() => visitSummary(state), [state])
  const entries = entriesSinceLastVisit(state).slice().reverse()

  const [loading, setLoading] = useState(true)
  const [topics, setTopics] = useState<string[]>(prep.topics.length ? prep.topics : suggested.slice(0, 2))
  const [questions, setQuestions] = useState<string[]>(prep.questions)
  const [newQ, setNewQ] = useState('')
  const [draft, setDraft] = useState(prep.draft)
  const [dirty, setDirty] = useState(false)
  const [confirmSave, setConfirmSave] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), 800)
    return () => window.clearTimeout(id)
  }, [])

  const prepTask = state.tasks.find((t) => t.link === 'visit-prep')
  const allTopics = Array.from(new Set([...suggested, ...topics]))

  const toggleTopic = (t: string) => {
    setTopics((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]))
    setDirty(true)
  }
  const addQ = (e: FormEvent) => {
    e.preventDefault()
    const q = newQ.trim()
    if (!q) return
    setQuestions((qs) => [...qs, q.endsWith('?') ? q : `${q}?`])
    setNewQ('')
    setDirty(true)
  }
  const generate = () => {
    setDraft(buildDraft(state, topics, questions))
    setDirty(true)
  }
  const save = () => {
    actions.updateVisitPrep({ topics, questions, draft, savedAt: new Date().toISOString() })
    setDirty(false)
    setConfirmSave(false)
    showToast({ message: 'Visit notes saved', tone: 'success' })
  }

  return (
    <Screen
      label="Prepare for my visit"
      className="bg-canvas"
      header={<ScreenHeader title="Prepare for my visit" subtitle={appt ? `${appt.kind} · ${fmtDate(appt.date, { short: true })}, ${fmtTime(appt.time)}` : 'Next visit'} onBack={() => back()} />}
      footer={
        !loading && (
          <div className="flex-none border-t border-border bg-surface px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" icon={Send} disabled={!prep.savedAt || dirty} onClick={() => setShareOpen(true)}>
                Share
              </Button>
              <Button className="flex-[1.4]" disabled={!draft.trim() || (!dirty && !!prep.savedAt)} onClick={() => setConfirmSave(true)}>
                {prep.savedAt && !dirty ? 'Saved' : 'Review & save'}
              </Button>
            </div>
            {!prep.savedAt && <p className="mt-2 text-center text-caption text-text-muted">Save your notes before sharing them.</p>}
          </div>
        )
      }
    >
      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label="Gathering your entries">
            <p className="text-callout text-text-muted">Gathering your journal entries…</p>
            <Skeleton className="h-28 rounded-[18px]" />
            <Skeleton className="h-16 rounded-[18px]" />
            <Skeleton className="h-40 rounded-[18px]" />
          </div>
        ) : (
          <div className="animate-fade-in">
            {prep.savedAt && !dirty && (
              <Notice tone="success" icon={CheckCircle2} title="Notes saved" action={prepTask && !prepTask.done ? <Button size="sm" variant="secondary" icon={Check} onClick={() => (actions.setTaskDone(prepTask.id, true), showToast({ message: 'Task marked as done', tone: 'success' }))}>Mark “{prepTask.title}” done</Button> : undefined}>
                {prep.sharedAt ? `Shared with ${prep.sharedWith} (simulated).` : 'You can share them before your visit.'}
              </Notice>
            )}

            {/* Summary */}
            <SectionTitle>Based on your entries</SectionTitle>
            <Card>
              <p className="text-body">{summary}</p>
              {count > 0 && (
                <ul className="mt-4 flex flex-col gap-2 border-t border-border pt-3" aria-label="Your entries">
                  {entries.map((e) => (
                    <li key={e.id} className="flex gap-2 text-callout">
                      <span aria-hidden>{MOODS.find((m) => m.value === e.mood)?.emoji}</span>
                      <span className="min-w-0">
                        <span className="font-medium">{relativeDay(e.date)}</span>
                        {e.note ? <span className="text-text-muted"> — “{e.note}”</span> : <span className="text-text-subtle"> — no note</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-caption text-text-muted">This only restates what you wrote. It isn’t a diagnosis or assessment.</p>
            </Card>

            {/* Topics */}
            <SectionTitle>Topics to discuss</SectionTitle>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Topics to discuss">
              {allTopics.map((t) => {
                const on = topics.includes(t)
                return (
                  <button key={t} aria-pressed={on} onClick={() => toggleTopic(t)} className={cx('inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-callout font-medium transition-colors duration-150', on ? 'border-action bg-action-soft text-action-hover' : 'border-border bg-surface hover:bg-surface-muted')}>
                    {on ? <Check size={15} aria-hidden /> : <Plus size={15} aria-hidden />}
                    {t}
                  </button>
                )
              })}
            </div>

            {/* Questions */}
            <SectionTitle>My questions</SectionTitle>
            <Card className="p-2">
              {questions.length === 0 && <p className="px-2 py-3 text-callout text-text-muted">No questions yet. Add one below.</p>}
              <ol>
                {questions.map((q, i) => (
                  <li key={`${q}-${i}`} className="flex min-h-12 items-center gap-2 px-2">
                    <span className="flex size-6 flex-none items-center justify-center rounded-full bg-lavender-50 text-caption font-medium text-text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 py-2 text-body">{q}</span>
                    <IconButton icon={X} label={`Remove question: ${q}`} tone="plain" onClick={() => (setQuestions((qs) => qs.filter((_, j) => j !== i)), setDirty(true))} />
                  </li>
                ))}
              </ol>
              <form onSubmit={addQ} className="mt-1 flex items-center gap-2 border-t border-border px-2 pt-2">
                <label htmlFor="new-q" className="sr-only">
                  Add a question
                </label>
                <input id="new-q" value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Add a question…" maxLength={160} className="min-h-11 min-w-0 flex-1 rounded-[12px] bg-transparent px-1 text-body placeholder:text-text-subtle focus:outline-none" />
                <Button size="sm" variant="soft" type="submit" disabled={!newQ.trim()}>
                  Add
                </Button>
              </form>
            </Card>

            {/* Draft */}
            <SectionTitle action={draft && <Button size="sm" variant="ghost" icon={RefreshCw} onClick={generate}>Rebuild</Button>}>Visit notes draft</SectionTitle>
            {draft ? (
              <Card className="p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <Badge tone="violet" icon={Sparkles}>
                    Based on your entries
                  </Badge>
                  <span className="text-caption text-text-muted">Editable</span>
                </div>
                <label htmlFor="draft" className="sr-only">
                  Visit notes draft
                </label>
                <textarea
                  id="draft"
                  value={draft}
                  onChange={(e) => (setDraft(e.target.value), setDirty(true))}
                  rows={14}
                  className="w-full resize-y rounded-[14px] border border-border bg-surface-muted p-3 font-sans text-callout leading-[21px] focus:border-action focus:outline-none focus:ring-4 focus:ring-action/15"
                />
              </Card>
            ) : (
              <Card>
                <p className="text-callout text-text-muted">Avela will combine your entries, topics and questions into notes you can edit.</p>
                <Button className="mt-3" icon={Sparkles} onClick={generate}>
                  Create draft
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>

      <Dialog
        open={confirmSave}
        onClose={() => setConfirmSave(false)}
        title="Save these visit notes?"
        actions={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmSave(false)}>
              Keep editing
            </Button>
            <Button className="flex-1" onClick={save}>
              Save notes
            </Button>
          </>
        }
      >
        {topics.length} topic{topics.length === 1 ? '' : 's'} and {questions.length} question{questions.length === 1 ? '' : 's'}. Notes stay on this device until you choose to share them.
      </Dialog>

      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} draft={prep.draft} />
    </Screen>
  )
}

const RECIPIENTS = [
  { id: 'dr', name: 'Dr Erica Morgan', body: 'Via Riverside Health Clinic messages' },
  { id: 'maya', name: 'Maya Smith', body: 'Sister · support contact' },
]

function ShareSheet({ open, onClose, draft }: { open: boolean; onClose: () => void; draft: string }) {
  const { actions, showToast } = useStore()
  const [to, setTo] = useState(RECIPIENTS[0].id)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [step, setStep] = useState<'choose' | 'review'>('choose')
  useEffect(() => {
    if (open) setStep('choose')
  }, [open])
  const recipient = RECIPIENTS.find((r) => r.id === to)!
  // Optionally strip journal quotes; questions and topics always included.
  const content = includeNotes ? draft : draft.replace(/From my journal:\n[^\n]*\n\n/, '')

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={step === 'choose' ? 'Share visit notes' : 'Review before sharing'}
      description={step === 'choose' ? 'Sharing is simulated — nothing leaves this device.' : `To ${recipient.name}`}
      footer={
        step === 'choose' ? (
          <Button block onClick={() => setStep('review')}>
            Review what’s shared
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('choose')}>
              Back
            </Button>
            <Button
              className="flex-[1.4]"
              icon={Send}
              onClick={() => {
                actions.updateVisitPrep({ sharedAt: new Date().toISOString(), sharedWith: recipient.name })
                showToast({ message: `Shared with ${recipient.name} (simulated)`, tone: 'success' })
                onClose()
              }}
            >
              Share notes
            </Button>
          </div>
        )
      }
    >
      {step === 'choose' ? (
        <div className="flex flex-col gap-3">
          <div role="radiogroup" aria-label="Recipient" className="flex flex-col gap-2">
            {RECIPIENTS.map((r) => (
              <ChoiceCard key={r.id} selected={to === r.id} onSelect={() => setTo(r.id)} title={r.name} body={r.body} />
            ))}
          </div>
          <Switch checked={includeNotes} onChange={setIncludeNotes} label="Include journal summary" description="Topics and questions are always included." />
        </div>
      ) : (
        <pre className="max-h-[50vh] overflow-auto whitespace-pre-wrap rounded-[14px] bg-lavender-50 p-3 font-sans text-callout">{content}</pre>
      )}
    </Sheet>
  )
}
