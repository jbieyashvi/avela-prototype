import { useState, type FormEvent, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { ArrowLeft, ArrowUp, BookHeart, HeartPulse, Sun, User, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { IconButton } from './Button'
import { Orb } from './Orb'
import { cx } from '../lib/cx'

/** Full-height screen with its own scroll region. Fixed chrome never overlaps content. */
export function Screen({ children, header, footer, className, scrollClassName, label }: { children: ReactNode; header?: ReactNode; footer?: ReactNode; className?: string; scrollClassName?: string; label?: string }) {
  return (
    <div className={cx('flex h-full min-h-0 flex-col', className)}>
      {header}
      <main aria-label={label} className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain', scrollClassName)}>
        {children}
      </main>
      {footer}
    </div>
  )
}

export function ScreenHeader({ title, onBack, backLabel = 'Back', onClose, trailing, subtitle, transparent }: { title?: ReactNode; subtitle?: ReactNode; onBack?: () => void; backLabel?: string; onClose?: () => void; trailing?: ReactNode; transparent?: boolean }) {
  return (
    <header className={cx('flex min-h-14 flex-none items-center gap-1.5 px-2 pt-[env(safe-area-inset-top)]', !transparent && 'bg-canvas')}>
      {onBack ? <IconButton icon={ArrowLeft} label={backLabel} tone="plain" onClick={onBack} /> : <span className="w-2" />}
      <div className="min-w-0 flex-1">
        {title && <h1 className="truncate text-[18px] font-medium leading-6">{title}</h1>}
        {subtitle && <p className="truncate text-caption text-text-muted">{subtitle}</p>}
      </div>
      {trailing}
      {onClose && <IconButton icon={X} label="Close" tone="surface" onClick={onClose} />}
    </header>
  )
}

const TABS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Today', icon: Sun, end: true },
  { to: '/care', label: 'Care', icon: HeartPulse },
  { to: '/journal', label: 'Journal', icon: BookHeart },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  return (
    <nav aria-label="Main" className="flex-none border-t border-border/70 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <ul className="flex">
        {TABS.map((t) => (
          <li key={t.to} className="flex-1">
            <NavLink
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                cx('flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-micro font-medium transition-colors duration-150', isActive ? 'text-brand' : 'text-text-muted hover:text-text')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('flex h-6 w-11 items-center justify-center rounded-full transition-colors duration-150', isActive && 'bg-royal-100')}>
                    <t.icon size={19} strokeWidth={isActive ? 2.1 : 1.8} aria-hidden />
                  </span>
                  {t.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Orb-shaped voice entry button. */
export function VoiceButton({ onClick, size = 44 }: { onClick: () => void; size?: number }) {
  return (
    <button type="button" onClick={onClick} aria-label="Talk to Avela (voice mode)" title="Voice mode" className="relative flex flex-none items-center justify-center rounded-full" style={{ width: Math.max(44, size), height: Math.max(44, size) }}>
      <Orb size={size - 10} />
    </button>
  )
}

/** Composer. `onOpen` renders it as an entry point (Home); `onSend` makes it a live input. */
export function Composer({ placeholder = 'Ask anything about your care…', onOpen, onSend, onVoice, disabled }: { placeholder?: string; onOpen?: () => void; onSend?: (text: string) => void; onVoice: () => void; disabled?: boolean }) {
  const [value, setValue] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const text = value.trim()
    if (!text || !onSend) return
    onSend(text)
    setValue('')
  }
  return (
    <div className="flex items-center gap-2">
      {onOpen ? (
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-12 min-w-0 flex-1 items-center rounded-full border border-black/[0.04] bg-surface pl-5 pr-4 text-left text-callout text-text-muted shadow-[var(--shadow-card)] transition-colors hover:text-text"
        >
          <span className="truncate">{placeholder}</span>
        </button>
      ) : (
        <form onSubmit={submit} className="flex min-h-12 min-w-0 flex-1 items-center rounded-full border border-black/[0.04] bg-surface pl-5 pr-1 shadow-[var(--shadow-card)] focus-within:border-action/60 focus-within:ring-4 focus-within:ring-action/10">
          <label htmlFor="composer" className="sr-only">
            Message Avela
          </label>
          <input
            id="composer"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-callout text-text placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={!value.trim() || disabled}
            className="flex size-10 flex-none items-center justify-center rounded-full bg-action text-white transition-colors disabled:bg-lavender-100 disabled:text-text-subtle"
          >
            <ArrowUp size={17} strokeWidth={2.2} aria-hidden />
          </button>
        </form>
      )}
      <VoiceButton onClick={onVoice} size={48} />
    </div>
  )
}
