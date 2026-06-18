import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

void i18next.use(initReactI18next).init({
  lng: 'zh',
  fallbackLng: 'zh',
  resources: {
    zh: {
      translation: {
        appTitle: '跨语言弹幕翻译互动墙'
      }
    }
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
