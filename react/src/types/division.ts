export interface Division {
  id: number
  division_name: string
  created_at: string
}

export interface CreateDivisionPayload {
  division_name: string
}

export interface UpdateDivisionPayload {
  division_name: string
}
