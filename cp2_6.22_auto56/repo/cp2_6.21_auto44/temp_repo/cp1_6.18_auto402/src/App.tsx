import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import WelcomeModal from './components/WelcomeModal'
import CelebrationModal from './components/CelebrationModal'
import CollectionPage from './modules/ui/CollectionPage'
import MarketPage from './modules/ui/MarketPage'
import BackpackPage from './modules/ui/BackpackPage'
import { useGameStore } from './store'

const App = () => {
  const initState = useGameStore((s) => s.initState)

  useEffect(() => {
    initState()
  }, [initState])

  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #0B0C10 0%, #1A1A2E 100%)',
        }}
      >
        <Navbar />
        <main
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '80px 2rem 4rem',
          }}
          className="main-content"
        >
          <Routes>
            <Route path="/" element={<CollectionPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/backpack" element={<BackpackPage />} />
          </Routes>
        </main>

        <WelcomeModal />
        <CelebrationModal />

        <style>{`
          @media (max-width: 768px) {
            .main-content {
              padding: 20px 16px 100px !important;
              max-width: 100% !important;
              width: 100% !important;
            }
          }
          @media (min-width: 769px) and (max-width: 1024px) {
            .main-content {
              padding: 80px 2rem 4rem !important;
            }
          }
        `}</style>
      </div>
    </BrowserRouter>
  )
}

export default App
