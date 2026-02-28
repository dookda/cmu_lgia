import { useEffect, useState } from 'react'
import type { ColorVariant } from '../../../tokens'

interface AlertProps {
  message: string
  variant?: ColorVariant
  duration?: number
  onDismiss?: () => void
}

export function Alert({ message, variant = 'primary', duration = 3000, onDismiss }: AlertProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onDismiss?.()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onDismiss])

  if (!visible) return null

  return (
    <div className={`alert alert-${variant} alert-dismissible`} role="alert">
      {message}
      <button
        type="button"
        className="btn-close"
        onClick={() => { setVisible(false); onDismiss?.() }}
        aria-label="Close"
      />
    </div>
  )
}
