import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

const theme = {
  token: {
    colorPrimary: '#DE944A',
    colorInfo: '#DE944A',
    colorSuccess: '#51cf66',
    colorWarning: '#ffd43b',
    colorError: '#ff6b6b',
    colorBgBase: '#FFF8F0',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#FFF8F0',
    colorBorder: '#E8D5BE',
    colorBorderSecondary: '#F5E6D3',
    colorText: '#3D2914',
    colorTextSecondary: '#8B7355',
    colorTextTertiary: '#B8A389',
    borderRadius: 12,
    fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    boxShadow: '0 2px 8px rgba(139, 90, 43, 0.08)',
    boxShadowSecondary: '0 4px 16px rgba(139, 90, 43, 0.12)',
    controlHeight: 40,
    controlHeightSM: 32,
    controlHeightLG: 48,
  },
  components: {
    Button: {
      colorPrimary: '#DE944A',
      colorPrimaryHover: '#E8A55E',
      colorPrimaryActive: '#C97E38',
      controlHeight: 40,
      borderRadius: 10,
      fontWeight: 500,
      contentFontSize: 14,
    },
    Card: {
      colorBorderSecondary: '#F5E6D3',
      borderRadiusLG: 16,
      boxShadowTertiary: '0 4px 20px rgba(139, 90, 43, 0.1)',
    },
    Slider: {
      trackBg: '#DE944A',
      railBg: '#F5E6D3',
      handleColor: '#FFFFFF',
      handleBorderColor: '#DE944A',
      handleSize: 20,
    },
    Input: {
      colorBorder: '#E8D5BE',
      hoverBorderColor: '#DE944A',
      activeBorderColor: '#DE944A',
      colorBgContainer: '#FFFFFF',
      borderRadius: 10,
    },
    Select: {
      colorBorder: '#E8D5BE',
      colorPrimaryHover: '#DE944A',
      colorBgContainer: '#FFFFFF',
      borderRadius: 10,
      controlItemBgActive: '#FFF2E2',
      controlItemBgHover: '#FFF8F0',
    },
    Modal: {
      colorBgElevated: '#FFFFFF',
      borderRadiusLG: 16,
    },
    Drawer: {
      colorBgElevated: '#FFFFFF',
    },
    Divider: {
      colorSplit: '#F5E6D3',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Progress: {
      colorInfo: '#DE944A',
      textColor: '#8B5A2B',
    },
    Tooltip: {
      colorBgSpotlight: '#3D2914',
      borderRadius: 8,
    },
    Tabs: {
      itemColor: '#8B7355',
      itemSelectedColor: '#8B5A2B',
      itemHoverColor: '#DE944A',
      itemActiveColor: '#DE944A',
      inkBarColor: '#DE944A',
    },
  },
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={theme}>
      <AntdApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
