import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'inverse' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-action text-white hover:bg-action-hover disabled:bg-ink-200 disabled:text-text-subtle',
  secondary: 'bg-surface text-text border border-border hover:bg-surface-muted disabled:text-text-subtle',
  soft: 'bg-action-soft text-action-hover hover:bg-[#e3defc] disabled:opacity-50',
  ghost: 'bg-transparent text-action-hover hover:bg-action-soft disabled:text-text-subtle',
  inverse: 'bg-white/15 text-white border border-white/25 hover:bg-white/25 backdrop-blur',
  danger: 'bg-surface text-attention-text border border-border hover:bg-attention-soft',
}

const sizes: Record<ButtonSize, string> = {
  // sm is visually 32px; the ::after extends the touch area to 44px.
  sm: 'relative h-8 px-3.5 text-callout gap-1.5 rounded-full after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[""]',
  md: 'min-h-11 px-5 text-callout gap-1.5 rounded-full',
  lg: 'min-h-12 px-6 text-body gap-2 rounded-full',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  block?: boolean
  children?: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', icon: Icon, iconRight: IconRight, block, className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        'inline-flex flex-none items-center justify-center whitespace-nowrap font-medium transition-colors duration-150 select-none',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden />}
      {children}
      {IconRight && <IconRight size={size === 'sm' ? 14 : 16} strokeWidth={2} aria-hidden />}
    </button>
  )
})

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string
  tone?: 'surface' | 'glass' | 'plain' | 'action'
  badge?: boolean
  /** sm = 36px visual (44px touch area) */
  size?: 'sm' | 'md'
}

const tones = {
  surface: 'bg-surface text-text border border-border hover:bg-surface-muted',
  glass: 'bg-white/18 text-white hover:bg-white/28 backdrop-blur',
  plain: 'bg-transparent text-text hover:bg-black/5',
  action: 'bg-action text-white hover:bg-action-hover',
}

export function IconButton({ icon: Icon, label, tone = 'surface', badge, size = 'md', className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cx(
        'relative inline-flex flex-none items-center justify-center rounded-full transition-colors duration-150',
        size === 'sm' ? 'size-9 after:absolute after:-inset-1 after:content-[""]' : 'size-11',
        tones[tone],
        className,
      )}
      {...rest}
    >
      <Icon size={size === 'sm' ? 17 : 19} strokeWidth={2} aria-hidden />
      {badge && <span className={cx('absolute size-2 rounded-full bg-attention ring-2 ring-white', size === 'sm' ? 'right-2 top-2' : 'right-2.5 top-2.5')} aria-hidden />}
    </button>
  )
}
