import { create } from 'zustand'
import { io, Socket } from 'socket.io-client'

interface City {
  id: string
  name: string
  venue: string
  date: string
  lat: number
  lng: number
  setlistId?: string
}

interface Tour {
  id: string
  name: string
  startDate: string
  endDate: string
  cities: City[]
}

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  key: string
  notes?: string
}

interface Setlist {
  id: string
  name: string
  songs: Song[]
}

interface Member {
  id: string
  name: string
  role: string
  avatar?: string
}

type AttendanceStatus = 'going' | 'maybe' | 'declined'

interface AttendanceKey {
  tourId: string
  cityId: string
  memberId: string
}

interface TourState {
  tours: Tour[]
  currentTour: Tour | null
  setlists: Setlist[]
  members: Member[]
  currentMemberId: string | null
  attendanceMap: Record<string, AttendanceStatus>
  socket: Socket | null

  fetchTours: () => Promise<void>
  fetchToursDetail: (id: string) => Promise<void>
  fetchSetlists: () => Promise<void>
  fetchMembers: () => Promise<void>

  updateAttendance: (
    tourId: string,
    cityId: string,
    memberId: string,
    status: AttendanceStatus
  ) => void

  createTour: (data: Partial<Tour>) => Promise<Tour | undefined>
  addCity: (tourId: string, city: Omit<City, 'id'>) => Promise<void>
  updateCity: (tourId: string, cityId: string, data: Partial<City>) => Promise<void>

  bindSetlist: (tourId: string, cityId: string, setlistId: string) => Promise<void>

  createSetlist: (data: Partial<Setlist>) => Promise<Setlist | undefined>
  addSong: (setlistId: string, song: Omit<Song, 'id'>) => Promise<void>
  reorderSongs: (setlistId: string, songIds: string[]) => Promise<void>
  updateSong: (setlistId: string, songId: string, data: Partial<Song>) => Promise<void>

  _getAttendanceKey: (key: AttendanceKey) => string
  _initSocket: () => void
}

const API_BASE = '/api'

const attendanceKey = (k: AttendanceKey) => `${k.tourId}:${k.cityId}:${k.memberId}`

const initSocket = (set: (partial: Partial<TourState>) => void): Socket => {
  const socket = io('http://localhost:3001', {
    transports: ['websocket', 'polling'],
  })

  socket.on('attendance:changed', (payload: { tourId: string; cityId: string; memberId: string; status: AttendanceStatus }) => {
    set((state) => ({
      attendanceMap: {
        ...state.attendanceMap,
        [attendanceKey({ tourId: payload.tourId, cityId: payload.cityId, memberId: payload.memberId })]: payload.status,
      },
    }))
  })

  return socket
}

