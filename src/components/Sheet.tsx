import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './Button'
import { cx } from '../lib/cx'

function useOverlayBehaviour(open: boolean, onClose: () => void, panel: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const el = panel.current
    const focusable = () =>
      Array.from(el?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])') ?? [])
    // Focus first meaningful control (skip the close button when possible)
    window.setTimeout(() => {
      const items = focusable()
      ;(items[1] ?? items[0] ?? el)?.focus()
    }, 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      if (e.key === 'Tab') {
        const items = focusable()
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previouslyFocused?.focus?.()
    }
  }, [open, onClose, panel])
}

function overlayRoot() {
  return document.getElementById('overlay-root') ?? document.body
}

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Bottom sheet, rendered inside the device viewport. */
export function Sheet({ open, onClose, title, description, children, footer }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useOverlayBehaviour(open, onClose, panel)
  if (!open) return null
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 animate-fade-in bg-ink-900/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[88%] animate-sheet flex-col rounded-t-[var(--radius-sheet)] bg-surface shadow-[var(--shadow-sheet)] outline-none"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-ink-200" aria-hidden />
        <div className="flex items-start gap-3 px-4 pb-1 pt-2">
          <div className="min-w-0 flex-1 pt-2">
            <h2 id={titleId} className="text-[19px] font-medium leading-6">
              {title}
            </h2>
            {description && <div className="mt-1 text-callout text-text-muted">{description}</div>}
          </div>
          <IconButton icon={X} label="Close" tone="plain" onClick={onClose} className="-mr-1.5" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-2">{children}</div>
        {footer && <div className="border-t border-border px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">{footer}</div>}
      </div>
    </div>,
    overlayRoot(),
  )
}

export interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  actions: ReactNode
  tone?: 'default' | 'attention'
}

/** Centered confirmation dialog for consequential choices. */
export function Dialog({ open, onClose, title, children, actions, tone = 'default' }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useOverlayBehaviour(open, onClose, panel)
  if (!open) return null
  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 animate-fade-in bg-ink-900/45" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx('relative w-full animate-rise rounded-[var(--radius-card)] bg-surface p-4 shadow-[var(--shadow-float)] outline-none', tone === 'attention' && 'border-t-4 border-attention')}
      >
        <h2 id={titleId} className="text-headline font-medium">
          {title}
        </h2>
        <div className="mt-1.5 text-callout text-text-muted">{children}</div>
        <div className="mt-4 flex flex-col gap-2">{actions}</div>
      </div>
    </div>,
    overlayRoot(),
  )
}
