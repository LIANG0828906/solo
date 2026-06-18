import type { Report, ReportsResponse, QueryParams, FacilityType, ReportStatus } from './types'

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export async function getReports(params?: QueryParams): Promise<ReportsResponse> {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value))
      }
    })
  }
  const queryString = searchParams.toString()
  const url = `/api/reports${queryString ? `?${queryString}` : ''}`
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return handleResponse<ReportsResponse>(response)
}

export async function getReport(id: string): Promise<Report> {
  const response = await fetch(`/api/reports/${id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  return handleResponse<Report>(response)
}

export async function createReport(data: {
  facilityType: FacilityType
  description: string
  image?: File
  lat: number
  lng: number
}): Promise<Report> {
  const formData = new FormData()
  formData.append('facilityType', data.facilityType)
  formData.append('description', data.description)
  formData.append('lat', String(data.lat))
  formData.append('lng', String(data.lng))
  if (data.image) {
    formData.append('image', data.image)
  }

  const response = await fetch('/api/reports', {
    method: 'POST',
    body: formData
  })
  return handleResponse<Report>(response)
}

export async function updateStatus(id: string, status: ReportStatus): Promise<Report> {
  const response = await fetch(`/api/reports/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  })
  return handleResponse<Report>(response)
}
