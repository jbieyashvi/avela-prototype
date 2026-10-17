import { useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarDays, CalendarPlus, ClipboardList, MapPin, MessageSquareText, Stethoscope, Video } from 'lucide-react'
import { Screen, ScreenHeader } from '../components/Chrome'
import { Badge, Card, DetailRow, SectionTitle } from '../components/Card'
import { Button } from '../components/Button'
import { EmptyState, Notice } from '../components/Feedback'
import { AppointmentSummary } from '../components/Domain'
import { doctorById, upcomingAppointment, useStore } from '../state/store'
import { fmtDate, fmtTime, relativeDay } from '../lib/time'
import { useBack } from '../lib/useBack'

export function AppointmentDetails() {
  const navigate = useNavigate()
  const back = useBack('/care')
  const { state, showToast } = useStore()
  const appt = upcomingAppointment(state)

  if (!appt) {
    return (
      <Screen className="bg-canvas" header={<ScreenHeader title="Appointment" onBack={() => back()} />}>
        <div className="px-5 pt-6">
          <Card>
            <EmptyState icon={CalendarDays} title="No upcoming appointment" body="Book a follow-up with Dr Erica Morgan." action={<Button onClick={() => navigate('/care/book')}>Book a follow-up</Button>} />
          </Card>
        </div>
      </Screen>
    )
  }

  const doctor = doctorById(state, appt.doctorId)
  const video = appt.visitType === 'video'

  return (
    <Screen
      label="Appointment details"
      className="bg-canvas"
      header={<ScreenHeader title="Appointment" subtitle={`${relativeDay(appt.date)} · ${fmtTime(appt.time)}`} onBack={() => back()} />}
      footer={
        <div className="flex-none border-t border-border bg-surface px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              icon={CalendarCheck}
              onClick={() => {
                showToast({ message: `Keeping ${fmtDate(appt.date, { short: true })} at ${fmtTime(appt.time)}`, tone: 'success' })
                back()
              }}
            >
              Keep
            </Button>
            <Button className="flex-1" onClick={() => navigate('/care/book')}>
              Reschedule
            </Button>
          </div>
        </div>
      }
    >
      <div className="px-5 pb-8">
        <Card>
          <Badge tone="brand" className="mb-3">
            Upcoming · {relativeDay(appt.date)}
          </Badge>
          <AppointmentSummary appt={appt} doctor={doctor} />
        </Card>

        <SectionTitle>Details</SectionTitle>
        <Card className="flex flex-col gap-4">
          <DetailRow icon={Stethoscope} label="Clinician" value={`${doctor.name} · ${doctor.speciality}`} />
          <DetailRow icon={CalendarDays} label="When" value={`${fmtDate(appt.date)}, ${fmtTime(appt.time)}`} />
          <DetailRow icon={video ? Video : MapPin} label={video ? 'Video visit' : 'Location'} value={video ? 'A join link appears here 15 minutes before (simulated).' : `${doctor.clinic}, ${doctor.address}`} />
          <DetailRow icon={MessageSquareText} label="Reason" value={appt.reason} />
        </Card>

        <SectionTitle>Before you go</SectionTitle>
        <div className="flex flex-col gap-2">
          <Button variant="secondary" block icon={ClipboardList} onClick={() => navigate('/journal/prepare')}>
            Prepare for my visit
          </Button>
          <Button variant="ghost" block icon={CalendarPlus} onClick={() => showToast({ message: 'Calendar export is simulated in this prototype' })}>
            Add to calendar
          </Button>
        </div>

        <div className="mt-6">
          <Notice tone="info">Rescheduling replaces this appointment. You won’t end up with two bookings.</Notice>
        </div>
      </div>
    </Screen>
  )
}
