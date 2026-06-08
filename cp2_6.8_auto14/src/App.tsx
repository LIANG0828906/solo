import React, { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Canvas from './components/Canvas';
import ThemeSwitcher from './components/ThemeSwitcher';
import ModuleCard, { type CanvasModule } from './components/ModuleCard';
import { getTheme } from './styles/themes';

interface Toast {
  id: number;
  message: string;
}

const App: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState('bright');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modules, setModules] = useState<CanvasModule[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const theme = getTheme(currentTheme);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleExport = () => {
    const data = {
      version: '1.0',
      theme: currentTheme,
      modules,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `blog-layout-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('布局导出成功！');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.modules && Array.isArray(data.modules)) {
          setModules(data.modules);
          if (data.theme) {
            setCurrentTheme(data.theme);
          }
          showToast('布局导入成功！');
        } else {
          showToast('导入失败：文件格式无效');
        }
      } catch {
        showToast('导入失败：无法解析JSON文件');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="app-container">
      <nav
        className="navbar"
        style={{
          backgroundColor: theme.navbarBg,
          color: theme.navbarText,
        }}
      >
        <div className="navbar-title">博客首页布局搭建工具</div>
        <div className="navbar-right">
          <ThemeSwitcher
            currentTheme={currentTheme}
            onThemeChange={setCurrentTheme}
            navbarText={theme.navbarText}
          />
          <button
            className="import-btn"
            onClick={handleImportClick}
            style={{
              backgroundColor: theme.buttonBg,
              color: theme.buttonText,
            }}
          >
            导入JSON
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="import-input"
            accept=".json"
            onChange={handleImportFile}
          />
          <button
            className="export-btn"
            onClick={handleExport}
            style={{
              backgroundColor: theme.buttonBg,
              color: theme.buttonText,
            }}
          >
            导出JSON
          </button>
        </div>
      </nav>

      <div className="main-content">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          theme={theme}
        />
        <Canvas modules={modules} onModulesChange={setModules} theme={theme} />
      </div>

      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default App;
