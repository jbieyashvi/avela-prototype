import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../lib/cx'

export function Card({ className, children, as: Tag = 'section', ...rest }: HTMLAttributes<HTMLElement> & { as?: 'section' | 'div' | 'article' | 'li' }) {
  return (
    <Tag className={cx('rounded-[var(--radius-card)] border border-black/[0.03] bg-surface p-3.5 shadow-[var(--shadow-card)]', className)} {...rest}>
      {children}
    </Tag>
  )
}

export type IconTone = 'brand' | 'violet' | 'coral' | 'green' | 'neutral'
const iconTones: Record<IconTone, string> = {
  brand: 'bg-royal-100 text-brand',
  violet: 'bg-action-soft text-action-hover',
  coral: 'bg-attention-soft text-attention-text',
  green: 'bg-success-soft text-success',
  neutral: 'bg-lavender-50 text-text-muted',
}

export function IconTile({ icon: Icon, tone = 'brand', size = 32 }: { icon: LucideIcon; tone?: IconTone; size?: number }) {
  return (
    <span className={cx('inline-flex flex-none items-center justify-center rounded-[10px]', iconTones[tone])} style={{ width: size, height: size }} aria-hidden>
      <Icon size={Math.round(size * 0.5)} strokeWidth={1.9} />
    </span>
  )
}

export function CardHeader({ icon, tone, title, eyebrow, action }: { icon?: LucideIcon; tone?: IconTone; title: ReactNode; eyebrow?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      {icon && <IconTile icon={icon} tone={tone} />}
      <div className="min-w-0 flex-1">
        {eyebrow && <p className="text-caption text-text-muted">{eyebrow}</p>}
        <h3 className="text-headline font-medium">{title}</h3>
      </div>
      {action}
    </div>
  )
}

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'attention' | 'warning' | 'violet'
const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-lavender-50 text-text-muted',
  brand: 'bg-royal-100 text-royal-700',
  success: 'bg-success-soft text-success',
  attention: 'bg-attention-soft text-attention-text',
  warning: 'bg-warning-soft text-warning',
  violet: 'bg-action-soft text-action-hover',
}

export function Badge({ tone = 'neutral', icon: Icon, children, className }: { tone?: BadgeTone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-micro font-medium', badgeTones[tone], className)}>
      {Icon && <Icon size={12} strokeWidth={2.2} aria-hidden />}
      {children}
    </span>
  )
}

export function Avatar({ initials, tone = 'brand', size = 44, label }: { initials: string; tone?: IconTone; size?: number; label?: string }) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cx('inline-flex flex-none items-center justify-center rounded-full font-medium', iconTones[tone])}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </span>
  )
}

/** Key/value row used in review cards and details. */
export function DetailRow({ icon: Icon, label, value }: { icon?: LucideIcon; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon size={16} className="mt-0.5 flex-none text-text-muted" aria-hidden />}
      <div className="min-w-0 flex-1">
        <p className="text-caption text-text-muted">{label}</p>
        <div className="text-body font-medium">{value}</div>
      </div>
    </div>
  )
}

export function SectionTitle({ children, action, id }: { children: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="mb-1.5 mt-5 flex min-h-10 items-center justify-between gap-3 first:mt-0">
      <h2 id={id} className="text-headline font-medium">
        {children}
      </h2>
      {action}
    </div>
  )
}
