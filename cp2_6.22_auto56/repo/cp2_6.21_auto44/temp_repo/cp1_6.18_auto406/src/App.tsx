import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import CreatePoll from './pages/CreatePoll'
import PollDetail from './pages/PollDetail'

interface HistoryPoll {
  id: string
  title: string
  totalVotes: number
  endedAt: string
}

const mockHistory: HistoryPoll[] = [
  { id: 'ABC123', title: '最喜欢的编程语言', totalVotes: 128, endedAt: '2026-06-17' },
  { id: 'DEF456', title: '最佳前端框架', totalVotes: 256, endedAt: '2026-06-16' },
  { id: 'GHI789', title: '周末团建活动', totalVotes: 42, endedAt: '2026-06-15' },
  { id: 'JKL012', title: '午餐吃什么', totalVotes: 18, endedAt: '2026-06-14' },
  { id: 'MNO345', title: '下次会议时间', totalVotes: 35, endedAt: '2026-06-13' },
  { id: 'PQR678', title: '产品Logo方案', totalVotes: 89, endedAt: '2026-06-12' },
  { id: 'STU901', title: '年度旅游目的地', totalVotes: 167, endedAt: '2026-06-11' },
  { id: 'VWX234', title: '新功能优先级', totalVotes: 73, endedAt: '2026-06-10' },
  { id: 'YZA567', title: '下午茶选择', totalVotes: 24, endedAt: '2026-06-09' },
  { id: 'BCD890', title: '团队建设方式', totalVotes: 56, endedAt: '2026-06-08' },
]

function HistoryCard({ poll }: { poll: HistoryPoll }) {
  const navigate = useNavigate()
  return (
    <div
      className="history-card"
      onClick={() => navigate(`/poll/${poll.id}`)}
      style={styles.historyCard}
    >
      <div style={styles.historyTitle}>{poll.title}</div>
      <div style={styles.historyMeta}>
        <span style={styles.historyVotes}>{poll.totalVotes} 票</span>
        <span style={styles.historyDate}>{poll.endedAt}</span>
      </div>
      <div style={styles.historyCode}>#{poll.id}</div>
    </div>
  )
}

function MainLayout() {
  return (
    <div style={styles.app}>
      <div style={styles.wrapper}>
        <header style={styles.header}>
          <h1 style={styles.title}>投票热力图</h1>
          <p style={styles.subtitle}>创建投票，实时查看结果热力分布</p>
        </header>
        <main style={styles.main}>
          <Routes>
            <Route path="/" element={<Navigate to="/create" replace />} />
            <Route path="/create" element={<CreatePoll />} />
            <Route path="/poll/:code" element={<PollDetail />} />
          </Routes>
        </main>
        <section style={styles.historySection}>
          <h2 style={styles.historyHeading}>最近结束的投票</h2>
          <div style={styles.historyGrid}>
            {mockHistory.map((poll) => (
              <HistoryCard key={poll.id} poll={poll} />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#0F0F1A',
    color: '#E0E0E0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  wrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '40px 24px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    margin: 0,
    background: 'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: '16px',
    marginTop: '8px',
    margin: 0,
  },
  main: {
    background: '#1A1A2E',
    borderRadius: '16px',
    marginBottom: '40px',
    border: '1px solid #2E2E4A',
  },
  historySection: {
    marginTop: '40px',
  },
  historyHeading: {
    color: '#E0E0E0',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '20px',
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, 280px)',
    gap: '16px',
    justifyContent: 'center',
  },
  historyCard: {
    width: '280px',
    height: '100px',
    borderRadius: '12px',
    background: '#1E1E2E',
    padding: '16px',
    boxSizing: 'border-box',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #2E2E4A',
    position: 'relative',
    overflow: 'hidden',
  },
  historyTitle: {
    color: '#E0E0E0',
    fontSize: '15px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  historyMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyVotes: {
    color: '#7C3AED',
    fontSize: '13px',
    fontWeight: '500',
  },
  historyDate: {
    color: '#6B7280',
    fontSize: '12px',
  },
  historyCode: {
    position: 'absolute',
    top: '12px',
    right: '16px',
    color: '#4B5563',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
}

const globalStyle = document.createElement('style')
globalStyle.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background: #0F0F1A;
    color: #E0E0E0;
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  button {
    font-family: inherit;
  }
  input, textarea {
    font-family: inherit;
  }
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-track {
    background: #0F0F1A;
  }
  ::-webkit-scrollbar-thumb {
    background: #2E2E4A;
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #7C3AED;
  }
  .history-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .history-card:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
  }
`
document.head.appendChild(globalStyle)

export default App
