import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#FF6B00',
          colorBgContainer: '#2D2D44',
          colorBgElevated: '#2D2D44',
          colorText: '#E0E0E0',
          borderRadius: 12,
          colorBorder: '#444466',
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
