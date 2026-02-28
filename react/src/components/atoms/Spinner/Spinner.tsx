interface SpinnerProps {
  size?: 'sm' | 'md'
  className?: string
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <div
      className={`spinner-border ${size === 'sm' ? 'spinner-border-sm' : ''} ${className}`.trim()}
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  )
}
