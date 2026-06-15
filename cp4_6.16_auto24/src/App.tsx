import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import GalleryListPage from './pages/GalleryListPage'
import GalleryPage from './pages/GalleryPage'
import ProfilePage from './pages/ProfilePage'
import AuthPage from './pages/AuthPage'

function RootLayout() {
  const location = useLocation()
  const isGalleryPage = location.pathname.startsWith('/gallery/')
  const isAuthPage = location.pathname === '/auth'

  return (
    <div>
      {!isGalleryPage && !isAuthPage && <Navbar />}
      <Outlet />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/galleries" element={<GalleryListPage />} />
        <Route path="/gallery/:id" element={<GalleryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="*" element={<HomePage />} />
      </Route>
    </Routes>
  )
}

export default App
