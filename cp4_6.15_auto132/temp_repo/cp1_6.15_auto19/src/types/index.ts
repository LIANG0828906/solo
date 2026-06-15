export interface Pet {
  id: string
  name: string
  avatar: string
  breed: string
  type: 'dog' | 'cat' | 'other'
  age: number
  ownerId: string
  description: string
}

export interface Host {
  id: string
  name: string
  avatar: string
  rating: number
  reviewCount: number
  city: string
  price: number
  petTypes: string[]
  description: string
  images: string[]
  bookedDates: string[]
}

export interface Review {
  id: string
  hostId: string | null
  petId: string | null
  userName: string
  userAvatar: string
  rating: number
  content: string
  date: string
}

export interface Booking {
  id: string
  hostId: string
  petId: string
  petName: string
  userName: string
  hostName: string
  date: string
  price: number
  notes: string
  status: string
  createdAt: string
}

export interface HostListResponse {
  data: Host[]
  total: number
  page: number
  totalPages: number
}

export interface BookingResponse {
  booking: Booking
  notifications: {
    owner: { title: string; message: string }
    host: { title: string; message: string }
  }
}

export interface BookingCheckResponse {
  available: boolean
  conflict: boolean
  suggestedDates?: string[]
}

export interface SearchFilters {
  city: string
  petType: string
  minPrice: string
  maxPrice: string
  sortBy: string
}
