import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cx } from '../lib/cx'
import { useStore } from '../state/store'

export type NoticeTone = 'info' | 'success' | 'attention' | 'warning'
const noticeTones: Record<NoticeTone, { cls: string; icon: LucideIcon }> = {
  info: { cls: 'bg-royal-100/70 text-royal-700', icon: Info },
  success: { cls: 'bg-success-soft text-success', icon: CheckCircle2 },
  attention: { cls: 'bg-attention-soft text-attention-text', icon: AlertCircle },
  warning: { cls: 'bg-warning-soft text-warning', icon: AlertCircle },
}

/** Contextual inline notice. Use sparingly — never as a repeating banner. */
export function Notice({ tone = 'info', title, children, action, icon }: { tone?: NoticeTone; title?: ReactNode; children?: ReactNode; action?: ReactNode; icon?: LucideIcon }) {
  const t = noticeTones[tone]
  const Icon = icon ?? t.icon
  return (
    <div role={tone === 'attention' ? 'alert' : 'status'} className={cx('flex gap-2.5 rounded-[var(--radius-md)] p-3', t.cls)}>
      <Icon size={16} className="mt-0.5 flex-none" aria-hidden />
      <div className="min-w-0 flex-1 text-callout">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className={cx(title && 'mt-0.5', 'text-text')}>{children}</div>}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-4 py-6 text-center">
      <span className="mb-2.5 flex size-10 items-center justify-center rounded-full bg-lavender-50 text-text-muted" aria-hidden>
        <Icon size={18} />
      </span>
      <p className="text-callout font-medium">{title}</p>
      {body && <p className="mt-0.5 max-w-[260px] text-caption text-text-muted">{body}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} aria-hidden />
}

/** Global toast, rendered above bottom chrome inside the device. */
export function ToastHost() {
  const { toast, dismissToast } = useStore()
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[calc(88px+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4" aria-live="polite">
      {toast && (
        <div key={toast.id} className="pointer-events-auto flex w-full max-w-[360px] animate-rise items-center gap-3 rounded-[16px] bg-ink-900 py-1.5 pl-4 pr-2 text-callout text-white shadow-[var(--shadow-float)]">
          {toast.tone === 'success' && <CheckCircle2 size={16} className="flex-none text-[#7fe0b0]" aria-hidden />}
          <p className="min-w-0 flex-1 py-1.5">{toast.message}</p>
          {toast.action && (
            <button
              className="min-h-11 flex-none rounded-full px-3 font-medium text-[#c9c1ff] hover:bg-white/10"
              onClick={() => {
                toast.action!.onClick()
                dismissToast()
              }}
            >
              {toast.action.label}
            </button>
          )}
          <button aria-label="Dismiss" onClick={dismissToast} className="flex size-11 flex-none items-center justify-center rounded-full hover:bg-white/10">
            <X size={16} aria-hidden />
          </button>
        </div>
      )}
    </div>
  )
}
