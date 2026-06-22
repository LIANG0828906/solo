import type {
  MeetingRoom,
  Device,
  Booking,
  BookingCreateInput,
  DeviceStatus,
} from '@/types'

const API = '/api'

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || `Request failed: ${res.status}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/csv')) return (await res.text()) as unknown as T
  return res.json()
}

export const apiService = {
  getRooms: (): Promise<MeetingRoom[]> => request('/rooms'),
  getDevices: (): Promise<Device[]> => request('/devices'),
  updateDeviceStatus: (
    id: string,
    status: DeviceStatus,
    roomId?: string | null
  ): Promise<Device> =>
    request(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, roomId }),
    }),
  getBookings: (startDate?: string, endDate?: string): Promise<Booking[]> => {
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    const qs = params.toString()
    return request(`/bookings${qs ? `?${qs}` : ''}`)
  },
  createBooking: (data: BookingCreateInput): Promise<Booking> =>
    request('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteBooking: (id: string): Promise<{ success: boolean; reason?: string }> =>
    request(`/bookings/${id}`, { method: 'DELETE' }),
  exportBookingsCsv: (days = 7): Promise<string> =>
    request(`/bookings/export?days=${days}`),
}
