// Design token constants — mirrors tokens.css for use in TypeScript/inline styles

export const colors = {
  primary:     'var(--color-primary)',
  primaryDim:  'var(--color-primary-dim)',
  success:     'var(--color-success)',
  successDim:  'var(--color-success-dim)',
  warning:     'var(--color-warning)',
  warningDim:  'var(--color-warning-dim)',
  danger:      'var(--color-danger)',
  dangerDim:   'var(--color-danger-dim)',
  info:        'var(--color-info)',
  infoDim:     'var(--color-info-dim)',

  text:        'var(--color-text)',
  textMuted:   'var(--color-text-muted)',
  border:      'var(--color-border)',
  bg:          'var(--color-bg)',
  surface:     'var(--color-surface)',
} as const

export const space = {
  1:  'var(--space-1)',
  2:  'var(--space-2)',
  3:  'var(--space-3)',
  4:  'var(--space-4)',
  5:  'var(--space-5)',
  6:  'var(--space-6)',
  8:  'var(--space-8)',
  10: 'var(--space-10)',
  12: 'var(--space-12)',
  16: 'var(--space-16)',
} as const

export const text = {
  xs:   'var(--text-xs)',
  sm:   'var(--text-sm)',
  base: 'var(--text-base)',
  lg:   'var(--text-lg)',
  xl:   'var(--text-xl)',
  '2xl': 'var(--text-2xl)',
} as const

export const radius = {
  sm:   'var(--radius-sm)',
  md:   'var(--radius-md)',
  lg:   'var(--radius-lg)',
  full: 'var(--radius-full)',
} as const

export const shadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
} as const

export type ColorVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'light'
