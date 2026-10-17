# Avela — AI personal health companion (prototype)

A self-initiated product design concept. Avela helps someone keep track of their care: medication reminders, appointments, care tasks, a symptom journal and getting ready for a visit. You can do this by tapping through the screens, typing to the assistant, or talking to it in voice mode.

> **Prototype only.** All people, clinicians, medications and data are fictional. There is no backend and no AI model. Assistant replies come from a deterministic local script, notifications are simulated, and nothing leaves the browser. Avela never gives a diagnosis, changes a dose or suggests extra doses.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 (or the port Vite prints)
npm run build        # type-check + production build
```

On desktop the app is shown in a centred phone frame next to a **demo navigator**. The navigator has a device-width toggle (375 / 390 / 430), jump links for every flow and **Reset demo**. On a phone-sized viewport the app fills the screen.

Stack: Vite, React 19, TypeScript, Tailwind CSS v4, lucide-react, react-router.

## Routes

| Route | Experience | Bottom nav |
| --- | --- | --- |
| `/` | **Today**: greeting, filter tabs, mood, next appointment, to-do list, medication, visit prep, care team, assistant composer | yes |
| `/assistant` | **Assistant** chat: action cards, typed prompts, review-before-confirm action cards. `?fresh=1` clears the chat; `?prompt=…` sends a prompt | no |
| `/voice` | **Voice** mode: orb, transcript, waveform, every state. `?demo=1` runs the scripted demo with no microphone | no |
| `/care` | Care hub: appointments, medication, tasks, care team | yes |
| `/care/medications` | **Medication schedule**: day navigation, upcoming and logged doses, last 7 days, reminders | yes |
| `/care/appointment` | Appointment details: keep or reschedule | yes |
| `/care/book` | **Appointment booking / rescheduling**. `?step=type\|doctor\|time\|reason\|review` deep-links into a step | no |
| `/journal` | **Journal**: daily check-in (mood, energy, note) and recent entries | yes |
| `/journal/prepare` | **Visit prep**: summary based on your entries, topics, questions, editable draft, save and (simulated) share | no |
| `/profile` | Settings (read aloud, simulated notifications), reminder preview, privacy, Reset demo | yes |
| `/design-system` | Design system handoff page (full width, outside the phone frame) | n/a |

## Demo flows

1. **Set a reminder by voice.** Open `/voice?demo=1` (or *Run demo voice* in the navigator). It plays this exchange: "Remind me to take my medication every evening." → "What time would you like the reminder?" → "Eight PM." Then an action review card appears. **Confirm** sets a daily 8:00 PM reminder, which shows on Today and in Medication. **Cancel** leaves everything unchanged.
2. **Assistant prompts.** The navigator links send these prompts:
   - set a medication reminder
   - book a follow-up
   - add a blood test task
   - prepare for a visit
   - an unsupported request, which gets a safe fallback

   Every change is shown for review before it is applied.
3. **Medication.**
   - Log a dose as taken, then undo it (Undo only works today).
   - Snooze a dose, or set or edit its reminder.
   - Browse ±7 days. Past days with nothing logged say so neutrally ("doesn't mean a dose was missed").
   - Profile → *Preview a medication reminder* shows the simulated banner.
4. **Reschedule.** Today or Care → appointment → *Reschedule*. The steps are visit type → clinician → time → reason → review → confirm.
   - **Thu 28 May, 10:30 AM fails on the first try** ("just taken by someone else… Nothing was booked") so you can see the error state. Retrying succeeds.
   - Rescheduling *replaces* the appointment, so there are never duplicates.
5. **Journal and visit prep.**
   - Do today's check-in, then *Prepare for my visit*.
   - Toggle topics, edit questions and the draft, then review and save.
   - After saving, share with Dr Morgan or Maya (simulated) after a review step.
6. **Reset.** *Reset demo* (navigator or Profile) restores the original story.

State is saved in `localStorage` (`avela-demo-state`). The demo clock is fixed at **Mon 25 May 2026, 2:30 PM** so the story always lines up.

## Project structure

```
src/
  App.tsx                 routes, device frame, demo navigator, simulated reminder banner
  index.css               Tailwind @theme tokens, orb / waveform / motion, reduced-motion rules
  lib/tokens.ts           design tokens as data (used by /design-system)
  lib/assistant.ts        deterministic assistant engine (intents → replies + proposed actions)
  lib/visitPrep.ts        builds the visit-prep summary and draft from journal entries
  lib/time.ts             demo clock + date/time formatting
  lib/useBack.ts          back navigation with a route fallback for deep links
  state/                  store (React context + localStorage), types, hooks
  data/seed.ts            fictional seed story
  components/             UI kit (below)
  screens/                one file per screen
