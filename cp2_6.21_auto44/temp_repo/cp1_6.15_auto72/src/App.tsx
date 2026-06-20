import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import Subscription from './pages/Subscription'
import CustomOrder from './pages/CustomOrder'
import DeliveryTracking from './pages/DeliveryTracking'
import Inventory from './pages/Inventory'

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="container nav-container">
            <Link to="/" className="logo">
              <span className="logo-icon">🌸</span>
              <span className="logo-text">花语派FlowerPie</span>
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">首页</Link>
              <Link to="/subscriptions" className="nav-link">订阅管理</Link>
              <Link to="/custom-order" className="nav-link">定制下单</Link>
              <Link to="/delivery" className="nav-link">配送跟踪</Link>
              <Link to="/inventory" className="nav-link">库存管理</Link>
            </div>
          </div>
        </nav>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/subscriptions" element={<Subscription />} />
            <Route path="/custom-order" element={<CustomOrder />} />
            <Route path="/delivery" element={<DeliveryTracking />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </main>
        <footer className="footer">
          <div className="container">
            <p>© 2024 花语派FlowerPie · 让每一束花都传递心意</p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
