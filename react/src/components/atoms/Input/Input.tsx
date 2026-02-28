import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
      {...props}
    />
  )
}
