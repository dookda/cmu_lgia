// Typed fetch wrapper — no axios, just native fetch

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new ApiError(response.status, (body as { detail?: string; error?: string }).detail ?? (body as { error?: string }).error ?? response.statusText)
  }

  return response.json() as Promise<T>
}

const get = <T>(url: string) => request<T>(url)

const post = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'POST', body: JSON.stringify(body) })

const put = <T>(url: string, body: unknown) =>
  request<T>(url, { method: 'PUT', body: JSON.stringify(body) })

const del = <T>(url: string) => request<T>(url, { method: 'DELETE' })

// ─── Auth ───────────────────────────────────────────────────────────────────

import type { LoginPayload, LoginResponse, ProfileResponse, TasabanInfo } from '../types/auth'

export const authApi = {
  login: (payload: LoginPayload) => post<LoginResponse>('/auth/local/login', payload),
  logout: () => get<{ success: boolean }>('/auth/logout'),
  profile: (role: string) => get<ProfileResponse>(`/auth/profile/${role}`),
  profileDetail: () => get<{ success: boolean; user: Record<string, string> }>('/auth/profiledetail'),
  updateProfile: (data: { username?: string; email?: string; division?: string }) => put<{ success: boolean }>('/auth/profile', data),
}

// ─── Info ────────────────────────────────────────────────────────────────────

export const infoApi = {
  get: () => get<TasabanInfo>('/api/v2/info'),
}

// ─── Layers ──────────────────────────────────────────────────────────────────

import type { Layer, CreateLayerPayload, CreateLayerResponse, GeoFeature } from '../types/layer'

export const layersApi = {
  list: () => get<Layer[]>('/api/v2/layer_names'),
  getLayerInfo: (formid: string) => get<Layer[]>(`/api/v2/layer_names/${formid}`),
  delete: (gid: number) => del<{ success: boolean }>(`/api/v2/layer_names/${gid}`),
  create: (payload: CreateLayerPayload) => post<CreateLayerResponse>('/api/v2/create_table', payload),
  loadFeatures: (formid: string) => post<GeoFeature[]>('/api/v2/load_layer', { formid }),
  loadFeatureById: (formid: string, refid: string) =>
    get<Record<string, unknown>[]>(`/api/v2/load_layer/${formid}/${refid}`),
  loadDescription: (formid: string) => get<{ col_id: string; col_name: string; col_type: string; col_desc: string }[]>(`/api/v2/load_layer_description/${formid}`),
  loadFeatureStyle: (formid: string, refid: string) =>
    get<{ style?: string }>(`/api/v2/load_feature_style/${formid}/${refid}`),
  uploadCsv: (formData: FormData) =>
    fetch('/api/v2/upload_csv', { method: 'POST', body: formData }).then(async (r) => {
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        throw new ApiError(r.status, (body as { detail?: string }).detail ?? r.statusText)
      }
      return r.json() as Promise<{ success: boolean; formid: string; rows: number; columns: string[] }>
    }),
  insertRow: (payload: {
    formid: string; refid: string; geojson?: string; properties?: Record<string, string>
  }) => post<{ success: boolean }>('/api/v2/insert_row', payload),
  updateRow: (formid: string, refid: string, payload: Record<string, unknown>) =>
    put<{ success: boolean }>(`/api/v2/update_row/${formid}/${refid}`, payload),
  updateFeature: (payload: { formid: string; refid: string; geojson: string; style: string }) =>
    put<{ success: boolean }>('/api/v2/update_feature', payload),
  updateFeatureStyle: (payload: { formid: string; refid: string; style: string }) =>
    put<{ success: boolean }>('/api/v2/update_feature_style', payload),
  deleteRow: (payload: { formid: string; refid: string }) =>
    post<{ success: boolean }>('/api/v2/delete_row', payload),
  createColumn: (formid: string, payload: { col_id: string; col_name: string; col_type: string; col_desc: string }) =>
    post<{ success: boolean }>(`/api/v2/create_column/${formid}`, payload),
  deleteColumn: (formid: string, colid: string) =>
    del<{ success: boolean }>(`/api/v2/delete_column/${formid}/${colid}`),
  updateColumn: (formid: string, refid: string, payload: Record<string, string>) =>
    put<{ success: boolean }>(`/api/v2/update_column/${formid}/${refid}`, payload),
}

// ─── Divisions ───────────────────────────────────────────────────────────────

import type { Division, CreateDivisionPayload, UpdateDivisionPayload } from '../types/division'

export const divisionsApi = {
  list: () => get<Division[]>('/api/v2/divisions'),
  create: (payload: CreateDivisionPayload) => post<Division>('/api/v2/divisions', payload),
  update: (id: number, payload: UpdateDivisionPayload) => put<Division>(`/api/v2/divisions/${id}`, payload),
  delete: (id: number) => del<{ success: boolean }>(`/api/v2/divisions/${id}`),
}

// ─── Users ───────────────────────────────────────────────────────────────────

import type { User, UpdateUserPayload } from '../types/user'

export const usersApi = {
  list: () => get<User[]>('/api/v2/users'),
  update: (id: number, payload: UpdateUserPayload) => put<User>(`/api/v2/users/${id}`, payload),
  delete: (id: number) => del<{ success: boolean }>(`/api/v2/users/${id}`),
}

// ─── Geo ─────────────────────────────────────────────────────────────────────

export const geoApi = {
  utmToLatLng: (easting: number, northing: number, zone = 47, hemisphere = 'N') =>
    post<{ longitude: number; latitude: number }>('/geoapi/latlng2utm', { easting, northing, zone, hemisphere }),
}

// ─── Admin ───────────────────────────────────────────────────────────────────

export const adminApi = {
  updateInfo: (formData: FormData) =>
    fetch('/api/v2/info', { method: 'POST', body: formData }).then((r) => r.json()) as Promise<TasabanInfo>,
}
