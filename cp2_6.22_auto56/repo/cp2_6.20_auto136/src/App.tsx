import { Routes, Route } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Home from '@/pages/Home'
import ClubDetail from '@/pages/ClubDetail'
import MyClubs from '@/pages/MyClubs'

function App() {
  return (
    <>
      <Navbar />
      <div className="content-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clubs/:id" element={<ClubDetail />} />
          <Route path="/my-clubs" element={<MyClubs />} />
        </Routes>
      </div>
    </>
  )
}

export default App
