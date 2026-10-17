import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, BellRing, CalendarDays, Heart, ListChecks, Plus, Settings } from 'lucide-react'
import { Button, IconButton, type ButtonVariant } from '../components/Button'
import { Avatar, Badge, Card, CardHeader, IconTile, type BadgeTone } from '../components/Card'
import { EmptyState, Notice, Skeleton, type NoticeTone } from '../components/Feedback'
import { ChoiceCard, FilterChips, SegmentedControl, Switch, TextField } from '../components/Form'
import { ActionReviewCard, AppointmentSummary, DateStrip, MedicationReminderCard, MoodScale, SlotGrid, TaskList } from '../components/Domain'
import { Composer } from '../components/Chrome'
import { Orb, type OrbState } from '../components/Orb'
import { MOTION, PRIMITIVE_COLORS, RADII, SEMANTIC_COLORS, SHADOWS, TYPE_SCALE } from '../lib/tokens'
import { seedState } from '../data/seed'
import type { MoodLevel, Task } from '../state/types'
import type { DoseStatus } from '../state/store'

const seed = seedState()
const doctor = seed.doctors[0]
const appt = seed.appointments[0]

function Section({ id, title, children, note }: { id: string; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-6 border-t border-border py-10">
      <h2 className="text-title font-medium">{title}</h2>
      {note && <p className="mt-1 max-w-2xl text-callout text-text-muted">{note}</p>}
      <div className="mt-6">{children}</div>
    </section>
  )
}

function Specimen({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <p className="mb-2 font-mono text-[12px] text-text-muted">{label}</p>
      {children}
    </div>
  )
}

const NAV = ['colors', 'type', 'radii', 'elevation', 'motion', 'orb', 'buttons', 'badges', 'forms', 'feedback', 'cards', 'domain']

