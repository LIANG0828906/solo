import { Routes, Route, NavLink } from 'react-router-dom';
import CardEditor from './modules/cardManager/CardEditor';
import CardList from './modules/cardManager/CardList';
import ReviewSession from './modules/reviewEngine/ReviewSession';
import ReviewStats from './modules/reviewEngine/ReviewStats';
import { api } from './utils/api';

function App() {
  const handleExport = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-cards-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('导出失败:', error);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h1>📚 知识卡片复习系统</h1>
        <div className="nav-links">
          <NavLink to="/" className="nav-link" end>
            卡片列表
          </NavLink>
          <NavLink to="/editor" className="nav-link">
            创建卡片
          </NavLink>
          <NavLink to="/review" className="nav-link">
            开始复习
          </NavLink>
          <NavLink to="/stats" className="nav-link">
            学习统计
          </NavLink>
          <button className="export-btn" onClick={handleExport}>
            导出数据
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<CardList />} />
        <Route path="/editor" element={<CardEditor />} />
        <Route path="/review" element={<ReviewSession />} />
        <Route path="/stats" element={<ReviewStats />} />
      </Routes>
    </div>
  );
}

export default App;
