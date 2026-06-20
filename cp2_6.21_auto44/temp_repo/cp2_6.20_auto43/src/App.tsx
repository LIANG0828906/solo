import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import CardEditor from './components/CardEditor';
import Battlefield from './components/Battlefield';
import BattleLog from './components/BattleLog';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="app-container">
        <nav className="app-nav">
          <div className="app-title">⚔ 卡牌对战模拟器</div>
          <div className="nav-links">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              卡组编辑
            </NavLink>
            <NavLink to="/battle" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              对战模拟
            </NavLink>
            <NavLink to="/logs" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              对战记录
            </NavLink>
          </div>
        </nav>

        <main className="page-content">
          <Routes>
            <Route path="/" element={<CardEditor />} />
            <Route path="/editor" element={<CardEditor />} />
            <Route path="/battle" element={<Battlefield />} />
            <Route path="/logs" element={<BattleLog />} />
            <Route path="*" element={<CardEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};

export default App;
