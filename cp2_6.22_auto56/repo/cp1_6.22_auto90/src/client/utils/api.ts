const BASE_URL = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export function fetchPodcasts(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : ''
  return request(`/podcasts${query}`)
}

export function fetchPodcast(id: string) {
  return request(`/podcasts/${id}`)
}

export function fetchPlaylists() {
  return request('/playlists')
}

export function createPlaylist(name: string) {
  return request('/playlists', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export function updatePlaylist(id: string, data: { name?: string; podcastIds: string[] }) {
  return request(`/playlists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deletePlaylist(id: string) {
  return request(`/playlists/${id}`, {
    method: 'DELETE',
  })
}

export function fetchNotes(podcastId: string) {
  return request(`/notes?podcastId=${encodeURIComponent(podcastId)}`)
}

export function createNote(data: {
  podcastId: string
  episodeId?: string
  content: string
  rating: number
}) {
  return request('/notes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateNote(id: string, data: unknown) {
  return request(`/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteNote(id: string) {
  return request(`/notes/${id}`, {
    method: 'DELETE',
  })
}
