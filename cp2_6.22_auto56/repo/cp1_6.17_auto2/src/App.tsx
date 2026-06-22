import React, { useEffect } from 'react';
import { Layout, Typography } from 'antd';
import DanmakuPanel from './components/DanmakuPanel';
import GiftPanel from './components/GiftPanel';
import RankingTable from './components/RankingTable';
import TestTool from './components/TestTool';
import GiftManagement from './components/GiftManagement';
import GiftSidebar from './components/GiftSidebar';
import { useDashboardStore } from './stores/dashboardStore';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const { fetchGifts, fetchDanmakus, fetchGiftRecords, fetchRanking, startAutoRefresh } =
    useDashboardStore();

  useEffect(() => {
    fetchGifts();
    fetchDanmakus();
    fetchGiftRecords();
    fetchRanking();
    const stopRefresh = startAutoRefresh();
    return () => stopRefresh();
  }, [fetchGifts, fetchDanmakus, fetchGiftRecords, fetchRanking, startAutoRefresh]);

  return (
    <Layout style={{ minHeight: '100vh', background: '#1E1E2E' }}>
      <Header
        style={{
          background: '#2D2D44',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #444466',
        }}
      >
        <Title level={3} style={{ color: '#FF6B00', margin: 0, fontSize: 22 }}>
          🎬 直播管理仪表盘
        </Title>
      </Header>

      <Content style={{ padding: 24 }}>
        <div style={{ marginBottom: 24 }}>
          <GiftManagement />
        </div>

        <div
          className="dashboard-layout"
          style={{
            display: 'flex',
            gap: 20,
            alignItems: 'flex-start',
          }}
        >
          <DanmakuPanel />
          <RankingTable />
          <GiftPanel />
        </div>
      </Content>

      <TestTool />
      <GiftSidebar />
    </Layout>
  );
};

export default App;
