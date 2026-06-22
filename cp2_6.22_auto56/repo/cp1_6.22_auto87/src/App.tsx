import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import ProjectPage from './project-page';
import AnalysisPage from './analysis-page';
import SettingsPage from './settings-page';
import './App.css';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#667eea',
          colorInfo: '#667eea',
          colorSuccess: '#10b981',
          colorWarning: '#f59e0b',
          colorError: '#ef4444',
          borderRadius: 8,
        },
      }}
    >
      <Router>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <div className="content-wrapper">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/projects" element={<ProjectPage />} />
                <Route path="/analysis" element={<AnalysisPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </ConfigProvider>
  );
}
