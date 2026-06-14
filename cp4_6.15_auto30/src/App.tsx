import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useParams } from 'react-router-dom';
import { Sparkles, Plus } from 'lucide-react';
import GroupList from './components/GroupList';
import GroupDetail from './components/GroupDetail';
import CreateGroupModal from './components/CreateGroupModal';
import { useGroupStore } from './store/useGroupStore';
import { splitFreight, buildFreightInput } from './utils/freightSplit';

function GroupDetailPage() {
  const { id = '' } = useParams();
  return <GroupDetail groupId={id} />;
}

function NavBar() {
  const location = useLocation();
  const currentUser = useGroupStore((s) => s.currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const showCreateBtn = location.pathname === '/';

  return (
    <>
      <header className="sticky top-0 z-40 bg-cream-50/90 backdrop-blur-md border-b border-cream-200 no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cream-400 to-cream-700 flex items-center justify-center text-cream-50 shadow-sm group-hover:shadow-md transition-shadow">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-display text-xl text-cream-800 leading-none">拼单坊</div>
              <div className="text-[10px] text-cream-500 tracking-wide">HANDMADE GROUP BUY</div>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {showCreateBtn && (
              <button
                onClick={() => setShowCreate(true)}
                className="btn-scale px-4 py-2 rounded-xl bg-gradient-to-r from-cream-500 to-cream-700 text-cream-50 font-medium shadow-sm hover:shadow flex items-center gap-1.5"
              >
                <Plus size={16} /> 开团
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-cream-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cream-300 to-cream-500 flex items-center justify-center text-cream-50 text-sm font-display">
                {currentUser.slice(0, 1)}
              </div>
              <span className="text-sm text-cream-700">{currentUser}</span>
            </div>
          </div>
        </div>
      </header>
      {showCreate && <CreateGroupModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

function WarmUpPerf() {
  const state = useGroupStore.getState();
  const seed = state.seedMockData(100, 50);
  const t0 = performance.now();
  for (const g of seed) {
    splitFreight(buildFreightInput(g.members), g.freight);
  }
  const elapsed = performance.now() - t0;
  console.info(
    `[freightSplit 性能测试] 100个团购 × 50成员 = ${100 * 50} 条分摊计算，总耗时 ${elapsed.toFixed(
      2,
    )} ms，平均每团 ${(elapsed / 100).toFixed(3)} ms`,
  );
  return null;
}

export default function App() {
  return (
    <Router>
      <NavBar />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Routes>
          <Route path="/" element={<GroupList />} />
          <Route path="/group/:id" element={<GroupDetailPage />} />
        </Routes>
      </main>
      <footer className="border-t border-cream-200 py-5 text-center text-xs text-cream-500 no-print">
        © {new Date().getFullYear()} 拼单坊 · 为手工爱好者精心打造
      </footer>
      <WarmUpPerf />
    </Router>
  );
}
