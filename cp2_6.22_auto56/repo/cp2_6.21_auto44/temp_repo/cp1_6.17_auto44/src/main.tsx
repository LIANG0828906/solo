import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#E94560',
          colorBgContainer: '#1A1A2E',
          colorBgElevated: '#16213E',
          colorText: '#ffffff',
          colorTextSecondary: '#8E8E9A',
          borderRadius: 8,
        },
        components: {
          Button: {
            colorPrimary: '#E94560',
            colorPrimaryHover: '#C0392B',
            algorithm: true,
          },
          Slider: {
            colorPrimary: '#E94560',
            colorFillContentHover: '#E94560',
          },
          Card: {
            colorBgContainer: '#16213E',
            colorBorderSecondary: 'transparent',
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