export function DesignSystem() {
  const [chip, setChip] = useState<'all' | 'meds' | 'tasks'>('all')
  const [seg, setSeg] = useState<'in-person' | 'video'>('in-person')
  const [choice, setChoice] = useState(true)
  const [sw, setSw] = useState(true)
  const [mood, setMood] = useState<MoodLevel>(4)
  const [slot, setSlot] = useState<string>()
  const [date, setDate] = useState('2026-05-27')
  const [tasks, setTasks] = useState<Task[]>(seed.tasks)

  const statuses: [string, DoseStatus][] = [
    ['no-reminder', { kind: 'no-reminder' }],
    ['upcoming', { kind: 'upcoming', time: '20:00' }],
    ['due', { kind: 'due', time: '20:00' }],
    ['snoozed', { kind: 'snoozed', time: '20:00', until: '20:20' }],
    ['taken', { kind: 'taken', at: '20:04', logId: 'x', time: '20:00' }],
  ]

  return (
    <div className="min-h-full bg-canvas text-text">
      <header className="sticky top-0 z-10 border-b border-border bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-callout font-medium text-action-hover hover:bg-action-soft">
            <ArrowLeft size={16} aria-hidden /> Prototype
          </Link>
          <div className="flex items-center gap-2">
            <Orb size={28} />
            <span className="text-headline font-medium">Avela design system</span>
          </div>
          <nav aria-label="Sections" className="no-scrollbar ml-auto hidden gap-1 overflow-x-auto md:flex">
            {NAV.map((n) => (
              <a key={n} href={`#${n}`} className="rounded-full px-3 py-2 text-caption font-medium capitalize text-text-muted hover:bg-surface hover:text-text">
                {n}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <div className="py-10">
          <h1 className="text-display font-medium">Foundations & components</h1>
          <p className="mt-2 max-w-2xl text-body text-text-muted">
            Tokens are defined once in <code className="font-mono text-callout">src/index.css</code> (<code className="font-mono text-callout">@theme</code>) and mirrored in <code className="font-mono text-callout">src/lib/tokens.ts</code>. Components use semantic tokens only. Names here match the React component names for Figma recreation.
          </p>
        </div>

        <Section id="colors" title="Colour" note="Primitive palette → semantic roles. Cyan and magenta are reserved for the orb.">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PRIMITIVE_COLORS.map((g) => (
              <div key={g.group}>
                <p className="mb-2 text-callout font-medium">{g.group}</p>
                <div className="overflow-hidden rounded-[14px] border border-border bg-surface">
                  {g.tokens.map(([name, hex]) => (
                    <div key={name} className="flex items-center gap-3 border-b border-border p-2 last:border-0">
                      <span className="size-9 flex-none rounded-[10px] border border-black/5" style={{ background: hex }} />
                      <span className="min-w-0">
                        <span className="block font-mono text-[12px]">{name}</span>
                        <span className="block font-mono text-[12px] text-text-muted">{hex}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-8 text-callout font-medium">Semantic</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SEMANTIC_COLORS.map(([name, ref, use]) => (
              <div key={name} className="flex items-center gap-3 rounded-[14px] border border-border bg-surface p-2">
                <span className="size-9 flex-none rounded-[10px] border border-black/5" style={{ background: `var(--color-${name})` }} />
                <span className="min-w-0">
                  <span className="block font-mono text-[12px]">
                    {name} → {ref}
                  </span>
                  <span className="block text-caption text-text-muted">{use}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-8 text-callout font-medium">Home backdrop gradient</p>
          <div className="home-backdrop h-40 rounded-[18px]" />
        </Section>

        <Section id="type" title="Typography" note="Inter. Body is 15/22; nothing below 13px except tiny metadata in dense components.">
          <div className="flex flex-col gap-4">
            {TYPE_SCALE.map(([name, size, weight, use]) => (
              <div key={name} className="flex flex-wrap items-baseline gap-x-6 gap-y-1 border-b border-border pb-4">
                <span className="w-40 font-mono text-[12px] text-text-muted">
                  text-{name} · {size} · {weight}
                </span>
                <span className={`text-${name}`} style={{ fontWeight: weight }}>
                  Hey, Eva! How can I help you?
                </span>
                <span className="text-caption text-text-muted">{use}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section id="radii" title="Radius">
          <div className="flex flex-wrap gap-6">
            {RADII.map(([name, px, use]) => (
              <Specimen key={name} label={`radius-${name} · ${px}px`}>
                <div className="size-24 border border-border bg-surface" style={{ borderRadius: px }} />
                <p className="mt-1 max-w-24 text-caption text-text-muted">{use}</p>
              </Specimen>
            ))}
          </div>
        </Section>

        <Section id="elevation" title="Elevation">
          <div className="flex flex-wrap gap-8">
            {SHADOWS.map(([name, v]) => (
              <Specimen key={name} label={`shadow-${name}`}>
                <div className="h-24 w-40 rounded-[18px] bg-surface" style={{ boxShadow: v }} />
              </Specimen>
            ))}
          </div>
        </Section>

        <Section id="motion" title="Motion" note="150–260ms, ease-out cubic-bezier(0.22, 1, 0.36, 1). All motion is removed under prefers-reduced-motion.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {MOTION.map(([name, d, use]) => (
              <li key={name} className="rounded-[14px] border border-border bg-surface p-3 text-callout">
                <span className="font-mono text-[12px]">{name}</span> · {d} — <span className="text-text-muted">{use}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="orb" title="Orb" note="<Orb size state />. Layered radial gradients, blur and blend modes. The only place cyan and magenta appear.">
          <div className="flex flex-wrap items-end gap-10">
            {(['idle', 'listening', 'processing', 'speaking', 'paused'] as OrbState[]).map((s) => (
              <Specimen key={s} label={`state="${s}"`} className="flex flex-col items-center">
                <Orb size={96} state={s} />
              </Specimen>
            ))}
            <Specimen label="sizes 28 / 46 / 64" className="flex flex-col">
              <div className="flex items-end gap-4">
                <Orb size={28} />
                <Orb size={46} />
                <Orb size={64} />
              </div>
            </Specimen>
          </div>
        </Section>

        <Section id="buttons" title="Buttons">
          <div className="flex flex-col gap-6">
            {(['primary', 'secondary', 'soft', 'ghost', 'danger'] as ButtonVariant[]).map((v) => (
              <Specimen key={v} label={`<Button variant="${v}">`}>
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant={v} size="sm">
                    Small
                  </Button>
                  <Button variant={v}>Medium</Button>
                  <Button variant={v} size="lg" icon={Plus}>
                    Large with icon
                  </Button>
                  <Button variant={v} disabled>
                    Disabled
                  </Button>
                </div>
              </Specimen>
            ))}
            <Specimen label='<Button variant="inverse"> on brand'>
              <div className="on-dark flex gap-3 rounded-[18px] bg-brand p-4">
                <Button variant="inverse" size="sm">
                  Inverse
                </Button>
              </div>
            </Specimen>
            <Specimen label="<IconButton tone>">
              <div className="flex gap-3 rounded-[18px] bg-[linear-gradient(135deg,#1834a8,#aeb5f6)] p-3">
                <IconButton icon={Settings} label="surface" tone="surface" />
                <IconButton icon={Settings} label="glass" tone="glass" />
                <IconButton icon={Settings} label="plain" tone="plain" />
                <IconButton icon={Settings} label="action" tone="action" />
                <IconButton icon={BellRing} label="with badge" tone="surface" badge />
              </div>
            </Specimen>
          </div>
        </Section>

        <Section id="badges" title="Badges, avatars, icon tiles">
          <div className="flex flex-wrap items-center gap-3">
            {(['neutral', 'brand', 'success', 'attention', 'warning', 'violet'] as BadgeTone[]).map((t) => (
              <Badge key={t} tone={t}>
                {t}
              </Badge>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Avatar initials="ES" />
            <Avatar initials="EM" tone="brand" />
            <Avatar initials="MS" tone="coral" />
            <Avatar initials="RP" tone="green" />
            <IconTile icon={Heart} tone="coral" />
            <IconTile icon={CalendarDays} tone="brand" />
            <IconTile icon={ListChecks} tone="violet" />
            <IconTile icon={Heart} tone="green" />
            <IconTile icon={Heart} tone="neutral" />
          </div>
        </Section>

        <Section id="forms" title="Form controls">
          <div className="grid gap-8 md:grid-cols-2">
            <Specimen label="<FilterChips>">
              <FilterChips label="Demo" options={[{ id: 'all', label: 'All' }, { id: 'meds', label: 'Meds' }, { id: 'tasks', label: 'Tasks' }]} value={chip} onChange={setChip} />
            </Specimen>
            <Specimen label="<FilterChips onDark>">
              <div className="on-dark rounded-[18px] bg-brand px-5 py-3">
                <FilterChips onDark label="Demo dark" options={[{ id: 'all', label: 'All' }, { id: 'meds', label: 'Meds' }, { id: 'tasks', label: 'Tasks' }]} value={chip} onChange={setChip} />
              </div>
            </Specimen>
            <Specimen label="<SegmentedControl>">
              <SegmentedControl label="Visit" options={[{ id: 'in-person', label: 'In person' }, { id: 'video', label: 'Video' }]} value={seg} onChange={setSeg} />
            </Specimen>
            <Specimen label="<Switch>">
              <Card className="p-2">
                <Switch checked={sw} onChange={setSw} label="Simulated reminders" description="Show banners while open." />
              </Card>
            </Specimen>
            <Specimen label="<ChoiceCard>">
              <div className="flex flex-col gap-2" role="radiogroup" aria-label="Demo">
                <ChoiceCard selected={choice} onSelect={() => setChoice(true)} icon={CalendarDays} title="Selected" body="Supporting text" />
                <ChoiceCard selected={!choice} onSelect={() => setChoice(false)} icon={CalendarDays} title="Unselected" body="Supporting text" />
              </div>
            </Specimen>
            <Specimen label="<TextField> default / error">
              <div className="flex flex-col gap-4">
                <TextField label="Task" placeholder="e.g. Book blood test" />
                <TextField label="Name" error="Add a name." defaultValue="" />
              </div>
            </Specimen>
          </div>
        </Section>

        <Section id="feedback" title="Feedback">
          <div className="grid gap-4 md:grid-cols-2">
            {(['info', 'success', 'attention', 'warning'] as NoticeTone[]).map((t) => (
              <Notice key={t} tone={t} title={`Notice · ${t}`}>
                Supporting copy explains what happened and what to do next.
              </Notice>
            ))}
            <Card>
              <EmptyState icon={ListChecks} title="EmptyState" body="Shown when a list has nothing yet." action={<Button size="sm">Primary action</Button>} />
            </Card>
            <Card className="flex flex-col gap-3">
              <p className="font-mono text-[12px] text-text-muted">{'<Skeleton>'} loading</p>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-12 w-full rounded-[14px]" />
            </Card>
            <div className="flex items-center rounded-[18px] bg-ink-900 py-2 pl-4 pr-2 text-callout text-white">
              <p className="flex-1">Toast · Logged as taken at 8:04 PM</p>
              <span className="px-3 font-medium text-[#c9c1ff]">Undo</span>
            </div>
          </div>
        </Section>

        <Section id="cards" title="Cards & composer">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader icon={Heart} tone="coral" eyebrow="Eyebrow" title="CardHeader" action={<Button size="sm" variant="soft">Action</Button>} />
              <p className="mt-2 text-callout text-text-muted">Card radius 22, white surface, shadow-card.</p>
            </Card>
            <div className="rounded-[18px] bg-lavender-100 p-4">
              <p className="mb-2 font-mono text-[12px] text-text-muted">{'<Composer onOpen onVoice>'}</p>
              <Composer onOpen={() => {}} onVoice={() => {}} />
            </div>
          </div>
        </Section>

        <Section id="domain" title="Domain components">
          <div className="grid gap-6 md:grid-cols-2">
            {statuses.map(([label, status]) => (
              <Specimen key={label} label={`<MedicationReminderCard status="${label}">`}>
                <MedicationReminderCard name="Medication A" instruction="One tablet daily" prescribedBy="Dr Erica Morgan" status={status} onSet={() => {}} onTaken={() => {}} onSnooze={() => {}} onEdit={() => {}} onUndo={() => {}} />
              </Specimen>
            ))}
            <Specimen label="<AppointmentSummary>">
              <Card>
                <AppointmentSummary appt={appt} doctor={doctor} />
              </Card>
            </Specimen>
            <Specimen label="<TaskList>">
              <Card className="p-2">
                <TaskList tasks={tasks} onToggle={(t) => setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} />
              </Card>
            </Specimen>
            <Specimen label="<DateStrip> + <SlotGrid currentTime>">
              <Card>
                <div className="px-5">
                  <DateStrip dates={['2026-05-26', '2026-05-27', '2026-05-28', '2026-05-29']} value={date} onChange={setDate} counts={{ '2026-05-26': 1, '2026-05-27': 2, '2026-05-28': 3, '2026-05-29': 0 }} />
                </div>
                <div className="mt-3">
                  <SlotGrid slots={['09:30', '14:00', '15:30']} value={slot} onChange={setSlot} currentTime="14:00" />
                </div>
              </Card>
            </Specimen>
            <Specimen label="<MoodScale>">
              <Card>
                <MoodScale value={mood} onChange={setMood} />
              </Card>
            </Specimen>
            {(['pending', 'confirmed', 'cancelled'] as const).map((s) => (
              <Specimen key={s} label={`<ActionReviewCard status="${s}">`}>
                <ActionReviewCard icon={BellRing} question="Set this reminder?" title="Medication A" details="One tablet · Daily at 8:00 PM" confirmLabel="Confirm reminder" onConfirm={() => {}} onEdit={() => {}} onCancel={() => {}} status={s} confirmedText="Reminder set for 8:00 PM" />
              </Specimen>
            ))}
          </div>
        </Section>
      </main>
    </div>
  )
}
