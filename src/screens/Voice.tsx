import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BellRing, Keyboard, Mic, MicOff, Pause, Play, RotateCcw, Sparkles, X } from 'lucide-react'
import { Orb, type OrbState } from '../components/Orb'
import { Button, IconButton } from '../components/Button'
import { ActionReviewCard } from '../components/Domain'
import { useStore } from '../state/store'
import { fmtTime, fmtTimeShort, parseTime } from '../lib/time'
import { cx } from '../lib/cx'
import { useBack } from '../lib/useBack'

type Phase = 'intro' | 'listening' | 'processing' | 'speaking' | 'paused' | 'review' | 'ready' | 'done' | 'handoff' | 'error'
type ErrorKind = 'denied' | 'unsupported' | 'no-speech' | 'no-mic' | 'generic'
interface Line {
  id: number
  role: 'user' | 'assistant'
  text: string
  partial?: boolean
}

const ERRORS: Record<ErrorKind, { title: string; body: string }> = {
  denied: { title: 'Microphone access is off', body: 'Allow microphone access in your browser settings, or try the demo voice instead.' },
  unsupported: { title: 'Voice input isn’t supported here', body: 'This browser doesn’t support speech recognition. The demo voice shows the full experience.' },
  'no-speech': { title: 'I didn’t hear anything', body: 'Check your microphone and try again when you’re ready.' },
  'no-mic': { title: 'No microphone found', body: 'Connect a microphone, or try the demo voice instead.' },
  generic: { title: 'Something went wrong', body: 'Voice input stopped unexpectedly. Try again, or use the demo voice.' },
}

const STATE_LABEL: Partial<Record<Phase, string>> = {
  intro: 'Ready when you are',
  ready: 'Tap the microphone to speak',
  listening: 'Listening…',
  processing: 'Thinking…',
  speaking: 'Speaking',
  paused: 'Paused',
  review: 'Waiting for your confirmation',
  done: 'All done',
  handoff: 'Continue in chat',
}

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  continuous: boolean
  start: () => void
  abort: () => void
  stop: () => void
  onstart: (() => void) | null
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

class Cancelled extends Error {}

