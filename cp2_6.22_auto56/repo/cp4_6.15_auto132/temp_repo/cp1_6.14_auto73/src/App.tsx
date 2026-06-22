import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import HomePage from './HomePage'
import BoardDetailPage from './BoardDetailPage'

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <header className="app-header">
          <h1>🎨 灵感板</h1>
          <nav>
            <Link to="/">首页</Link>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/board/:id" element={<BoardDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
