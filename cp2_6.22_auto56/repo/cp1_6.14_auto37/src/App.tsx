import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import StarryBackground from './components/StarryBackground'
import Home from './modules/home/Home'
import CapsuleForm from './modules/capsule/CapsuleForm'
import CapsuleList from './modules/capsule/CapsuleList'
import DriftInbox from './modules/drift/DriftInbox'
import Login from './modules/user/Login'
import { getToken, getUser } from './utils/auth'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = getToken()
    setIsLoggedIn(!!token)
  }, [])

  const handleAuthChange = (loggedIn: boolean) => {
    setIsLoggedIn(loggedIn)
  }

  return (
    <div className="app">
      <StarryBackground />
      <Navbar isLoggedIn={isLoggedIn} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={isLoggedIn ? <CapsuleForm /> : <Navigate to="/login" />} />
          <Route path="/capsules" element={isLoggedIn ? <CapsuleList /> : <Navigate to="/login" />} />
          <Route path="/drift" element={isLoggedIn ? <DriftInbox /> : <Navigate to="/login" />} />
          <Route path="/login" element={<Login onAuthChange={handleAuthChange} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
