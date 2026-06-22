export interface Animal {
  id: string
  name: string
  breed: string
  age: number
  gender: 'male' | 'female'
  weight: number
  color: string
  vaccinated: boolean
  neutered: boolean
  intakeDate: string
  description: string
  status: 'available' | 'adopted' | 'quarantine'
  photoUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: string
  animalId: string
  animalName: string
  applicantName: string
  contact: string
  housing: 'own' | 'rent'
  hasOtherPets: boolean
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface Followup {
  id: string
  animalId: string
  date: string
  status: 'healthy' | 'attention' | 'recheck'
  notes: string
  createdAt: string
}

export interface Stats {
  totalAnimals: number
  availableAnimals: number
  thisMonthAdoptions: number
  thisMonthFollowups: number
}

const BASE_URL = '/app'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as unknown as T
    }

    return await response.json()
  } catch (err) {
    console.error('API Error:', err)
    throw err
  }
}

export const api = {
  getAnimals: () => request<Animal[]>('/animals'),
  getAnimal: (id: string) => request<Animal>(`/animals/${id}`),
  createAnimal: (data: Partial<Animal>) =>
    request<Animal>('/animals', { method: 'POST', body: JSON.stringify(data) }),
  updateAnimal: (id: string, data: Partial<Animal>) =>
    request<Animal>(`/animals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAnimal: (id: string) =>
    request<void>(`/animals/${id}`, { method: 'DELETE' }),

  getApplications: () => request<Application[]>('/applications'),
  createApplication: (data: Partial<Application>) =>
    request<Application>('/applications', { method: 'POST', body: JSON.stringify(data) }),
  updateApplicationStatus: (id: string, status: 'approved' | 'rejected') =>
    request<Application>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  getFollowups: (animalId: string) =>
    request<Followup[]>(`/followups/animal/${animalId}`),
  createFollowup: (data: Partial<Followup>) =>
    request<Followup>('/followups', { method: 'POST', body: JSON.stringify(data) }),

  getStats: () => request<Stats>('/stats')
}