export const useTourStore = create<TourState>((set, get) => {
  const socket = initSocket(set)

  return {
    tours: [],
    currentTour: null,
    setlists: [],
    members: [],
    currentMemberId: null,
    attendanceMap: {},
    socket,

    _getAttendanceKey: attendanceKey,

    _initSocket: () => {
      if (!get().socket) {
        set({ socket: initSocket(set) })
      }
    },

    fetchTours: async () => {
      try {
        const res = await fetch(`${API_BASE}/tours`)
        if (res.ok) {
          const tours = await res.json()
          set({ tours })
        }
      } catch (e) {
        console.error('fetchTours error', e)
      }
    },

    fetchToursDetail: async (id: string) => {
      try {
        const res = await fetch(`${API_BASE}/tours/${id}`)
        if (res.ok) {
          const tour = await res.json()
          set({ currentTour: tour })
        }
      } catch (e) {
        console.error('fetchToursDetail error', e)
      }
    },

    fetchSetlists: async () => {
      try {
        const res = await fetch(`${API_BASE}/setlists`)
        if (res.ok) {
          const setlists = await res.json()
          set({ setlists })
        }
      } catch (e) {
        console.error('fetchSetlists error', e)
      }
    },

    fetchMembers: async () => {
      try {
        const res = await fetch(`${API_BASE}/members`)
        if (res.ok) {
          const members = await res.json()
          set({ members })
        }
      } catch (e) {
        console.error('fetchMembers error', e)
      }
    },

    updateAttendance: (tourId, cityId, memberId, status) => {
      const key = attendanceKey({ tourId, cityId, memberId })
      set((state) => ({
        attendanceMap: { ...state.attendanceMap, [key]: status },
      }))

      const s = get().socket
      if (s) {
        s.emit('attendance:update', { tourId, cityId, memberId, status })
      }
    },

    createTour: async (data) => {
      try {
        const res = await fetch(`${API_BASE}/tours`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const tour = await res.json()
          set((state) => ({ tours: [...state.tours, tour] }))
          return tour
        }
      } catch (e) {
        console.error('createTour error', e)
      }
    },

    addCity: async (tourId, city) => {
      try {
        const res = await fetch(`${API_BASE}/tours/${tourId}/cities`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(city),
        })
        if (res.ok) {
          const newCity: City = await res.json()
          set((state) => {
            const tours = state.tours.map((t) =>
              t.id === tourId ? { ...t, cities: [...t.cities, newCity] } : t
            )
            const currentTour =
              state.currentTour?.id === tourId
                ? { ...state.currentTour, cities: [...state.currentTour.cities, newCity] }
                : state.currentTour
            return { tours, currentTour }
          })
        }
      } catch (e) {
        console.error('addCity error', e)
      }
    },

    updateCity: async (tourId, cityId, data) => {
      try {
        const res = await fetch(`${API_BASE}/tours/${tourId}/cities/${cityId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const updated: City = await res.json()
          set((state) => {
            const tours = state.tours.map((t) =>
              t.id === tourId
                ? {
                    ...t,
                    cities: t.cities.map((c) => (c.id === cityId ? { ...c, ...updated } : c)),
                  }
                : t
            )
            const currentTour =
              state.currentTour?.id === tourId
                ? {
                    ...state.currentTour,
                    cities: state.currentTour.cities.map((c) =>
                      c.id === cityId ? { ...c, ...updated } : c
                    ),
                  }
                : state.currentTour
            return { tours, currentTour }
          })
        }
      } catch (e) {
        console.error('updateCity error', e)
      }
    },

    bindSetlist: async (tourId, cityId, setlistId) => {
      try {
        const res = await fetch(`${API_BASE}/tours/${tourId}/cities/${cityId}/setlist`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setlistId }),
        })
        if (res.ok) {
          const updated: City = await res.json()
          set((state) => {
            const tours = state.tours.map((t) =>
              t.id === tourId
                ? {
                    ...t,
                    cities: t.cities.map((c) => (c.id === cityId ? { ...c, ...updated } : c)),
                  }
                : t
            )
            const currentTour =
              state.currentTour?.id === tourId
                ? {
                    ...state.currentTour,
                    cities: state.currentTour.cities.map((c) =>
                      c.id === cityId ? { ...c, ...updated } : c
                    ),
                  }
                : state.currentTour
            return { tours, currentTour }
          })
        }
      } catch (e) {
        console.error('bindSetlist error', e)
      }
    },

    createSetlist: async (data) => {
      try {
        const res = await fetch(`${API_BASE}/setlists`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const setlist = await res.json()
          set((state) => ({ setlists: [...state.setlists, setlist] }))
          return setlist
        }
      } catch (e) {
        console.error('createSetlist error', e)
      }
    },

    addSong: async (setlistId, song) => {
      try {
        const res = await fetch(`${API_BASE}/setlists/${setlistId}/songs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(song),
        })
        if (res.ok) {
          const newSong: Song = await res.json()
          set((state) => ({
            setlists: state.setlists.map((s) =>
              s.id === setlistId ? { ...s, songs: [...s.songs, newSong] } : s
            ),
          }))
        }
      } catch (e) {
        console.error('addSong error', e)
      }
    },

    reorderSongs: async (setlistId, songIds) => {
      try {
        const res = await fetch(`${API_BASE}/setlists/${setlistId}/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songIds }),
        })
        if (res.ok) {
          set((state) => ({
            setlists: state.setlists.map((s) => {
              if (s.id !== setlistId) return s
              const ordered: Song[] = []
              const map = new Map(s.songs.map((song) => [song.id, song]))
              for (const id of songIds) {
                const song = map.get(id)
                if (song) ordered.push(song)
              }
              return { ...s, songs: ordered }
            }),
          }))
        }
      } catch (e) {
        console.error('reorderSongs error', e)
      }
    },

    updateSong: async (setlistId, songId, data) => {
      try {
        const res = await fetch(`${API_BASE}/setlists/${setlistId}/songs/${songId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (res.ok) {
          const updated: Song = await res.json()
          set((state) => ({
            setlists: state.setlists.map((s) =>
              s.id === setlistId
                ? {
                    ...s,
                    songs: s.songs.map((song) =>
                      song.id === songId ? { ...song, ...updated } : song
                    ),
                  }
                : s
            ),
          }))
        }
      } catch (e) {
        console.error('updateSong error', e)
      }
    },
  }
})
