import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { Home, Users, Calendar, ShoppingCart } from 'lucide-react';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import PlanPage from './pages/PlanPage';
import ShoppingPage from './pages/ShoppingPage';
import { useEffect } from 'react';
import { useAppStore } from './store';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Header = styled.header`
  background: #f4a460;
  color: #fff8e7;
  padding: 14px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 50;
  @media (max-width: 768px) {
    padding: 10px 16px;
  }
`;

const Brand = styled.div`
  font-family: 'Noto Serif SC', serif;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Nav = styled.nav`
  display: flex;
  gap: 8px;
  @media (max-width: 768px) {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff8e7;
    padding: 10px 0;
    justify-content: space-around;
    border-top: 1px solid #e8d8b8;
    box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const NavBtn = styled(NavLink)`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 12px;
  color: #fff8e7;
  transition: all 200ms ease;
  font-weight: 500;
  &.active {
    background: rgba(255, 248, 231, 0.25);
  }
  &:hover:not(.active) {
    background: rgba(255, 248, 231, 0.12);
  }
  @media (max-width: 768px) {
    color: #8b6a45;
    padding: 8px 12px;
    flex-direction: column;
    gap: 2px;
    font-size: 12px;
    &.active {
      background: #f4a460;
      color: #fff8e7;
    }
  }
`;

const PageWrap = styled.main<{ $key: string }>`
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  animation: ${fadeIn} 300ms ease;
  @media (max-width: 768px) {
    padding: 16px 16px 80px;
  }
`;

function AnimatedPage({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return <PageWrap $key={location.pathname}>{children}</PageWrap>;
}

export default function App() {
  const fetchMembers = useAppStore((s) => s.fetchMembers);
  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return (
    <Router>
      <Header>
        <Brand>🍽️ 家味编排</Brand>
        <Nav>
          <NavBtn to="/" end>
            <Home size={18} /> 首页
          </NavBtn>
          <NavBtn to="/members">
            <Users size={18} /> 成员
          </NavBtn>
          <NavBtn to="/plan">
            <Calendar size={18} /> 周计划
          </NavBtn>
          <NavBtn to="/shopping">
            <ShoppingCart size={18} /> 采购清单
          </NavBtn>
        </Nav>
      </Header>
      <AnimatedPage>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/shopping" element={<ShoppingPage />} />
        </Routes>
      </AnimatedPage>
    </Router>
  );
}
