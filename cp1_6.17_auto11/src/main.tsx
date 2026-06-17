import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, theme } from 'antd'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00d4ff',
          colorInfo: '#00d4ff',
          colorBgContainer: '#3a3a54',
          colorBgElevated: '#4a4a6a',
          colorBorder: '#4a4a6a',
          colorText: '#ffffff',
          colorTextSecondary: '#a0a0c0',
          borderRadius: 8
        },
        components: {
          Select: {
            colorBgContainer: '#2d2d44',
            colorBgElevated: '#2d2d44',
            colorBorder: '#4a4a6a',
            optionSelectedBg: '#4a4a6a',
            optionActiveBg: '#3a3a54'
          },
          Slider: {
            trackBg: '#00d4ff',
            railBg: '#4a4a6a',
            handleColor: '#00d4ff',
            handleSize: 14,
            handleLineWidth: 2
          },
          Button: {
            primaryColor: '#00d4ff',
            algorithm: true
          }
        }
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