```

## Components

| File | Components |
| --- | --- |
| `Button.tsx` | `Button` (primary, secondary, soft, ghost, danger; sizes sm/md/lg), `IconButton` |
| `Card.tsx` | `Card`, `CardHeader`, `IconTile`, `Badge`, `Avatar`, `DetailRow`, `SectionTitle` |
| `Chrome.tsx` | `Screen` (header / scroll / footer layout), `ScreenHeader`, `BottomNav`, `Composer`, `VoiceButton` |
| `Orb.tsx` | `Orb` (idle, listening, thinking, speaking, paused; respects reduced motion) |
| `Form.tsx` | `Field`, `TextField`, `TextArea`, `FilterChips`, `SegmentedControl`, `ChoiceCard`, `Switch` |
| `Feedback.tsx` | `Notice`, `EmptyState`, `Skeleton`, `ToastHost` |
| `Sheet.tsx` | `Sheet` (bottom sheet), `Dialog` (both portal into the device frame and trap focus) |
| `Domain.tsx` | `MedicationReminderCard`, `AppointmentCard`, `AppointmentSummary`, `TaskItem`, `TaskList`, `DateStrip`, `SlotGrid`, `MoodScale`, `EnergyScale`, `ActionReviewCard` |
| `Sheets.tsx` | `AddTaskSheet`, `CheckInSheet`, `ReminderSheet`, `AddReminderSheet`, `SnoozeSheet`, `AddCareMemberSheet` |

## Tokens

Tokens are defined as CSS variables in the `@theme` block of `src/index.css` and mirrored as data in `src/lib/tokens.ts`. `/design-system` shows them all.

**Primitive colours**

| Token | Value |
| --- | --- |
| Royal blue (gradient top, brand) | `#183BE2` |
| Royal 400 (gradient middle) | `#5065EF` |
| Periwinkle (gradient lower) | `#B7BFFB` |
| Gradient base | `#F0F1FC` |
| Lavender canvas (assistant) | `#F1F1FA` |
| Surface | `#FFFFFF` |
| Ink / primary text | `#191B2A` |
| Secondary text | `#64697D` |
| Subtle border | `#E7E8F2` |
| Violet (primary action) | `#6048E8` |
| Coral (attention, stop, a few accent pills) | `#EF6B61` |

Cyan and magenta appear mainly in the orb; coral, cyan and pink are used sparingly elsewhere.

**Other tokens**

- **Semantic colours:** `action`, `action-hover`, `text`, `text-muted`, `border`, plus `success`, `warning` and `attention` (each with a `-soft` background).
- **Type:** Poppins 400 / 500 / 600, self-hosted via `@fontsource/poppins` (no 700–800). Scale: display 28/35, title 22/28, headline 15/20, body 14/20, callout 13/18, caption 12/16, micro 11/16.
- **Radii:** 10 icon tiles, 12 controls, 14 choice cards, 18 cards, 24 sheets, full for pills.
- **Elevation:** `--shadow-card`, `--shadow-float`.
- **Motion:** 150–300 ms, ease-out. Everything non-essential is disabled under `prefers-reduced-motion`.

## Accessibility notes

- Touch targets are at least 44 px. Compact visual buttons (32–36 px) extend their hit area with an invisible `::after`.
- Visible focus rings.
- Sheets and dialogs trap and restore focus and close on Esc.
- Live regions for the voice state and toasts.
- Charts and grids have text equivalents.
- Safe-area insets are respected.
- The composer and footers sit outside the scroll area, so they never cover content.
