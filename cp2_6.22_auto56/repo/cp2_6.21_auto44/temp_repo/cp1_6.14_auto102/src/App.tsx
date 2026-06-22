import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import Marketplace from '@/pages/Marketplace'
import SongDetail from '@/pages/SongDetail'
import UploadPage from '@/pages/Upload'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-charcoal-900 text-white font-body">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/song/:id" element={<SongDetail />} />
            <Route path="/upload" element={<UploadPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
