import { cx } from '../lib/cx'

export type OrbState = 'idle' | 'listening' | 'processing' | 'speaking' | 'paused'

/** Luminous AI orb. Layered gradients + blur; each state has its own motion. */
export function Orb({ size = 64, state = 'idle', className }: { size?: number; state?: OrbState; className?: string }) {
  return (
    <div className={cx('orb', className)} data-state={state} style={{ ['--orb-size' as string]: `${size}px` }} aria-hidden>
      <div className="orb__glow" />
      <div className="orb__body">
        <div className="orb__blob orb__blob--cyan" />
        <div className="orb__blob orb__blob--violet" />
        <div className="orb__blob orb__blob--magenta" />
        <div className="orb__blob orb__blob--coral" />
        <div className="orb__swirl" />
        <div className="orb__sheen" />
      </div>
      <div className="orb__ring" />
      <div className="orb__ring" />
    </div>
  )
}
