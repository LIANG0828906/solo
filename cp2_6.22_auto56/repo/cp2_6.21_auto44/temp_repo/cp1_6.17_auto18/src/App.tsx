import React, { useEffect, useState } from 'react';
import { Layout, Tabs } from 'antd';
import { DashboardOutlined, GiftOutlined, SettingOutlined } from '@ant-design/icons';
import DanmakuPanel from './components/DanmakuPanel';
import GiftPanel from './components/GiftPanel';
import RankingTable from './components/RankingTable';
import GiftManager from './components/GiftManager';
import TestTool from './components/TestTool';
import { useDashboardStore } from './stores/dashboardStore';
import './App.css';

const { Content } = Layout;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const fetchGifts = useDashboardStore((state) => state.fetchGifts);
  const fetchRanking = useDashboardStore((state) => state.fetchRanking);

  useEffect(() => {
    fetchGifts();
    fetchRanking();
  }, []);

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <DashboardOutlined />
          实时看板
        </span>
      ),
    },
    {
      key: 'gifts',
      label: (
        <span>
          <GiftOutlined />
          礼物管理
        </span>
      ),
    },
  ];

  return (
    <Layout className="app-layout">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">直播仪表盘</span>
          </div>
        </div>
        <div className="header-center">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="header-tabs"
          />
        </div>
        <div className="header-right">
          <div className="status-indicator">
            <span className="status-dot online" />
            <span className="status-text">在线</span>
          </div>
        </div>
      </header>

      <Content className="app-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard-container">
            <div className="side-panel left-panel">
              <DanmakuPanel />
            </div>
            <div className="center-panel">
              <RankingTable />
            </div>
            <div className="side-panel right-panel">
              <GiftPanel />
            </div>
          </div>
        )}

        {activeTab === 'gifts' && (
          <div className="gifts-page">
            <GiftManager />
          </div>
        )}
      </Content>

      <TestTool />
    </Layout>
  );
};

export default App;
