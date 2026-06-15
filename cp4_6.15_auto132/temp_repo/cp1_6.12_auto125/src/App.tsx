import { Routes, Route, useNavigate } from 'react-router-dom'
import ScoringPanel from './components/ScoringPanel'
import RankingBoard from './components/RankingBoard'
import { useScoreManager } from './hooks/useScoreManager'

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const navigate = useNavigate()
  return (
    <div className="login-container">
      <div className="particles-bg">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 6}s`
          }} />
        ))}
      </div>
      <div className="login-card">
        <h1 className="title">烹饪赛事评分板</h1>
        <p className="subtitle">欢迎评委进入评分系统</p>
        <button className="btn-primary" onClick={() => { onLogin(); navigate('/scoring') }}>
          进入评分界面
        </button>
      </div>
    </div>
  )
}

function App() {
  const scoreManager = useScoreManager()
  const { isLoggedIn, setIsLoggedIn } = scoreManager

  return (
    <Routes>
      <Route path="/" element={<LoginPage onLogin={() => setIsLoggedIn(true)} />} />
      <Route path="/scoring" element={<ScoringPanel {...scoreManager} />} />
      <Route path="/ranking" element={<RankingBoard {...scoreManager} />} />
    </Routes>
  )
}

export default App
