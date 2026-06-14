import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'antd/dist/reset.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: antdTheme.darkAlgorithm,
        token: {
          colorPrimary: '#7C5CFF',
          borderRadius: 8,
          colorBgBase: '#1a1a2e',
          colorBgContainer: '#22223b',
          colorBgElevated: '#2a2a45',
          colorBorder: 'rgba(255,255,255,0.12)',
          colorText: 'rgba(255,255,255,0.9)',
          colorTextSecondary: 'rgba(255,255,255,0.65)',
          controlHeight: 32,
          fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif",
        },
        components: {
          Button: { controlOutline: '0 0 0 2px rgba(124,92,255,0.2)' },
          Input: { colorBgContainer: 'rgba(255,255,255,0.04)' },
          Select: { colorBgContainer: 'rgba(255,255,255,0.04)' },
          Table: { colorBgContainer: 'rgba(255,255,255,0.02)', headerBg: 'rgba(124,92,255,0.15)' },
          Drawer: { colorBgElevated: '#1e1e38' },
          Dropdown: { colorBgElevated: '#2a2a45' },
          Modal: { colorBgElevated: '#22223b' },
          Menu: { darkItemBg: 'transparent' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
