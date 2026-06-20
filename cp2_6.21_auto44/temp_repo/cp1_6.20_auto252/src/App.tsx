import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RoomList from './components/RoomList'
import RoomPage from './components/RoomPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<RoomList />} />
          <Route path="/rooms/:id" element={<RoomPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
