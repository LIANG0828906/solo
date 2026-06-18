import Sandbox from '@/components/Sandbox';
import Toolbar from '@/components/Toolbar';
import FossilInfo from '@/components/FossilInfo';
import './App.css';

export default function App() {
  return (
    <div className="app-root">
      <div className="bg-gradient" />
      <div className="app-header">
        <div className="header-logo">
          <span className="logo-icon">🦴</span>
          <div>
            <div className="header-title">化石复原工作台</div>
            <div className="header-subtitle">Fossil Restoration Workbench</div>
          </div>
        </div>
        <div className="header-tag">沉浸式古生物考古体验</div>
      </div>

      <main className="main-layout">
        <section className="sandbox-section">
          <Sandbox />
          <div className="sandbox-overlay-label">
            <span className="label-dot" />
            3D 虚拟沙盘
          </div>
        </section>

        <aside className="right-panel">
          <Toolbar />
          <FossilInfo />
        </aside>
      </main>
    </div>
  );
}
