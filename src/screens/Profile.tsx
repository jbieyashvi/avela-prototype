import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, FlaskConical, Palette, RotateCcw, ShieldCheck, Volume2 } from 'lucide-react'
import { Screen } from '../components/Chrome'
import { Avatar, Badge, Card, SectionTitle } from '../components/Card'
import { Button } from '../components/Button'
import { Notice } from '../components/Feedback'
import { Switch } from '../components/Form'
import { Dialog } from '../components/Sheet'
import { useStore } from '../state/store'

export function Profile() {
  const navigate = useNavigate()
  const { state, actions, showToast, setReminderBanner } = useStore()
  const [confirmReset, setConfirmReset] = useState(false)
  const p = state.profile
  const speechOK = typeof window !== 'undefined' && 'speechSynthesis' in window

  return (
    <Screen
      label="Profile"
      className="bg-canvas"
      header={
        <header className="flex-none bg-canvas px-5 pb-2 pt-[max(16px,env(safe-area-inset-top))]">
          <h1 className="text-title font-medium">Profile</h1>
        </header>
      }
    >
      <div className="px-5 pb-8 pt-3">
        <Card className="flex items-center gap-3">
          <Avatar initials={p.initials} size={60} label={`${p.firstName} ${p.lastName}`} />
          <div className="min-w-0 flex-1">
            <p className="text-[18px] font-medium leading-6">
              {p.firstName} {p.lastName}
            </p>
            <p className="text-callout text-text-muted">{p.age} · Riverside Health Clinic</p>
            <Badge tone="warning" icon={FlaskConical} className="mt-2">
              Demo data
            </Badge>
          </div>
        </Card>
        <p className="mt-2 px-1 text-caption text-text-muted">Eva is a fictional person. Every name, medication and appointment here is made up for this prototype.</p>

        <SectionTitle>Settings</SectionTitle>
        <Card className="flex flex-col gap-1 p-2">
          <Switch
            checked={state.settings.readAloud}
            onChange={(v) => actions.updateSettings({ readAloud: v })}
            label="Read replies aloud in voice mode"
            description={speechOK ? 'Uses your browser’s built-in voice.' : 'Not supported in this browser.'}
          />
          <Switch checked={state.settings.simulatedNotifications} onChange={(v) => actions.updateSettings({ simulatedNotifications: v })} label="Simulated reminders" description="Show reminder banners while Avela is open." />
          <button
            onClick={() => (state.settings.simulatedNotifications ? setReminderBanner(true) : showToast({ message: 'Turn on simulated reminders first' }))}
            className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-left text-body font-medium hover:bg-surface-muted"
          >
            <Bell size={18} className="text-text-muted" aria-hidden />
            <span className="flex-1">Preview a medication reminder</span>
            <ChevronRight size={18} className="text-text-subtle" aria-hidden />
          </button>
        </Card>

        <SectionTitle>Privacy</SectionTitle>
        <Notice tone="info" icon={ShieldCheck}>
          Everything stays in this browser’s local storage. There’s no account, server or analytics. Avela organises your care — it doesn’t diagnose, prescribe or change doses.
        </Notice>

        <SectionTitle>Prototype</SectionTitle>
        <Card className="flex flex-col gap-1 p-2">
          <button onClick={() => navigate('/voice')} className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-left text-body font-medium hover:bg-surface-muted">
            <Volume2 size={18} className="text-text-muted" aria-hidden />
            <span className="flex-1">Try voice mode</span>
            <ChevronRight size={18} className="text-text-subtle" aria-hidden />
          </button>
          <button onClick={() => navigate('/design-system')} className="flex min-h-12 items-center gap-3 rounded-[14px] px-3 text-left text-body font-medium hover:bg-surface-muted">
            <Palette size={18} className="text-text-muted" aria-hidden />
            <span className="flex-1">Design system</span>
            <ChevronRight size={18} className="text-text-subtle" aria-hidden />
          </button>
        </Card>

        <Button variant="danger" block icon={RotateCcw} className="mt-6" onClick={() => setConfirmReset(true)}>
          Reset demo
        </Button>
        <p className="mt-2 text-center text-caption text-text-muted">Restores Eva’s story to Monday 25 May.</p>
      </div>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset the demo?"
        tone="attention"
        actions={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                actions.reset()
                setConfirmReset(false)
                showToast({ message: 'Demo reset to the start of the story' })
                navigate('/')
              }}
            >
              Reset
            </Button>
          </>
        }
      >
        Reminders, bookings, tasks, journal entries and chat you added will be cleared.
      </Dialog>
    </Screen>
  )
}
