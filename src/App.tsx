import { useEffect, useState, type ReactNode } from 'react'
import { BrowserRouter, Link, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { BellRing, ExternalLink, RotateCcw, X } from 'lucide-react'
import { StoreProvider, doseStatus, useStore } from './state/store'
import { useMedicationActions } from './state/hooks'
import { BottomNav } from './components/Chrome'
import { ToastHost } from './components/Feedback'
import { Orb } from './components/Orb'
import { Home } from './screens/Home'
import { Assistant } from './screens/Assistant'
import { Voice } from './screens/Voice'
import { Care } from './screens/Care'
import { Medications } from './screens/Medications'
import { AppointmentDetails } from './screens/AppointmentDetails'
import { Booking } from './screens/Booking'
import { Journal } from './screens/Journal'
import { VisitPrep } from './screens/VisitPrep'
import { Profile } from './screens/Profile'
import { DesignSystem } from './screens/DesignSystem'
import { fmtTime } from './lib/time'
import { cx } from './lib/cx'

const WIDTHS = [375, 390, 430] as const
type Width = (typeof WIDTHS)[number]

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <Routes>
          <Route path="/design-system" element={<DesignSystem />} />
          <Route path="*" element={<PrototypeShell />} />
        </Routes>
      </StoreProvider>
    </BrowserRouter>
  )
}

/** Device routes. Tab screens get the bottom nav; focused flows (assistant, voice, booking, visit prep) hide it. */
function DeviceRoutes() {
  return (
    <Routes>
      <Route element={<TabLayout />}>
        <Route index element={<Home />} />
        <Route path="care" element={<Care />} />
        <Route path="care/medications" element={<Medications />} />
        <Route path="care/appointment" element={<AppointmentDetails />} />
        <Route path="journal" element={<Journal />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route element={<FocusLayout />}>
        <Route path="assistant" element={<Assistant />} />
        <Route path="voice" element={<Voice />} />
        <Route path="care/book" element={<Booking />} />
        <Route path="journal/prepare" element={<VisitPrep />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

function Animated({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="h-full animate-fade-in">
      {children}
    </div>
  )
}

function TabLayout() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <Animated>
          <Outlet />
        </Animated>
      </div>
      <BottomNav />
    </div>
  )
}

function FocusLayout() {
  return (
    <Animated>
      <Outlet />
    </Animated>
  )
}

function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-canvas p-8 text-center">
      <Orb size={56} />
      <p className="text-headline font-medium">This screen doesn’t exist</p>
      <Link to="/" className="text-callout font-medium text-action-hover underline">
        Back to Today
      </Link>
    </div>
  )
}

/* ── Device frame + desktop demo navigator ───────────────────── */

function PrototypeShell() {
  const [width, setWidth] = useState<Width>(() => {
    try {
      const w = Number(localStorage.getItem('avela-device-width'))
      return (WIDTHS as readonly number[]).includes(w) ? (w as Width) : 390
    } catch {
      return 390
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('avela-device-width', String(width))
    } catch {
      /* ignore */
    }
  }, [width])

  return (
    <div className="flex h-dvh items-center justify-center md:gap-10 md:p-6 lg:gap-14">
      <DemoNavigator width={width} onWidth={setWidth} />
      <div
        className="device relative h-dvh w-full overflow-hidden bg-canvas md:h-[min(844px,calc(100dvh-48px))] md:w-[var(--device-w)] md:flex-none md:rounded-[44px] md:shadow-[0_0_0_10px_#191b2a,0_0_0_11px_#3a3d52,0_40px_80px_-20px_rgb(24_52_168/0.35)]"
        style={{ ['--device-w' as string]: `${width}px` }}
      >
        <DeviceRoutes />
        <ReminderBanner />
        <ToastHost />
        <div id="overlay-root" className="pointer-events-none absolute inset-0 z-50 [&>*]:pointer-events-auto" />
      </div>
    </div>
  )
}

/** Simulated in-app medication reminder (no real notifications). */
function ReminderBanner() {
  const { state, actions, reminderBanner, setReminderBanner, showToast } = useStore()
  const { markTaken } = useMedicationActions()
  const navigate = useNavigate()
  if (!reminderBanner) return null
  const med = state.medications[0]
  const reminder = state.reminders.find((r) => r.medId === med.id)
  const status = doseStatus(state, med.id)
  const close = () => setReminderBanner(false)
  return (
    <div className="absolute inset-x-3 top-[max(10px,env(safe-area-inset-top))] z-[55] animate-rise" role="alertdialog" aria-label="Medication reminder (simulated)">
      <div className="rounded-[22px] bg-ink-900/95 p-3.5 text-white shadow-[var(--shadow-float)] backdrop-blur">
        <div className="flex items-start gap-3">
          <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-white/12" aria-hidden>
            <BellRing size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-caption text-white/70">Avela · simulated reminder</p>
            <p className="text-body font-medium">
              {med.name} · {reminder ? fmtTime(reminder.time) : 'preview'}
            </p>
            <p className="text-callout text-white/80">{med.instruction}. Instructions are from your care plan.</p>
          </div>
          <button onClick={close} aria-label="Dismiss reminder" className="-mr-1 -mt-1 flex size-11 flex-none items-center justify-center rounded-full hover:bg-white/10">
            <X size={18} aria-hidden />
          </button>
        </div>
        <div className="on-dark mt-3 flex gap-2">
          {status.kind === 'taken' ? (
            <p className="flex-1 py-2 text-callout text-white/80">Already logged as taken at {fmtTime(status.at)}.</p>
          ) : (
            <>
              <button
                onClick={() => {
                  markTaken(med.id)
                  close()
                }}
                className="min-h-11 flex-1 rounded-full bg-white text-callout font-medium text-ink-900"
              >
                Taken
              </button>
              <button
                onClick={() => {
                  if (!reminder) {
                    showToast({ message: 'Set a reminder first to snooze it' })
                  } else {
                    const until = actions.snooze(med.id, 10)
                    showToast({ message: `Snoozed until ${fmtTime(until)}` })
                  }
                  close()
                }}
                className="min-h-11 flex-1 rounded-full border border-white/25 text-callout font-medium"
              >
                Snooze 10 min
              </button>
            </>
          )}
          <button
            onClick={() => {
              close()
              navigate('/care/medications')
            }}
            className="min-h-11 rounded-full px-3 text-callout font-medium text-[#c9c1ff]"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  )
}

