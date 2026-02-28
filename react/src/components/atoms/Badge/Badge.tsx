import type { ColorVariant } from '../../../tokens'

interface BadgeProps {
  label: string | number
  variant?: ColorVariant
}

export function Badge({ label, variant = 'primary' }: BadgeProps) {
  return (
    <span className={`badge bg-${variant}`}>{label}</span>
  )
}
