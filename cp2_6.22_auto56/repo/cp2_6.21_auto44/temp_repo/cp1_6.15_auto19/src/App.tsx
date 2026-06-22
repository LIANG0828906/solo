import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import HostDetailPage from './pages/HostDetailPage'
import MatchingPage from './pages/MatchingPage'

function App() {
  return (
    <>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/matching" element={<MatchingPage />} />
          <Route path="/host/:id" element={<HostDetailPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}

export default App
