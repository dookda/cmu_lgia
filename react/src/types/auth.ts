export type UserRole = 'admin' | 'editor' | 'viewer'

export interface UserProfile {
  pictureUrl: string
  displayName: string
  userId?: string
}

export interface ProfileResponse {
  success: boolean
  auth: boolean
  user: UserProfile
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResponse {
  success: boolean
  message?: string
}

export interface TasabanInfo {
  name: string
  img: string
}
