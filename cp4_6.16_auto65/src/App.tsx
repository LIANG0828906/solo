import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Outlet } from 'react-router-dom';
import { useExerciseStore } from './modules/exercise/store';
import HomePage from './pages/HomePage';
import ChartPage from './pages/ChartPage';

const AppLayout = () => {
  const init = useExerciseStore((state) => state.init);
  const exportData = useExerciseStore((state) => state.exportData);
  const importData = useExerciseStore((state) => state.importData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();
  }, [init]);

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitscribe-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      await importData(text);
      alert('导入成功');
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败，请检查文件格式');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="app-root">
      <nav className="navbar">
        <NavLink to="/" className="navbar-brand">
          FitScribe
        </NavLink>
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'active' : ''}`
            }
          >
            首页
          </NavLink>
          <NavLink
            to="/charts"
            className={({ isActive }) =>
              `navbar-link ${isActive ? 'active' : ''}`
            }
          >
            图表
          </NavLink>
        </div>
        <div className="navbar-actions">
          <button className="btn" onClick={handleExport}>
            导出
          </button>
          <button className="btn" onClick={handleImportClick}>
            导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </nav>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="charts" element={<ChartPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
