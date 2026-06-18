import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Player from '@/components/Player'
import Home from '@/pages/Home'
import Search from '@/pages/Search'
import PlaylistDetail from '@/pages/PlaylistDetail'
import { useMusicStore } from '@/store/musicStore'

export default function App() {
  const initializeStore = useMusicStore((s) => s.initializeStore)

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-[#0a0e27] to-[#0d1333] text-white">
        <Navbar />
        <main className="pt-16 pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/playlist/:id" element={<PlaylistDetail />} />
            <Route path="/shared/:id" element={<PlaylistDetail />} />
          </Routes>
        </main>
        <Player />
      </div>
    </BrowserRouter>
  )
}
