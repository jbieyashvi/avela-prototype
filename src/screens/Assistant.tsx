import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BellRing, CalendarCheck2, CalendarClock, ChevronRight, ClipboardPlus, NotebookPen, RotateCcw, X } from 'lucide-react'
import { Composer, Screen } from '../components/Chrome'
import { Orb } from '../components/Orb'
import { Button, IconButton } from '../components/Button'
import { ActionReviewCard, AppointmentSummary } from '../components/Domain'
import { ReminderSheet } from '../components/Sheets'
import { useStore, doctorById, upcomingAppointment } from '../state/store'
import { SUGGESTED_PROMPTS, nextSlots, respond, say, type EngineContext } from '../lib/assistant'
import { visitSummary } from '../lib/visitPrep'
import { uid } from '../state/store'
import { fmtDate, fmtTime, relativeDay } from '../lib/time'
import type { ChatCard, ChatMessage } from '../state/types'
import { cx } from '../lib/cx'

const ACTIONS = [
  { icon: CalendarClock, tone: 'bg-royal-100 text-royal-500', title: 'Book an appointment', body: 'Follow-up with Dr Erica Morgan', prompt: 'Book my follow-up appointment.' },
  { icon: BellRing, tone: 'bg-coral-100 text-coral-700', title: 'Set a medication reminder', body: 'For Medication A in your care plan', prompt: 'Set a medication reminder.' },
  { icon: ClipboardPlus, tone: 'bg-[#e3f8fd] text-[#0e7f99]', title: 'Add a care task', body: 'Prescriptions, tests, to-dos', prompt: 'Add a care task.' },
]

