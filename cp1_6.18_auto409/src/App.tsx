import React from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import MemberDetail from '@/pages/MemberDetail';
import TeamProgress from '@/pages/TeamProgress';
import { Flame, Users, Trophy } from 'lucide-react';

export default function App() {
  const location = useLocation();

  const navLinkClassName = ({ isActive }: { isActive: boolean }): string => {
    const base = 'relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-[#A0A0B8] transition-all duration-200 hover:text-white hover:bg-[#2A2A3E]';
    const active = isActive ? 'text-white bg-[#1E1E2E] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[#00D4AA] after:w-full after:transition-all after:duration-200' : 'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-[#00D4AA] after:w-0 after:transition-all after:duration-200';
    return `${base} ${active}`;
  };

  return (
    <div className="min-h-screen">
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'rgba(18, 18, 32, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid #2A2A3E',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Flame size={28} color="#00D4AA" />
            <span style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 600 }}>
              健身热力榜
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <NavLink to="/" className={navLinkClassName} end>
              <Trophy size={18} />
              <span>排行榜</span>
            </NavLink>
            <NavLink to="/team" className={navLinkClassName}>
              <Users size={18} />
              <span>团队进度</span>
            </NavLink>
          </div>
        </div>
      </nav>
      <main
        style={{
          paddingTop: 88,
          maxWidth: 1200,
          margin: '0 auto',
          padding: '88px 24px 24px',
        }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/member/:id" element={<MemberDetail />} />
          <Route path="/team" element={<TeamProgress />} />
        </Routes>
      </main>
    </div>
  );
}
