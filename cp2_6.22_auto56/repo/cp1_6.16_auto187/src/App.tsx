import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Navigation from '@/components/Navigation';
import Home from '@/pages/Home';
import EventDetail from '@/components/EventDetail';
import Leaderboard from '@/components/Leaderboard';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#faad14',
          colorInfo: '#1677ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorText: '#ffffff',
          colorTextSecondary: '#d9d9d9',
          colorBgBase: '#141414',
          colorBgContainer: '#1f1f1f',
          colorBgElevated: '#2a2a2a',
          colorBorder: '#333333',
          borderRadius: 8,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Button: {
            algorithm: true,
          },
          Card: {
            colorBgContainer: '#1f1f1f',
          },
          Table: {
            colorBgContainer: '#1f1f1f',
          },
          Input: {
            colorBgContainer: '#141414',
          },
          InputNumber: {
            colorBgContainer: '#141414',
          },
          Radio: {
            colorBgContainer: '#141414',
          },
        },
      }}
    >
      <AntdApp>
        <Router>
          <Navigation />
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/event/:id" element={<EventDetail />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route
                path="*"
                element={
                  <div className="empty-state">
                    <h2 style={{ color: '#fff' }}>404 - 页面不存在</h2>
                  </div>
                }
              />
            </Routes>
          </div>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}
