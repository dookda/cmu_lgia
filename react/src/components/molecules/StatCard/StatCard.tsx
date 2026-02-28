interface StatCardProps {
  label: string
  value: string | number
  icon?: string
}

export function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="card card-full h-100">
      <div className="card-inner">
        <div className="card-title-group">
          <div className="card-title">
            <label className="f" style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              {label}
            </label>
            <h6 className="title f mt-1">{value}</h6>
          </div>
          {icon && (
            <div className="card-tools">
              <em className={`icon ni ${icon}`} style={{ fontSize: 'var(--text-xl)', color: 'var(--color-primary)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