export function Voice() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const back = useBack('/')
  const { state, actions } = useStore()
  const [phase, setPhase] = useState<Phase>('intro')
  const [error, setError] = useState<ErrorKind | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [mode, setMode] = useState<'demo' | 'mic' | null>(null)
  const [pendingTime, setPendingTime] = useState<string | null>(null)
  const [handoffText, setHandoffText] = useState('')

  const token = useRef(0)
  const paused = useRef(false)
  const lineId = useRef(0)
  const recognition = useRef<SpeechRecognitionLike | null>(null)
  const awaitingTime = useRef(false)
  const transcriptEnd = useRef<HTMLDivElement>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const readAloud = state.settings.readAloud && typeof window !== 'undefined' && 'speechSynthesis' in window

  const med = state.medications[0]
  const existing = state.reminders.find((r) => r.medId === med.id)

  /* ── helpers ─────────────────────────────────────────────── */

  const stopMic = useCallback(() => {
    const r = recognition.current
    recognition.current = null
    if (r) {
      r.onend = null
      r.onerror = null
      r.onresult = null
      try {
        r.abort()
      } catch {
        /* already stopped */
      }
    }
  }, [])

  const cancelAll = useCallback(() => {
    token.current++
    paused.current = false
    stopMic()
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [stopMic])

  useEffect(() => cancelAll, [cancelAll]) // stop mic + speech when leaving voice mode

  useEffect(() => {
    transcriptEnd.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    // The orb shrinks over 300ms when the review card appears; settle the scroll after it.
    const t = window.setTimeout(() => transcriptEnd.current?.scrollIntoView({ block: 'end' }), 360)
    return () => window.clearTimeout(t)
  }, [lines, phase])

  const wait = (ms: number, t: number) =>
    new Promise<void>((resolve, reject) => {
      // Count real elapsed time (not ticks) so throttled background tabs stay on schedule.
      let left = ms
      let last = performance.now()
      const tick = () => {
        if (t !== token.current) return reject(new Cancelled())
        const now = performance.now()
        if (!paused.current) left -= now - last
        last = now
        if (left <= 0) resolve()
        else window.setTimeout(tick, Math.min(50, left))
      }
      tick()
    })

  const pushLine = (role: Line['role'], text: string, partial = false) => {
    const id = ++lineId.current
    setLines((ls) => [...ls, { id, role, text, partial }])
    return id
  }
  const setLine = (id: number, text: string, partial: boolean) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, text, partial } : l)))

  async function userSays(text: string, t: number) {
    setPhase('listening')
    await wait(500, t)
    const words = text.split(' ')
    const id = pushLine('user', '', true)
    for (let i = 1; i <= words.length; i++) {
      setLine(id, words.slice(0, i).join(' '), i < words.length)
      await wait(240, t)
    }
    await wait(350, t)
  }

  async function avelaSays(text: string, t: number) {
    setPhase('processing')
    await wait(900, t)
    setPhase('speaking')
    if (readAloud) {
      window.speechSynthesis.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-GB'
      window.speechSynthesis.speak(u)
    }
    const words = text.split(' ')
    const id = pushLine('assistant', '', true)
    for (let i = 1; i <= words.length; i++) {
      setLine(id, words.slice(0, i).join(' '), i < words.length)
      await wait(200, t)
    }
    await wait(300, t)
  }

  /* ── reminder flow (shared by demo + mic) ───────────────── */

  async function proposeReminder(time: string, t: number) {
    const current = stateRef.current.reminders.find((r) => r.medId === med.id)
    if (current && current.time === time) {
      await avelaSays(`You already have a daily ${fmtTimeShort(time)} reminder for ${med.name}, so I won’t add another.`, t)
      setPendingTime(null)
      setPhase('done')
      return
    }
    await avelaSays(current ? `${med.name} is currently at ${fmtTimeShort(current.time)}. Should I move it to ${fmtTimeShort(time)}?` : `Here’s a daily reminder for ${med.name}. Should I set it?`, t)
    setPendingTime(time)
    setPhase('review')
  }

  /* ── demo voice ─────────────────────────────────────────── */

  async function runDemo() {
    cancelAll()
    const t = token.current
    setMode('demo')
    setError(null)
    setLines([])
    setPendingTime(null)
    try {
      await userSays('Remind me to take my medication every evening.', t)
      await avelaSays('What time would you like the reminder?', t)
      await userSays('Eight PM.', t)
      await proposeReminder('20:00', t)
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e
    }
  }

  /* ── real microphone (explicit tap only) ────────────────── */

  function startMic() {
    const Ctor = getRecognitionCtor()
    setMode('mic')
    setError(null)
    if (!Ctor) {
      setError('unsupported')
      setPhase('error')
      return
    }
    cancelAll()
    const t = token.current
    const rec = new Ctor()
    rec.lang = 'en-GB'
    rec.interimResults = true
    rec.continuous = false
    let lineRef: number | null = null
    let finalText = ''
    rec.onstart = () => setPhase('listening')
    rec.onresult = (e) => {
      let text = ''
      let isFinal = false
      for (let i = 0; i < e.results.length; i++) {
        text += e.results[i][0].transcript
        isFinal = e.results[i].isFinal
      }
      if (lineRef === null) lineRef = pushLine('user', text, !isFinal)
      else setLine(lineRef, text, !isFinal)
      if (isFinal) finalText = text
    }
    rec.onerror = (e) => {
      recognition.current = null
      const map: Record<string, ErrorKind> = { 'not-allowed': 'denied', 'service-not-allowed': 'denied', 'no-speech': 'no-speech', 'audio-capture': 'no-mic' }
      if (e.error === 'aborted') return
      setError(map[e.error] ?? 'generic')
      setPhase('error')
    }
    rec.onend = () => {
      recognition.current = null
      if (t !== token.current) return
      if (finalText) void handleUtterance(finalText, t)
      else {
        setError('no-speech')
        setPhase('error')
      }
    }
    recognition.current = rec
    setPhase('listening')
    try {
      rec.start()
    } catch {
      setError('generic')
      setPhase('error')
    }
  }

  async function handleUtterance(text: string, t: number) {
    try {
      const lower = text.toLowerCase()
      const time = parseTime(text)
      if (awaitingTime.current) {
        if (time) {
          awaitingTime.current = false
          return await proposeReminder(time, t)
        }
        await avelaSays('Sorry, I didn’t catch a time. Try saying something like “eight PM”.', t)
        return startMic()
      }
      if (/remind|reminder|medication|tablet/.test(lower)) {
        if (time) return await proposeReminder(time, t)
        await avelaSays('What time would you like the reminder?', t)
        awaitingTime.current = true
        return startMic()
      }
      await avelaSays('I can help with that in chat, where you can review the details.', t)
      setHandoffText(text)
      setPhase('handoff')
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e
    }
  }

  /* ── confirm / cancel review ────────────────────────────── */

  async function confirmReminder() {
    if (!pendingTime) return
    actions.setReminder(med.id, pendingTime)
    const t = token.current
    const time = pendingTime
    setPendingTime(null)
    try {
      await avelaSays(`Your daily ${fmtTimeShort(time)} reminder is set.`, t)
      setPhase('done')
    } catch {
      /* cancelled */
    }
  }

  async function cancelReminder() {
    setPendingTime(null)
    const t = token.current
    try {
      await avelaSays('Okay, I didn’t set anything.', t)
      setPhase('done')
    } catch {
      /* cancelled */
    }
  }

  const togglePause = () => {
    if (phase === 'speaking') {
      paused.current = true
      if (readAloud) window.speechSynthesis.pause()
      setPhase('paused')
    } else if (phase === 'paused') {
      paused.current = false
      if (readAloud) window.speechSynthesis.resume()
      setPhase('speaking')
    }
  }

  const stopListening = () => {
    // Stop capture immediately; whatever was heard so far is kept on screen.
    cancelAll()
    setLines((ls) => ls.map((l) => (l.partial ? { ...l, partial: false } : l)))
    setPhase('ready')
  }

  // Shrink the orb once there's a card or result to read, so it stays in view.
  const compact = phase === 'review' || phase === 'done' || phase === 'handoff'

  const close = () => {
    cancelAll()
    back()
  }

  // Auto-run demo from the demo navigator (?demo=1)
  useEffect(() => {
    if (params.get('demo')) {
      setParams({}, { replace: true })
      void runDemo()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const orbState: OrbState = phase === 'listening' ? 'listening' : phase === 'processing' ? 'processing' : phase === 'speaking' ? 'speaking' : phase === 'paused' ? 'paused' : 'idle'
  const started = lines.length > 0 || phase !== 'intro'
  const reminderAfter = existing
  const live = phase === 'listening' || phase === 'speaking' || phase === 'paused'

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(120%_65%_at_50%_24%,#ffffff_0%,#f4f4fd_40%,#e8e9fb_75%,#dfe2fb_100%)]">
      {/* Top bar */}
      <header className="flex min-h-14 flex-none items-center gap-2 px-2 pt-[env(safe-area-inset-top)]">
        <span className={cx('ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-medium', phase === 'listening' ? 'bg-attention-soft text-attention-text' : 'bg-white/80 text-text-muted')}>
          {phase === 'listening' ? (
            <>
              <span className="size-1.5 animate-pulse rounded-full bg-attention" aria-hidden /> Mic on{mode === 'demo' ? ' · demo' : ''}
            </>
          ) : (
            <>
              <MicOff size={12} aria-hidden /> Mic off
            </>
          )}
        </span>
        <span className="flex-1" />
        {!live && <IconButton icon={X} label="Close voice mode" tone="plain" onClick={close} />}
        {live && <span className="size-11" aria-hidden />}
      </header>

      {/* Orb + status */}
      <div className="flex flex-none flex-col items-center pt-6">
        <Orb size={compact ? 96 : started ? 172 : 196} state={orbState} className="transition-[width,height] duration-300" />
        <p className={cx(compact ? 'mt-7' : 'mt-12', 'text-callout font-medium text-text-muted')} role="status" aria-live="polite">
          {phase === 'error' && error ? ERRORS[error].title : STATE_LABEL[phase]}
        </p>
        {mode === 'demo' && phase !== 'intro' && <p className="text-micro text-text-subtle">Demo voice · no microphone in use</p>}
      </div>

      {/* Transcript */}
      <div className="voice-transcript mt-2 min-h-0 flex-1 overflow-y-auto px-7 pt-3" aria-label="Transcript">
        {!started && (
          <div className="mx-auto max-w-[300px] text-center">
            <h1 className="text-title font-medium">Talk to Avela</h1>
            <p className="mt-1.5 text-callout text-text-muted">Try “Remind me to take my medication every evening.”</p>
          </div>
        )}
        <ol className="flex flex-col gap-3 pb-4">
          {lines.map((l, i) => {
            const latest = i === lines.length - 1
            return (
              <li key={l.id} className="animate-fade-in text-center">
                <p className="text-micro font-medium text-text-subtle">{l.role === 'user' ? 'You' : 'Avela'}</p>
                <p className={cx('mt-0.5', latest ? 'text-[18px] font-medium leading-[26px] text-text' : 'text-callout text-text-muted')}>
                  {l.text || '…'}
                  {l.partial && <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-1 animate-pulse bg-action" aria-hidden />}
                </p>
              </li>
            )
          })}
        </ol>

        {phase === 'review' && pendingTime && (
          <div className="pb-6">
            <ActionReviewCard
              icon={BellRing}
              question={reminderAfter ? 'Change this reminder?' : 'Set this reminder?'}
              title={med.name}
              details={
                <>
                  One tablet · Daily at {fmtTime(pendingTime)}
                  {reminderAfter && <span className="block">Replaces your {fmtTime(reminderAfter.time)} reminder</span>}
                </>
              }
              note="From your existing care plan. Reminders are simulated and only appear while Avela is open."
              confirmLabel="Confirm reminder"
              onConfirm={confirmReminder}
              onCancel={cancelReminder}
            />
          </div>
        )}

        {phase === 'error' && error && (
          <div className="mx-auto max-w-[320px] pb-4 text-center">
            <p className="text-callout text-text-muted">{ERRORS[error].body}</p>
          </div>
        )}
        <div ref={transcriptEnd} className="h-3" />
      </div>

      {/* Controls */}
      <div className="flex-none px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
        {!compact && !live && <Waveform active={false} speaking={false} />}
        <div className={cx(!compact && !live && 'mt-3', 'flex min-h-16 items-center justify-center gap-3')}>
          {(phase === 'intro' || phase === 'ready' || phase === 'error') && (
            <div className="flex w-full flex-col items-center gap-2">
              <div className="flex items-center gap-5">
                <IconButton icon={Keyboard} label="Type instead" tone="surface" onClick={() => navigate('/assistant')} />
                <button onClick={startMic} aria-label={phase === 'error' ? 'Retry microphone' : 'Use microphone'} className="flex size-16 items-center justify-center rounded-full bg-action text-white shadow-[0_8px_24px_-8px_rgb(96_72_232/0.6)] hover:bg-action-hover">
                  {phase === 'error' ? <RotateCcw size={24} aria-hidden /> : <Mic size={26} aria-hidden />}
                </button>
                <span className="size-11" aria-hidden />
              </div>
              <Button variant="soft" size="sm" icon={Sparkles} onClick={runDemo}>
                Try demo voice
              </Button>
              <p className="text-center text-micro text-text-muted">The mic only turns on after you tap it, and stops when you leave.</p>
            </div>
          )}

          {phase === 'processing' && <p className="text-callout text-text-muted">Working on it…</p>}

          {live && (
            <div className="flex w-full items-center gap-3">
              <IconButton icon={X} label="Close voice mode" tone="surface" onClick={close} />
              <div className="min-w-0 flex-1">
                <Waveform active={phase === 'listening'} speaking={phase === 'speaking'} />
              </div>
              {phase === 'listening' ? (
                <button onClick={stopListening} aria-label="Stop microphone" className="flex size-14 flex-none items-center justify-center rounded-full bg-attention text-white shadow-[0_8px_22px_-8px_rgb(239_107_97/0.7)] hover:brightness-95">
                  <span className="size-4 rounded-[4px] bg-white" aria-hidden />
                </button>
              ) : (
                <button onClick={togglePause} aria-label={phase === 'paused' ? 'Resume' : 'Pause'} className="flex size-14 flex-none items-center justify-center rounded-full bg-attention text-white shadow-[0_8px_22px_-8px_rgb(239_107_97/0.7)] hover:brightness-95">
                  {phase === 'paused' ? <Play size={20} fill="currentColor" aria-hidden /> : <Pause size={20} fill="currentColor" aria-hidden />}
                </button>
              )}
            </div>
          )}

          {phase === 'review' && <p className="text-caption text-text-muted">Confirm or cancel above</p>}

          {phase === 'done' && (
            <div className="flex w-full flex-col gap-2">
              <Button block onClick={() => navigate('/care/medications')}>
                View medication schedule
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => navigate('/')}>
                  Back to Today
                </Button>
                <Button variant="ghost" className="flex-1" icon={RotateCcw} onClick={() => (setLines([]), setPhase('intro'), setMode(null))}>
                  Start over
                </Button>
              </div>
            </div>
          )}

          {phase === 'handoff' && (
            <div className="flex w-full flex-col gap-2">
              <Button block onClick={() => navigate('/assistant', { state: { prompt: handoffText } })}>
                Continue in chat
              </Button>
              <Button variant="ghost" block onClick={() => setPhase('ready')}>
                Speak again
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const BAR_HEIGHTS = [14, 22, 30, 18, 36, 26, 40, 20, 32, 16, 38, 24, 34, 18, 28, 12, 30, 22, 36, 16, 26, 14]

function Waveform({ active, speaking }: { active: boolean; speaking: boolean }) {
  return (
    <div className="wave flex h-10 items-center justify-center gap-[4px] overflow-hidden" data-active={active || speaking} aria-hidden style={{ opacity: active || speaking ? 1 : 0.35 }}>
      {BAR_HEIGHTS.map((h, i) => (
        <span key={i} style={{ ['--h' as string]: `${speaking ? h * 0.6 : h}px`, animationDelay: `${(i % 7) * 90}ms`, animationDuration: speaking ? '0.7s' : '1s' }} />
      ))}
    </div>
  )
}