export function Assistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params, setParams] = useSearchParams()
  const { state, actions } = useStore()
  const [ctx, setCtx] = useState<EngineContext>({})
  const [typing, setTyping] = useState(false)
  const [editReminder, setEditReminder] = useState<{ msgId: string; time: string } | null>(null)
  const scroller = useRef<HTMLElement | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const chat = state.chat

  const send = (text: string) => {
    const userMsg: ChatMessage = { id: uid('m'), role: 'user', text }
    actions.appendChat(userMsg)
    setTyping(true)
    window.setTimeout(() => {
      const { replies, ctx: next } = respond(text, stateRef.current, ctxRef.current)
      setCtx(next)
      setTyping(false)
      actions.appendChat(...replies)
    }, 650)
  }

  // Prompt handed over from Home / Voice / demo navigator (once per navigation)
  const handledKey = useRef<string | null>(null)
  useEffect(() => {
    if (handledKey.current === location.key) return
    const prompt = (location.state as { prompt?: string } | null)?.prompt ?? params.get('prompt')
    const fresh = params.get('fresh')
    if (!prompt && !fresh) return
    handledKey.current = location.key
    if (fresh) {
      actions.clearChat()
      ctxRef.current = {}
      setCtx({})
    }
    setParams({}, { replace: true, state: null })
    if (prompt) window.setTimeout(() => send(prompt), 50)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  useEffect(() => {
    const el = scroller.current
    if (el && (chat.length || typing)) el.scrollTo({ top: el.scrollHeight, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }, [chat.length, typing])

  const update = (id: string, card: ChatCard) => actions.updateCard(id, card)
  const reply = (text: string, card?: ChatCard) => actions.appendChat(say(text, card))

  return (
    <Screen
      label="Assistant"
      className="bg-[linear-gradient(180deg,#e6e7fb_0%,#f1f1fa_220px)]"
      header={
        <header className="flex min-h-14 flex-none items-center gap-1.5 px-2 pt-[env(safe-area-inset-top)]">
          <IconButton icon={ArrowLeft} label="Back to Today" tone="plain" onClick={() => navigate('/')} />
          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {chat.length > 0 && (
              <>
                <Orb size={22} state={typing ? 'processing' : 'idle'} />
                <span className="text-callout font-medium">Avela</span>
              </>
            )}
          </div>
          {chat.length > 0 ? (
            <IconButton icon={RotateCcw} label="Start a new conversation" tone="plain" onClick={() => (actions.clearChat(), setCtx({}))} />
          ) : (
            <IconButton icon={X} label="Close assistant" tone="plain" onClick={() => navigate('/')} />
          )}
        </header>
      }
      scrollClassName="px-4"
      footer={
        <div className="flex-none bg-[#f1f1fa] px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2">
          <Composer onSend={send} onVoice={() => navigate('/voice')} placeholder="Ask anything about your care…" disabled={typing} />
          <p className="mt-1.5 text-center text-micro text-text-muted">Avela organises your info. It doesn’t give medical advice.</p>
        </div>
      }
    >
      <div ref={(el) => void (scroller.current = el?.parentElement ?? null)} />
      {chat.length === 0 ? (
        <div className="flex flex-col pb-5 pt-3">
          <Orb size={44} />
          <h1 className="mt-4 text-[26px] font-medium leading-[33px] tracking-[-0.01em]">
            Hey, Eva!
            <br />
            How can I <span className="text-action">help you?</span>
          </h1>
          <p className="mb-2.5 mt-6 text-caption font-medium text-text-muted">Things you can do</p>
          <ul className="flex flex-col gap-2">
            {ACTIONS.map((a) => (
              <li key={a.title}>
                <button onClick={() => send(a.prompt)} className="flex min-h-[70px] w-full items-center gap-3 rounded-[16px] bg-surface px-3.5 py-3 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-surface-muted">
                  <span className={cx('flex size-9 flex-none items-center justify-center rounded-[10px]', a.tone)} aria-hidden>
                    <a.icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-headline font-medium">{a.title}</span>
                    <span className="block text-caption text-text-muted">{a.body}</span>
                  </span>
                  <ChevronRight size={16} className="flex-none text-text-subtle" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <p className="mb-1 mt-5 text-caption font-medium text-text-muted">Try asking</p>
          <div className="-mx-1 flex flex-wrap">
            {SUGGESTED_PROMPTS.map((p) => (
              <button key={p} onClick={() => send(p)} className="group flex min-h-11 items-center px-1 text-left">
                <span className="rounded-full bg-white/70 px-3 py-1.5 text-caption font-medium text-text ring-1 ring-black/[0.04] group-hover:bg-white group-hover:ring-action/40">{p}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ol className="flex flex-col gap-3.5 pb-4 pt-1" aria-live="polite">
          {chat.map((m) => (
            <li key={m.id} className={cx('flex animate-rise flex-col', m.role === 'user' ? 'items-end' : 'items-start')}>
              {m.role === 'user' ? (
                <p className="max-w-[82%] rounded-[18px] rounded-br-[6px] bg-action px-3.5 py-2 text-callout text-white">{m.text}</p>
              ) : (
                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Orb size={22} className="mt-0.5" />
                    <p className="max-w-[88%] text-callout leading-5 text-text">{m.text}</p>
                  </div>
                  {m.card && (
                    <div className="pl-[30px]">
                      <CardView msg={m} card={m.card} send={send} update={update} reply={reply} onEditReminder={(time) => setEditReminder({ msgId: m.id, time })} />
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
          {typing && (
            <li className="flex items-center gap-2.5" aria-label="Avela is preparing a reply">
              <Orb size={22} state="processing" />
              <span className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-pulse rounded-full bg-ink-400" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </span>
            </li>
          )}
        </ol>
      )}
      <ReminderSheet
        open={!!editReminder}
        initialTime={editReminder?.time}
        onClose={() => setEditReminder(null)}
        onSaved={(time) => {
          if (editReminder) {
            const msg = chat.find((x) => x.id === editReminder.msgId)
            if (msg?.card?.type === 'reminder-review') update(msg.id, { ...msg.card, time, status: 'confirmed' })
          }
          reply(`Your daily ${fmtTime(time)} reminder for Medication A is set. You’ll see it on Today and in your medication schedule.`)
        }}
      />
    </Screen>
  )
}

/* ── Card renderer ─────────────────────────────────────────── */

function CardView({
  msg,
  card,
  send,
  update,
  reply,
  onEditReminder,
}: {
  msg: ChatMessage
  card: ChatCard
  send: (t: string) => void
  update: (id: string, c: ChatCard) => void
  reply: (t: string, c?: ChatCard) => void
  onEditReminder: (time: string) => void
}) {
  const { state, actions } = useStore()
  const navigate = useNavigate()

  switch (card.type) {
    case 'suggestions':
      return (
        <div className="flex flex-wrap gap-2">
          {card.options.map((o) => (
            <button key={o} onClick={() => send(o)} className="min-h-11 rounded-full bg-surface px-3.5 py-2 text-left text-caption font-medium shadow-[var(--shadow-card)] ring-1 ring-black/[0.03] hover:ring-action/40">
              {o}
            </button>
          ))}
        </div>
      )

    case 'reminder-review': {
      const med = state.medications.find((m) => m.id === card.medId)!
      return (
        <ActionReviewCard
          icon={BellRing}
          question={card.replacing ? 'Change this reminder?' : 'Set this reminder?'}
          title={med.name}
          details={
            <>
              One tablet · Daily at {fmtTime(card.time)}
              {card.replacing && <span className="block">Replaces your {fmtTime(card.replacing)} reminder</span>}
            </>
          }
          note="Dose and instructions come from your care plan and can’t be changed here."
          confirmLabel={card.replacing ? 'Confirm change' : 'Confirm reminder'}
          status={card.status}
          confirmedText={`Reminder set · Daily at ${fmtTime(card.time)}`}
          onConfirm={() => {
            actions.setReminder(card.medId, card.time)
            update(msg.id, { ...card, status: 'confirmed' })
            reply(`Your daily ${fmtTime(card.time)} reminder for ${med.name} is set. You’ll see it on Today and in your medication schedule.`)
          }}
          onEdit={() => onEditReminder(card.time)}
          onCancel={() => {
            update(msg.id, { ...card, status: 'cancelled' })
            reply('Okay, I didn’t set a reminder.')
          }}
        />
      )
    }

    case 'reminder-existing': {
      const current = state.reminders.find((r) => r.medId === card.medId)
      return (
        <div className="rounded-[var(--radius-card)] bg-surface p-3.5 shadow-[var(--shadow-card)]">
          <p className="text-headline font-medium">Medication A</p>
          <p className="text-caption text-text-muted">One tablet · Daily at {fmtTime(current?.time ?? card.time)}</p>
          <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
            <Button size="sm" variant="secondary" onClick={() => navigate('/care/medications')}>
              Open schedule
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onEditReminder(current?.time ?? card.time)}>
              Change time
            </Button>
          </div>
        </div>
      )
    }

    case 'appointment-current': {
      const appt = state.appointments.find((a) => a.id === card.apptId) ?? upcomingAppointment(state)
      if (!appt) return null
      return (
        <div className="rounded-[var(--radius-card)] bg-surface p-3.5 shadow-[var(--shadow-card)]">
          <AppointmentSummary appt={appt} doctor={doctorById(state, appt.doctorId)} />
          {card.status === 'pending' ? (
            <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  update(msg.id, { ...card, status: 'kept' })
                  reply(`Great — you’re all set for ${relativeDay(appt.date) === 'Today' ? 'today' : fmtDate(appt.date)} at ${fmtTime(appt.time)}.`)
                }}
              >
                Keep this time
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  update(msg.id, { ...card, status: 'changing' })
                  reply('Here are other available times with Dr Erica Morgan. Choosing one won’t change anything until you confirm.', {
                    type: 'slot-picker',
                    options: nextSlots(state, { date: appt.date, time: appt.time }),
                    status: 'pending',
                  })
                }}
              >
                Choose another time
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-callout text-text-muted">{card.status === 'kept' ? 'Kept current appointment.' : 'Looking at other times…'}</p>
          )}
        </div>
      )
    }

    case 'slot-picker': {
      const current = upcomingAppointment(state)
      const options = card.options.filter((o) => !state.takenSlots.includes(`${o.date}|${o.time}`))
      return (
        <div className="rounded-[var(--radius-card)] bg-surface p-2 shadow-[var(--shadow-card)]">
          <ul className="flex flex-col gap-1.5">
            {options.map((o) => (
              <li key={`${o.date}${o.time}`}>
                <button
                  disabled={card.status !== 'pending'}
                  onClick={() => {
                    update(msg.id, { ...card, status: 'chosen' })
                    reply('Review the change:', {
                      type: 'appointment-review',
                      slot: o,
                      visitType: current?.visitType ?? 'in-person',
                      replacing: current ? { date: current.date, time: current.time } : undefined,
                      status: 'pending',
                    })
                  }}
                  className="flex min-h-11 w-full items-center justify-between rounded-[12px] px-2.5 text-left text-callout font-medium enabled:hover:bg-action-soft disabled:text-text-muted"
                >
                  {fmtDate(o.date, { short: true })} · {fmtTime(o.time)}
                  <ChevronRight size={16} className="text-text-muted" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" block className="mt-1" onClick={() => navigate('/care/book')}>
            See all times
          </Button>
        </div>
      )
    }

    case 'appointment-review': {
      const current = upcomingAppointment(state)
      return (
        <ActionReviewCard
          icon={CalendarCheck2}
          question={card.replacing ? 'Reschedule your follow-up?' : 'Book this appointment?'}
          title="Dr Erica Morgan"
          details={
            <>
              {fmtDate(card.slot.date)} · {fmtTime(card.slot.time)}
              <span className="block">{card.visitType === 'video' ? 'Video follow-up' : 'In-person follow-up · Riverside Health Clinic'}</span>
            </>
          }
          note={card.replacing && card.status === 'pending' ? <span className="font-medium text-attention-text">This replaces your appointment on {fmtDate(card.replacing.date, { short: true })} at {fmtTime(card.replacing.time)}.</span> : undefined}
          confirmLabel={card.replacing ? 'Confirm reschedule' : 'Confirm booking'}
          status={card.status}
          confirmedText="Appointment updated"
          cancelledText={card.status === 'unavailable' ? 'That time is no longer available.' : 'Cancelled — your appointment is unchanged.'}
          onConfirm={() => {
            const result = actions.book(card.slot, card.visitType, current?.reason ?? 'Review how the care plan is going')
            if (!result.ok) {
              update(msg.id, { ...card, status: 'unavailable' })
              reply('Sorry — that time was just taken by someone else. Your current appointment hasn’t changed. Here are other times:', {
                type: 'slot-picker',
                options: nextSlots(stateRefSafe(state, card.slot), current ? { date: current.date, time: current.time } : undefined),
                status: 'pending',
              })
              return
            }
            update(msg.id, { ...card, status: 'confirmed' })
            reply(`Done — your follow-up is now ${fmtDate(card.slot.date)} at ${fmtTime(card.slot.time)}.${result.replaced ? ` Your previous time (${fmtDate(result.replaced.date, { short: true })}, ${fmtTime(result.replaced.time)}) has been released.` : ''}`)
          }}
          onEdit={() => navigate('/care/book')}
          editLabel="Change details"
          onCancel={() => {
            update(msg.id, { ...card, status: 'cancelled' })
            reply('Okay — your appointment is unchanged.')
          }}
        />
      )
    }

    case 'task-review':
      return (
        <ActionReviewCard
          icon={ClipboardPlus}
          question="Add this task?"
          title={card.title}
          details={card.due ? `Due ${fmtDate(card.due, { short: true })}` : 'No due date'}
          confirmLabel="Add task"
          status={card.status}
          confirmedText="Added to your care tasks"
          onConfirm={() => {
            actions.addTask(card.title, card.due)
            update(msg.id, { ...card, status: 'confirmed' })
            reply(`Added “${card.title}” to your care tasks.`)
          }}
          onCancel={() => {
            update(msg.id, { ...card, status: 'cancelled' })
            reply('Okay, nothing was added.')
          }}
        />
      )

    case 'task-duplicate': {
      const task = state.tasks.find((t) => t.id === card.taskId)
      return (
        <div className="rounded-[var(--radius-card)] bg-surface p-3.5 shadow-[var(--shadow-card)]">
          <p className="text-headline font-medium">{task?.title ?? card.title}</p>
          <p className="text-caption text-text-muted">{task?.done ? 'Marked done' : task?.due ? `Due ${relativeDay(task.due)}` : 'Open · no due date'}</p>
          {card.status === 'pending' ? (
            <div className="mt-3 flex flex-wrap gap-x-2 gap-y-3">
              {task?.done ? (
                <Button
                  size="sm"
                  onClick={() => {
                    actions.setTaskDone(task.id, false)
                    update(msg.id, { ...card, status: 'resolved' })
                    reply(`Reopened “${task.title}”.`)
                  }}
                >
                  Reopen task
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    update(msg.id, { ...card, status: 'resolved' })
                    reply('Okay, I’ll keep the existing task. You can find it on Today.')
                  }}
                >
                  Keep existing
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  update(msg.id, { ...card, status: 'resolved' })
                  reply('Add this as a separate task?', { type: 'task-review', title: card.candidate, status: 'pending' })
                }}
              >
                Add as a new task
              </Button>
            </div>
          ) : (
            <p className="mt-2 text-callout text-text-muted">Resolved</p>
          )}
        </div>
      )
    }

    case 'visit-summary': {
      const s = visitSummary(state)
      return (
        <div className="rounded-[var(--radius-card)] bg-surface p-3.5 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-caption font-medium text-action-hover">
            <NotebookPen size={14} aria-hidden /> Based on your entries
          </div>
          <p className="mt-1.5 text-callout">{s.summary}</p>
          {s.topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {s.topics.slice(0, 3).map((t) => (
                <span key={t} className="rounded-full bg-lavender-50 px-2.5 py-0.5 text-micro font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2.5 text-caption text-text-muted">{state.visitPrep.questions.length} questions ready to review.</p>
          <Button size="sm" className="mt-3" onClick={() => navigate('/journal/prepare')}>
            Review & edit draft
          </Button>
        </div>
      )
    }

    case 'question-add':
      return (
        <ActionReviewCard
          icon={NotebookPen}
          question="Add to your visit questions?"
          title={card.question}
          details="For your follow-up with Dr Erica Morgan"
          confirmLabel="Add question"
          status={card.status}
          confirmedText="Added to your visit questions"
          onConfirm={() => {
            actions.addQuestion(card.question)
            update(msg.id, { ...card, status: 'confirmed' })
            reply('Added. You can review it in Journal → Prepare for my visit.')
          }}
          onCancel={() => update(msg.id, { ...card, status: 'cancelled' })}
          cancelledText="Not added."
        />
      )
  }
}

/** After a slot fails, exclude it from the next suggestions even before state re-renders. */
function stateRefSafe(state: ReturnType<typeof useStore>['state'], failed: { date: string; time: string }) {
  return { ...state, takenSlots: [...state.takenSlots, `${failed.date}|${failed.time}`] }
}
