import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00D4FF',
          colorBgBase: '#0D0D2B',
          colorTextBase: '#ffffff',
          colorTextSecondary: '#B0BEC5',
          colorBorder: '#00D4FF',
          colorInfo: '#00D4FF',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", sans-serif'
        },
        components: {
          Slider: {
            trackBg: '#00D4FF',
            railBg: 'rgba(0, 212, 255, 0.2)',
            handleColor: '#00D4FF'
          },
          Button: {
            colorPrimary: '#00D4FF',
            colorPrimaryHover: '#00B8E0',
            colorBorder: '#00D4FF'
          },
          Select: {
            colorPrimary: '#00D4FF',
            colorBorder: '#00D4FF',
            colorBgContainer: '#1A1A2E'
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
