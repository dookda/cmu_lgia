import { Avatar } from '../../atoms/Avatar/Avatar'

interface UserBadgeProps {
  pictureUrl?: string | null
  displayName?: string
  size?: 'sm' | 'md'
}

export function UserBadge({ pictureUrl, displayName, size = 'sm' }: UserBadgeProps) {
  return (
    <div className="user-toggle d-flex align-items-center gap-2">
      <div className={`user-avatar ${size}`}>
        <Avatar src={pictureUrl} size={size} />
      </div>
      {displayName && <span className="lead-text d-none d-md-inline">{displayName}</span>}
    </div>
  )
}
