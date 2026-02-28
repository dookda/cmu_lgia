import type { InputHTMLAttributes } from 'react'
import { Input } from '../../atoms/Input/Input'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function FormField({ label, error, hint, id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="form-group mb-3">
      <label className="form-label" htmlFor={fieldId}>
        {label}
      </label>
      <Input id={fieldId} error={error} {...inputProps} />
      {error && <div className="invalid-feedback">{error}</div>}
      {hint && !error && <div className="form-text text-muted">{hint}</div>}
    </div>
  )
}
