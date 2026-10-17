import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CalendarCheck, CalendarDays, CheckCircle2, MapPin, MessageSquareText, Stethoscope, Video } from 'lucide-react'
import { Screen, ScreenHeader } from '../components/Chrome'
import { Avatar, Badge, Card, DetailRow } from '../components/Card'
import { Button } from '../components/Button'
import { Notice, Skeleton } from '../components/Feedback'
import { ChoiceCard, TextArea } from '../components/Form'
import { AppointmentSummary, DateStrip, SlotGrid } from '../components/Domain'
import { APPOINTMENT_TYPES, DOCTOR_ID, REASONS } from '../data/seed'
import { availableDates, availableSlots, doctorById, upcomingAppointment, useStore } from '../state/store'
import type { Appointment, VisitType } from '../state/types'
import { fmtDate, fmtTime } from '../lib/time'
import { cx } from '../lib/cx'
import { useBack } from '../lib/useBack'

const STEPS = ['current', 'type', 'doctor', 'time', 'reason', 'review', 'done'] as const
type Step = (typeof STEPS)[number]
const FLOW: Step[] = ['type', 'doctor', 'time', 'reason', 'review']
const STEP_TITLES: Record<Step, string> = {
  current: 'Your appointment',
  type: 'Type of visit',
  doctor: 'Your clinician',
  time: 'Choose a time',
  reason: 'Reason for visit',
  review: 'Review booking',
  done: 'Booked',
}

