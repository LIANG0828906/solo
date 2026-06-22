import { Routes, Route } from 'react-router-dom'
import AuctionList from './pages/AuctionList'
import AuctionDetail from './pages/AuctionDetail'
import UserProfile from './pages/UserProfile'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<AuctionList />} />
        <Route path="/auction/:id" element={<AuctionDetail />} />
        <Route path="/user/:id" element={<UserProfile />} />
      </Routes>
    </div>
  )
}

export default App
