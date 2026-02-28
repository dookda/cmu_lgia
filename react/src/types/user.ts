export type AuthRole = 'admin' | 'editor' | 'viewer' | 'pending'

export interface User {
  id: number
  username: string
  displayname: string
  email: string
  ts: string
  auth: AuthRole
  division: string
}

export interface UpdateUserPayload {
  username: string
  email: string
  auth: AuthRole
  division: string
}