export function Booking() {
  const navigate = useNavigate()
  const goBack = useBack('/care')
  const [params, setParams] = useSearchParams()
  const { state, actions, showToast } = useStore()
  const existing = upcomingAppointment(state)
  const doctor = doctorById(state, DOCTOR_ID)

  const initialStep = (STEPS as readonly string[]).includes(params.get('step') ?? '') ? (params.get('step') as Step) : existing ? 'current' : 'type'
  const deep = FLOW.indexOf(initialStep) > 0
  const [step, setStep] = useState<Step>(initialStep)
  const [visitType, setVisitType] = useState<VisitType>(existing?.visitType ?? 'in-person')
  const dates = availableDates()
  const [date, setDate] = useState(deep ? '2026-05-28' : dates[0])
  const [time, setTime] = useState<string | undefined>(deep && FLOW.indexOf(initialStep) > 2 ? '09:00' : undefined)
  const [reason, setReason] = useState(REASONS[0])
  const [otherReason, setOtherReason] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [booked, setBooked] = useState<{ appointment: Appointment; replaced?: Appointment } | null>(null)
  // Snapshot of the appointment being replaced, so the review copy stays accurate.
  const [replacing] = useState(existing)

  const go = (s: Step) => {
    setStep(s)
    setParams(s === 'current' || s === 'done' ? {} : { step: s }, { replace: true })
  }

  useEffect(() => {
    document.getElementById('booking-scroll')?.parentElement?.scrollTo({ top: 0 })
  }, [step])

  // Simulated availability fetch when the date changes
  useEffect(() => {
    if (step !== 'time') return
    setLoadingSlots(true)
    const id = window.setTimeout(() => setLoadingSlots(false), 450)
    return () => window.clearTimeout(id)
  }, [date, step])

  const slots = availableSlots(state, date)
  const counts = useMemo(() => Object.fromEntries(dates.map((d) => [d, availableSlots(state, d).filter((t) => !(replacing && replacing.date === d && replacing.time === t)).length])), [dates, state, replacing])
  const currentTimeOnDate = replacing && replacing.date === date ? replacing.time : undefined
  const reasonText = reason === 'Something else' ? otherReason.trim() : reason
  const typeInfo = APPOINTMENT_TYPES.find((t) => t.id === visitType)!

  const flowIndex = FLOW.indexOf(step)
  const back = () => {
    if (step === 'done') return navigate('/')
    if (flowIndex > 0) return go(FLOW[flowIndex - 1])
    if (step === 'type' && existing) return go('current')
    goBack()
  }

  const confirm = () => {
    if (!time) return
    setSubmitting(true)
    window.setTimeout(() => {
      const result = actions.book({ date, time }, visitType, reasonText)
      setSubmitting(false)
      if (!result.ok) {
        setUnavailable(`${fmtDate(date, { short: true })} at ${fmtTime(time)} was just taken by someone else.`)
        setTime(undefined)
        go('time')
        return
      }
      setBooked({ appointment: result.appointment, replaced: result.replaced })
      go('done')
    }, 700)
  }

  const header = (
    <div className="flex-none bg-canvas">
      <ScreenHeader
        title={STEP_TITLES[step]}
        subtitle={flowIndex >= 0 ? `Step ${flowIndex + 1} of ${FLOW.length}` : step === 'current' ? 'Follow-up with Dr Erica Morgan' : undefined}
        onBack={step === 'done' ? undefined : back}
        onClose={step === 'done' ? undefined : () => navigate(existing ? '/care/appointment' : '/', { replace: true })}
      />
      {flowIndex >= 0 && (
        <div className="flex gap-1 px-5 pb-2" aria-hidden>
          {FLOW.map((s, i) => (
            <span key={s} className={cx('h-1 flex-1 rounded-full transition-colors duration-200', i <= flowIndex ? 'bg-action' : 'bg-ink-200')} />
          ))}
        </div>
      )}
    </div>
  )

  const footer = (() => {
    const wrap = (children: ReactNode) => <div className="flex-none border-t border-border bg-surface px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">{children}</div>
    switch (step) {
      case 'current':
        return wrap(
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                showToast({ message: 'Kept your current appointment', tone: 'success' })
                navigate('/care/appointment', { replace: true })
              }}
            >
              Keep it
            </Button>
            <Button className="flex-1" onClick={() => go('type')}>
              Reschedule
            </Button>
          </div>,
        )
      case 'type':
      case 'doctor':
        return wrap(
          <Button block iconRight={ArrowRight} onClick={() => go(step === 'type' ? 'doctor' : 'time')}>
            Continue
          </Button>,
        )
      case 'time':
        return wrap(
          <Button block iconRight={ArrowRight} disabled={!time} onClick={() => go('reason')}>
            {time ? `Continue · ${fmtDate(date, { short: true })}, ${fmtTime(time)}` : 'Choose a time to continue'}
          </Button>,
        )
      case 'reason':
        return wrap(
          <Button block iconRight={ArrowRight} disabled={!reasonText} onClick={() => go('review')}>
            Review booking
          </Button>,
        )
      case 'review':
        return wrap(
          <Button block icon={CalendarCheck} onClick={confirm} disabled={submitting || !time}>
            {submitting ? 'Booking…' : replacing ? 'Confirm new time' : 'Confirm booking'}
          </Button>,
        )
      default:
        return null
    }
  })()

  return (
    <Screen label="Book an appointment" className="bg-canvas" header={header} footer={footer}>
      <div id="booking-scroll" className="px-5 pb-8 pt-2">
        {step === 'current' && existing && (
          <div className="flex flex-col gap-4 animate-rise">
            <Card>
              <Badge tone="brand" className="mb-3">
                Current appointment
              </Badge>
              <AppointmentSummary appt={existing} doctor={doctor} />
            </Card>
            <p className="text-body text-text-muted">Would you like to keep this time, or choose a new one? If you reschedule, your new time replaces this one.</p>
          </div>
        )}

        {step === 'type' && (
          <div className="flex flex-col gap-3 animate-rise" role="radiogroup" aria-label="Type of visit">
            <p className="mb-1 text-body text-text-muted">How would you like to see Dr Morgan?</p>
            {APPOINTMENT_TYPES.map((t) => (
              <ChoiceCard key={t.id} selected={visitType === t.id} onSelect={() => setVisitType(t.id)} icon={t.id === 'video' ? Video : MapPin} title={t.title} body={t.body} />
            ))}
          </div>
        )}

        {step === 'doctor' && (
          <div className="flex flex-col gap-4 animate-rise">
            <Card>
              <div className="flex items-center gap-3">
                <Avatar initials="EM" tone="brand" size={56} />
                <div>
                  <p className="text-headline font-medium">{doctor.name}</p>
                  <p className="text-callout text-text-muted">{doctor.speciality}</p>
                </div>
              </div>
              <p className="mt-3 text-callout text-text-muted">{doctor.context}</p>
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                <DetailRow icon={MapPin} label="Clinic" value={`${doctor.clinic}, ${doctor.address}`} />
                <DetailRow icon={Stethoscope} label="Visit" value={typeInfo.title} />
              </div>
            </Card>
            <Notice tone="info">Follow-ups are booked with the clinician who manages your care plan.</Notice>
          </div>
        )}

        {step === 'time' && (
          <div className="flex flex-col gap-4 animate-rise">
            {unavailable && (
              <Notice tone="attention" icon={AlertTriangle} title="That time is no longer available">
                {unavailable} Nothing was booked — please pick another time.
              </Notice>
            )}
            <DateStrip
              dates={dates}
              value={date}
              counts={counts}
              onChange={(d) => {
                setDate(d)
                setTime(undefined)
              }}
            />
            <div>
              <p className="mb-2 text-callout font-medium">{fmtDate(date)}</p>
              {loadingSlots ? (
                <div className="grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading times">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="h-12 rounded-[14px]" />
                  ))}
                </div>
              ) : slots.length ? (
                <SlotGrid
                  slots={slots}
                  value={time}
                  currentTime={currentTimeOnDate}
                  onChange={(t) => {
                    setTime(t)
                    setUnavailable(null)
                  }}
                />
              ) : (
                <p className="rounded-[14px] bg-surface p-4 text-callout text-text-muted">No times left on this day. Try another date.</p>
              )}
            </div>
            <p className="text-caption text-text-muted">Times shown are fictional availability for this prototype.</p>
          </div>
        )}

        {step === 'reason' && (
          <div className="flex flex-col gap-3 animate-rise" role="radiogroup" aria-label="Reason for visit">
            <p className="mb-1 text-body text-text-muted">What would you like to focus on? This helps Dr Morgan prepare.</p>
            {REASONS.map((r) => (
              <ChoiceCard key={r} selected={reason === r} onSelect={() => setReason(r)} title={r} />
            ))}
            {reason === 'Something else' && <TextArea label="Tell us briefly" value={otherReason} maxLength={140} onChange={(e) => setOtherReason(e.target.value)} placeholder="e.g. Questions about my prescription" hint={`${otherReason.length}/140`} />}
          </div>
        )}

        {step === 'review' && time && (
          <div className="flex flex-col gap-4 animate-rise">
            <Card className="flex flex-col gap-4">
              <DetailRow icon={Stethoscope} label="Clinician" value={`${doctor.name} · ${doctor.speciality}`} />
              <DetailRow icon={CalendarDays} label="New time" value={`${fmtDate(date)}, ${fmtTime(time)}`} />
              <DetailRow icon={visitType === 'video' ? Video : MapPin} label={typeInfo.title} value={visitType === 'video' ? 'Video link shared before the visit' : `${doctor.clinic}, ${doctor.address}`} />
              <DetailRow icon={MessageSquareText} label="Reason" value={reasonText} />
            </Card>
            {replacing && (
              <Notice tone="attention" title="This replaces your current appointment">
                Your {fmtDate(replacing.date, { short: true })} {fmtTime(replacing.time)} appointment will be cancelled and replaced by this one.
              </Notice>
            )}
            <p className="text-caption text-text-muted">Nothing is booked until you confirm. This is a simulated booking.</p>
          </div>
        )}

        {step === 'done' && booked && (
          <div className="flex flex-col items-center pt-6 text-center animate-rise">
            <span className="flex size-16 items-center justify-center rounded-full bg-success-soft text-success" aria-hidden>
              <CheckCircle2 size={34} />
            </span>
            <h2 className="mt-3 text-[20px] font-medium leading-7" role="status">
              {booked.replaced ? 'Appointment rescheduled' : 'Appointment booked'}
            </h2>
            <p className="mt-1 text-body text-text-muted">{booked.replaced ? `Your ${fmtDate(booked.replaced.date, { short: true })} ${fmtTime(booked.replaced.time)} visit has been replaced.` : 'We’ve added it to your care plan.'}</p>
            <Card className="mt-6 w-full text-left">
              <AppointmentSummary appt={booked.appointment} doctor={doctor} />
              <p className="mt-3 text-callout text-text-muted">{APPOINTMENT_TYPES.find((t) => t.id === booked.appointment.visitType)?.title}</p>
            </Card>
            <div className="mt-6 flex w-full flex-col gap-2">
              <Button block onClick={() => navigate('/care/appointment', { replace: true })}>
                View appointment
              </Button>
              <Button block variant="secondary" onClick={() => navigate('/', { replace: true })}>
                Back to Today
              </Button>
            </div>
          </div>
        )}
        {step === 'done' && !booked && (
          <div className="pt-6">
            <Notice tone="info" title="Nothing to show yet">
              Start a booking to see a confirmation.
            </Notice>
            <Button className="mt-4" onClick={() => go(existing ? 'current' : 'type')}>
              Start booking
            </Button>
          </div>
        )}
      </div>
    </Screen>
  )
}
