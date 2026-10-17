import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cx } from '../lib/cx'

export function Field({ label, hint, error, children, id }: { label: string; hint?: ReactNode; error?: string; children: ReactNode; id: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-medium text-text">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-caption font-medium text-attention-text">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

const inputBase =
  'w-full rounded-[var(--radius-md)] border bg-surface px-3.5 text-callout text-text placeholder:text-text-subtle transition-colors duration-150 focus:border-action focus:outline-none focus:ring-4 focus:ring-action/12'

export function TextField({ label, hint, error, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cx(inputBase, 'min-h-11', error ? 'border-attention' : 'border-border', className)}
        {...rest}
      />
    </Field>
  )
}

export function TextArea({ label, hint, error, className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: ReactNode; error?: string }) {
  const id = useId()
  return (
    <Field label={label} hint={hint} error={error} id={id}>
      <textarea
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={cx(inputBase, 'min-h-24 resize-none py-2.5 leading-5', error ? 'border-attention' : 'border-border', className)}
        {...rest}
      />
    </Field>
  )
}

/** Slim, horizontally scrollable filter tabs. Each tab keeps a 44px touch area around a 32px pill. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  onDark,
  label,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
  onDark?: boolean
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar -mx-4 flex gap-0.5 overflow-x-auto px-3">
      {options.map((o) => {
        const active = o.id === value
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className="group flex min-h-11 flex-none items-center rounded-full px-0.5 focus-visible:outline-none"
          >
            <span
              className={cx(
                'flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-callout font-medium transition-colors duration-150 group-focus-visible:ring-2 group-focus-visible:ring-offset-1',
                onDark
                  ? active
                    ? 'bg-white text-royal-500 shadow-[0_2px_8px_rgba(10,20,90,0.18)] group-focus-visible:ring-white group-focus-visible:ring-offset-royal-500'
                    : 'text-white/80 hover:bg-white/12 hover:text-white group-focus-visible:ring-white group-focus-visible:ring-offset-royal-500'
                  : active
                    ? 'bg-ink-900 text-white group-focus-visible:ring-action'
                    : 'text-text-muted hover:bg-lavender-100 hover:text-text group-focus-visible:ring-action',
              )}
            >
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function SegmentedControl<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full bg-lavender-100 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={o.id === value}
          onClick={() => onChange(o.id)}
          className={cx(
            'min-h-9 flex-1 rounded-full px-3 text-callout font-medium transition-colors duration-150',
            o.id === value ? 'bg-surface text-text shadow-sm' : 'text-text-muted hover:text-text',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Large selectable option card (radio semantics). */
export function ChoiceCard({
  selected,
  onSelect,
  title,
  body,
  icon: Icon,
  disabled,
  trailing,
}: {
  selected: boolean
  onSelect: () => void
  title: ReactNode
  body?: ReactNode
  icon?: LucideIcon
  disabled?: boolean
  trailing?: ReactNode
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={cx(
        'flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-lg)] border p-3 text-left transition-colors duration-150',
        selected ? 'border-action bg-action-soft/60 ring-1 ring-action' : 'border-border bg-surface hover:bg-surface-muted',
        disabled && 'opacity-50',
      )}
    >
      {Icon && (
        <span className={cx('flex size-8 flex-none items-center justify-center rounded-[10px]', selected ? 'bg-action text-white' : 'bg-lavender-50 text-text-muted')}>
          <Icon size={16} aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-callout font-medium">{title}</span>
        {body && <span className="block text-caption text-text-muted">{body}</span>}
      </span>
      {trailing}
      <span className={cx('flex size-5 flex-none items-center justify-center rounded-full border-2', selected ? 'border-action bg-action text-white' : 'border-ink-200')} aria-hidden>
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  )
}

/** Accessible toggle switch. */
export function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  const id = useId()
  return (
    <div className="flex min-h-11 items-center gap-3">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="text-callout font-medium">
          {label}
        </label>
        {description && <p className="text-caption text-text-muted">{description}</p>}
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-10 flex-none rounded-full after:absolute after:-inset-2.5 after:content-[""] transition-colors duration-150', checked ? 'bg-action' : 'bg-ink-200')}
      >
        <span className={cx('absolute left-0 top-0.5 size-5 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-[18px]' : 'translate-x-0.5')} />
      </button>
    </div>
  )
}
