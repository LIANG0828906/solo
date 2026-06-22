import { useState, useEffect, useMemo, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import GlobeView from './GlobeView'
import CityPanel from './CityPanel'
import AlbumTimeline from './AlbumTimeline'
import ShopCarousel from './ShopCarousel'

export interface City {
  id: string
  name: string
  lat: number
  lng: number
  date: string
  venue: string
  ticketUrl: string
}

export interface Album {
  id: string
  title: string
  releaseDate: string
  isLatest: boolean
  isUnreleased: boolean
}

export interface Merchandise {
  id: string
  name: string
  price: string
}

const mockCities: City[] = [
  { id: uuidv4(), name: '北京', lat: 39.9042, lng: 116.4074, date: '2026-07-15', venue: '工人体育馆', ticketUrl: 'https://example.com/beijing' },
  { id: uuidv4(), name: '上海', lat: 31.2304, lng: 121.4737, date: '2026-07-18', venue: '梅赛德斯奔驰文化中心', ticketUrl: 'https://example.com/shanghai' },
  { id: uuidv4(), name: '东京', lat: 35.6762, lng: 139.6503, date: '2026-08-02', venue: 'Zepp Tokyo', ticketUrl: 'https://example.com/tokyo' },
  { id: uuidv4(), name: '伦敦', lat: 51.5074, lng: -0.1278, date: '2026-08-15', venue: 'O2 Academy Brixton', ticketUrl: 'https://example.com/london' },
  { id: uuidv4(), name: '纽约', lat: 40.7128, lng: -74.0060, date: '2026-09-01', venue: 'Webster Hall', ticketUrl: 'https://example.com/newyork' },
  { id: uuidv4(), name: '洛杉矶', lat: 34.0522, lng: -118.2437, date: '2026-09-05', venue: 'The Wiltern', ticketUrl: 'https://example.com/la' },
  { id: uuidv4(), name: '柏林', lat: 52.5200, lng: 13.4050, date: '2026-08-20', venue: 'Berghain', ticketUrl: 'https://example.com/berlin' },
]

const mockAlbums: Album[] = [
  { id: uuidv4(), title: 'Midnight Echoes', releaseDate: '2026-03-10', isLatest: true, isUnreleased: false },
  { id: uuidv4(), title: 'Neon Dreams', releaseDate: '2026-11-25', isLatest: false, isUnreleased: true },
  { id: uuidv4(), title: 'Cosmic Drift', releaseDate: '2027-02-14', isLatest: false, isUnreleased: true },
  { id: uuidv4(), title: 'Analog Hearts', releaseDate: '2025-09-20', isLatest: false, isUnreleased: false },
  { id: uuidv4(), title: 'Static Waves', releaseDate: '2024-06-15', isLatest: false, isUnreleased: false },
]

const mockMerchandise: Merchandise[] = [
  { id: uuidv4(), name: '巡演限定T恤', price: '¥299' },
  { id: uuidv4(), name: '黑胶唱片套装', price: '¥499' },
  { id: uuidv4(), name: '乐队徽章组', price: '¥89' },
  { id: uuidv4(), name: '签名海报', price: '¥199' },
  { id: uuidv4(), name: '复古卫衣', price: '¥399' },
  { id: uuidv4(), name: '限量版CD', price: '¥159' },
  { id: uuidv4(), name: '搪瓷马克杯', price: '¥129' },
  { id: uuidv4(), name: '编织手绳', price: '¥69' },
  { id: uuidv4(), name: '帆布托特包', price: '¥179' },
]

function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 3,
      size: Math.random() * 2 + 1,
    }))
  }, [])

  return (
    <div className="starfield">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

function App() {
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null)
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1280)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const selectedCity = mockCities.find((c) => c.id === selectedCityId) || null
  const isMobile = viewportWidth < 768

  const handleCityClick = (cityId: string) => {
    setSelectedCityId((prev) => (prev === cityId ? null : cityId))
  }

  const handleClosePanel = () => {
    setSelectedCityId(null)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <Starfield />

      <GlobeView
        cities={mockCities}
        albums={mockAlbums}
        selectedCityId={selectedCityId}
        onCityClick={handleCityClick}
        viewportWidth={viewportWidth}
        containerRef={containerRef}
      />

      {selectedCity && (
        <CityPanel
          city={selectedCity}
          onClose={handleClosePanel}
          viewportWidth={viewportWidth}
          containerRef={containerRef}
        />
      )}

      <AlbumTimeline albums={mockAlbums} isMobile={isMobile} />

      <ShopCarousel merchandise={mockMerchandise} isMobile={isMobile} />
    </div>
  )
}

export default App
