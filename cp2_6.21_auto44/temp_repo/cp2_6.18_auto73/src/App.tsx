import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import KeyGenerator from '@/components/KeyGenerator';
import KeyList from '@/components/KeyList';
import UsageChart from '@/components/UsageChart';
import { KeyRound, BarChart3 } from 'lucide-react';

function Nav() {
  return (
    <nav className="mb-6 flex items-center gap-1 rounded-xl border border-vault-border bg-vault-card/80 p-1.5">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-vault-accent1/20 text-vault-accent1'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`
        }
      >
        <KeyRound className="h-4 w-4" />
        密钥管理
      </NavLink>
      <NavLink
        to="/stats"
        className={({ isActive }) =>
          `flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-vault-accent1/20 text-vault-accent1'
              : 'text-gray-400 hover:bg-white/5 hover:text-white'
          }`
        }
      >
        <BarChart3 className="h-4 w-4" />
        用量统计
      </NavLink>
    </nav>
  );
}

function KeysPage() {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="w-full lg:w-1/3">
        <KeyGenerator />
      </div>
      <div className="w-full lg:w-2/3">
        <KeyList />
      </div>
    </div>
  );
}

function StatsPage() {
  return <UsageChart />;
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-vault-bg font-sans">
        <header className="border-b border-vault-border bg-vault-card/50 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-btn">
                <KeyRound className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">KeyVault</h1>
                <p className="text-xs text-gray-500">API密钥管理与用量看板</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-6">
          <Nav />
          <Routes>
            <Route path="/" element={<KeysPage />} />
            <Route path="/stats" element={<StatsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
