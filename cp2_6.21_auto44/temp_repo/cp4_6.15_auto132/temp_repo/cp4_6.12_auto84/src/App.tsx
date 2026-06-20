import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Detail from './pages/Detail'
import Cart from './pages/Cart'
import Toast from './components/Toast'
import { useFlowerStore } from './store'

function App() {
  const totalItems = useFlowerStore((state) => state.getTotalItems())

  return (
    <>
      <Toast />
      <div className="app-container">
        <nav className="navbar">
          <Link to="/" className="navbar-brand">
            🌸 Bloom Atelier
          </Link>
          <Link to="/cart" className="navbar-cart" aria-label="购物车">
            <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </Link>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/flower/:id" element={<Detail />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </div>
    </>
  )
}

export default App
