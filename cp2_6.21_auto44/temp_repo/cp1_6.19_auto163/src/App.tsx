import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Calendar } from './schedule/Calendar';
import { RehearsalDetail } from './schedule/RehearsalDetail';
import { RepertoirePage } from './repertoire/RepertoirePage';
import { MembersPage } from './members/MembersPage';

function App() {
  return (
    <BrowserRouter>
      <div
        className="min-h-screen"
        style={{
          backgroundColor: '#1A237E',
          backgroundImage: `
            radial-gradient(ellipse at 15% 10%, rgba(61,90,254,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 90%, rgba(255,213,79,0.10) 0%, transparent 50%),
            linear-gradient(180deg, rgba(26,35,126,1) 0%, rgba(13,20,66,1) 100%)
          `,
          backgroundAttachment: 'fixed',
        }}
      >
        <Navbar />

        <main className="px-4 sm:px-6 py-8">
          <div
            className="mx-auto max-w-[1000px] rounded-3xl p-6 sm:p-10"
            style={{
              backgroundColor: 'rgba(38,50,56,0.55)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <Routes>
              <Route path="/" element={<Calendar />} />
              <Route path="/rehearsal/:id" element={<RehearsalDetail />} />
              <Route path="/repertoire" element={<RepertoirePage />} />
              <Route path="/members" element={<MembersPage />} />
            </Routes>
          </div>
        </main>

        <footer className="py-8 text-center">
          <p className="text-white/25 text-[11px]">
            和声社 · 排练管理系统 · 用音乐连接每一个灵魂
          </p>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
