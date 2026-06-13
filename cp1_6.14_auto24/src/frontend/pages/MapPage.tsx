import React, { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import BookCard from '@/components/BookCard'
import { useAuthStore } from '@/store/authStore'

interface DropPoint {
  id: string
  name: string
  lat: number
  lng: number
  address: string
  hasAvailableBooks: boolean
}

interface Book {
  id: string
  title: string
  author: string
  coverUrl: string
  status: 'available' | 'borrowed'
  avgRating: number
  borrowCount: number
  ownerId: string
}

const BEIJING_CENTER: [number, number] = [39.9087, 116.4074]

function createCustomMarker(hasBooks: boolean): L.DivIcon {
  const color = hasBooks ? '#4A7C9B' : '#C45C4B'
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative;">
        <div class="marker-pulse" style="
          position: absolute;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.3;
          left: -8px;
          top: -8px;
          animation: pulse-breath 2.5s ease-in-out infinite;
        "></div>
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${color};
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  })
}

function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): string {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

function MapController({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
}

const MapPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuthStore()
  const [dropPoints, setDropPoints] = useState<DropPoint[]>([])
  const [booksByDropPoint, setBooksByDropPoint] = useState<Record<string, Book[]>>({})
  const [userLocation, setUserLocation] = useState<[number, number]>(BEIJING_CENTER)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [pointsRes, booksRes] = await Promise.all([
        axios.get('/api/drop-points'),
        axios.get('/api/books'),
      ])

      setDropPoints(pointsRes.data.points)

      const booksMap: Record<string, Book[]> = {}
      for (const book of booksRes.data.books) {
        if (!booksMap[book.dropPointId]) {
          booksMap[book.dropPointId] = []
        }
        booksMap[book.dropPointId].push(book)
      }
      setBooksByDropPoint(booksMap)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        () => {
          setUserLocation(BEIJING_CENTER)
        }
      )
    }
  }, [fetchData])

  const handleBorrow = async (book: Book) => {
    if (!user) {
      navigate('/login')
      return
    }

    try {
      await axios.post(`/api/books/${book.id}/borrow`)
      navigate(`/chat/${book.ownerId}`)
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate('/login')
      } else {
        alert(error.response?.data?.error || '申请借阅失败')
      }
    }
  }

  const renderBooksPopup = (dropPoint: DropPoint) => {
    const books = booksByDropPoint[dropPoint.id] || []
    const availableBooks = books.filter(b => b.status === 'available')

    return (
      <div className="min-w-[280px] max-w-[320px] p-2">
        <h3 className="font-serif font-semibold text-brown text-base mb-1">
          {dropPoint.name}
        </h3>
        <p className="text-xs text-brown-light mb-3">{dropPoint.address}</p>

        {availableBooks.length === 0 ? (
          <p className="text-sm text-brown-light text-center py-4">
            该漂流点暂无可用图书
          </p>
        ) : (
          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
            {availableBooks.map((book) => (
              <div
                key={book.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-cream-dark transition-colors"
              >
                <img
                  src={book.coverUrl}
                  alt={book.title}
                  className="w-16 h-20 object-cover rounded-md shadow-sm flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-brown text-sm truncate">
                    {book.title}
                  </h4>
                  <p className="text-xs text-brown-light truncate mb-1">
                    {book.author}
                  </p>
                  <p className="text-xs text-marker-blue mb-2">
                    {calculateDistance(
                      userLocation[0],
                      userLocation[1],
                      dropPoint.lat,
                      dropPoint.lng
                    )}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleBorrow(book)
                    }}
                    className="w-full py-1.5 bg-brown text-cream rounded text-xs font-medium hover:bg-brown-dark transition-colors"
                  >
                    申请借阅
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cream">
        <div className="text-brown font-serif text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4">
        <div
          className="rounded-xl px-6 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(250, 247, 242, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            boxShadow: '0 8px 32px rgba(92, 64, 51, 0.15)',
          }}
        >
          <h1 className="font-serif font-bold text-xl text-brown">📚 书漂流</h1>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-brown">
                  欢迎，{user.username}
                </span>
                <button
                  onClick={() => navigate('/upload')}
                  className="px-4 py-1.5 bg-brown text-cream rounded-lg text-sm font-medium hover:bg-brown-dark transition-colors"
                >
                  上传图书
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-1.5 bg-brown text-cream rounded-lg text-sm font-medium hover:bg-brown-dark transition-colors"
              >
                登录
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-breath {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          background: rgba(250, 247, 242, 0.98);
        }
        .leaflet-popup-content {
          margin: 8px;
        }
        .leaflet-popup-tip {
          background: rgba(250, 247, 242, 0.98);
        }
      `}</style>

      <MapContainer
        center={BEIJING_CENTER}
        zoom={13}
        style={{ height: '100vh', width: '100%', background: '#FAF7F2' }}
        zoomControl={false}
        attributionControl={false}
      >
        <MapController center={userLocation} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {dropPoints.map((point) => (
          <Marker
            key={point.id}
            position={[point.lat, point.lng]}
            icon={createCustomMarker(point.hasAvailableBooks)}
          >
            <Popup maxWidth={340} minWidth={280}>
              {renderBooksPopup(point)}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="absolute bottom-4 left-4 z-[1000]">
        <div
          className="rounded-xl p-3 text-xs"
          style={{
            background: 'rgba(250, 247, 242, 0.9)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-marker-blue"></div>
              <span className="text-brown">有书可借</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-marker-red"></div>
              <span className="text-brown">无书可借</span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-[1000] md:hidden">
        <button
          onClick={() => navigate('/upload')}
          className="w-14 h-14 bg-brown text-cream rounded-full text-2xl shadow-lg hover:bg-brown-dark transition-colors flex items-center justify-center"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default MapPage
