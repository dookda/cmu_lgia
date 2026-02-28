import type { ButtonHTMLAttributes } from 'react'
import type { ColorVariant } from '../../../tokens'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ColorVariant
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClass: Record<ColorVariant, string> = {
  primary: 'btn-primary',
  success: 'btn-success',
  warning: 'btn-warning',
  danger:  'btn-danger',
  info:    'btn-info',
  light:   'btn-light',
}

const sizeClass = { sm: 'btn-sm', md: '', lg: 'btn-lg' }

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`btn ${variantClass[variant]} ${sizeClass[size]} ${className}`.trim()}
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && (
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