const DEMO_LINKS: { group: string; items: { label: string; to: string; hint?: string }[] }[] = [
  {
    group: '1 · Today',
    items: [
      { label: 'Home', to: '/' },
      { label: 'Notifications & week view', to: '/', hint: 'Tap the bell or the date pill' },
    ],
  },
  {
    group: '2 · Assistant',
    items: [
      { label: 'Empty state', to: '/assistant?fresh=1' },
      { label: 'Medication reminder', to: '/assistant?fresh=1&prompt=Remind me to take Medication A at 8 PM.' },
      { label: 'Book follow-up', to: '/assistant?fresh=1&prompt=Book my follow-up appointment.' },
      { label: 'Add blood test task', to: '/assistant?fresh=1&prompt=Add a blood test to my tasks.' },
      { label: 'Prepare for visit', to: '/assistant?fresh=1&prompt=Help me prepare for my next visit.' },
      { label: 'Unsupported request', to: '/assistant?fresh=1&prompt=What’s the weather like?' },
    ],
  },
  {
    group: '3 · Voice',
    items: [
      { label: 'Voice mode', to: '/voice' },
      { label: 'Run demo voice', to: '/voice?demo=1', hint: 'No microphone needed' },
    ],
  },
  {
    group: '4 · Medication',
    items: [{ label: 'Schedule & log', to: '/care/medications' }],
  },
  {
    group: '5 · Booking',
    items: [
      { label: 'Current appointment', to: '/care/appointment' },
      { label: 'Reschedule flow', to: '/care/book' },
      { label: 'Jump to times', to: '/care/book?step=time', hint: 'Thu 28 May, 10:30 AM fails once' },
      { label: 'Jump to review', to: '/care/book?step=review' },
    ],
  },
  {
    group: '6 · Journal',
    items: [
      { label: 'Check-in & entries', to: '/journal' },
      { label: 'Visit prep', to: '/journal/prepare' },
    ],
  },
  {
    group: 'More',
    items: [
      { label: 'Care hub', to: '/care' },
      { label: 'Profile & reset', to: '/profile' },
    ],
  },
]

function DemoNavigator({ width, onWidth }: { width: Width; onWidth: (w: Width) => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { actions, showToast } = useStore()
  const current = location.pathname + location.search
  return (
    <aside className="hidden max-h-[calc(100dvh-48px)] w-[260px] flex-none flex-col overflow-y-auto rounded-[24px] bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur md:flex" aria-label="Demo navigator">
      <div className="flex items-center gap-2.5">
        <Orb size={32} />
        <div>
          <p className="text-headline font-medium leading-tight">Avela</p>
          <p className="text-caption text-text-muted">Prototype · demo navigator</p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-caption font-medium text-text-muted">Device width</p>
        <div className="flex gap-1 rounded-full bg-lavender-100 p-1" role="radiogroup" aria-label="Device width">
          {WIDTHS.map((w) => (
            <button key={w} role="radio" aria-checked={width === w} onClick={() => onWidth(w)} className={cx('min-h-9 flex-1 rounded-full text-caption font-medium transition-colors', width === w ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text')}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <nav className="mt-4 flex flex-col gap-3">
        {DEMO_LINKS.map((g) => (
          <div key={g.group}>
            <p className="mb-1 text-caption font-medium text-text-muted">{g.group}</p>
            <ul>
              {g.items.map((i) => (
                <li key={i.label}>
                  <button
                    onClick={() => navigate(i.to)}
                    className={cx('w-full rounded-[10px] px-2.5 py-1.5 text-left text-callout transition-colors hover:bg-white', current === i.to && 'bg-white font-medium text-action-hover')}
                  >
                    {i.label}
                    {i.hint && <span className="block text-[12px] leading-4 text-text-muted">{i.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
        <button
          onClick={() => {
            actions.reset()
            navigate('/')
            showToast({ message: 'Demo reset to the start of the story' })
          }}
          className="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-left text-callout font-medium text-attention-text hover:bg-white"
        >
          <RotateCcw size={15} aria-hidden /> Reset demo
        </button>
        <Link to="/design-system" className="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-callout font-medium text-action-hover hover:bg-white">
          <ExternalLink size={15} aria-hidden /> Design system
        </Link>
      </div>
      <p className="mt-3 text-[12px] leading-4 text-text-muted">Fictional data. Nothing is sent anywhere; state is saved in this browser.</p>
    </aside>
  )
}
