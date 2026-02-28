interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeStyle: Record<NonNullable<AvatarProps['size']>, React.CSSProperties> = {
  sm: { width: 32, height: 32 },
  md: { width: 40, height: 40 },
  lg: { width: 56, height: 56 },
}

import type React from 'react'

export function Avatar({ src, alt = 'avatar', size = 'md' }: AvatarProps) {
  if (!src) {
    return (
      <div className="user-avatar" style={sizeStyle[size]}>
        <em className="icon ni ni-user-alt" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className="avatar"
      style={{ ...sizeStyle[size], borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
    />
  )
}
