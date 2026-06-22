import React, { useState } from 'react';
import { Tabs, Layout } from 'antd';
import {
  EnvironmentOutlined,
  BookOutlined,
} from '@ant-design/icons';
import MapView from './components/MapView';
import TravelogList from './components/TravelogList';
import TravelogDetail from './components/TravelogDetail';
import type { Travelog } from './types';

const { Header, Content } = Layout;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedTravelog, setSelectedTravelog] = useState<Travelog | null>(null);
  const [contentKey, setContentKey] = useState(0);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSelectedTravelog(null);
    setContentKey((prev) => prev + 1);
  };

  const handleSelectTravelog = (travelog: Travelog) => {
    setSelectedTravelog(travelog);
  };

  const handleBackToList = () => {
    setSelectedTravelog(null);
  };

  const items = [
    {
      key: 'map',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <EnvironmentOutlined />
          地图签到处
        </span>
      ),
    },
    {
      key: 'travelogs',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BookOutlined />
          我的游记
        </span>
      ),
    },
  ];

  const renderContent = () => {
    if (activeTab === 'map') {
      return <MapView key="map" />;
    }

    if (activeTab === 'travelogs') {
      if (selectedTravelog) {
        return (
          <TravelogDetail
            key={`detail-${selectedTravelog.id}`}
            travelog={selectedTravelog}
            onBack={handleBackToList}
          />
        );
      }
      return (
        <TravelogList
          key="list"
          onSelectTravelog={handleSelectTravelog}
        />
      );
    }

    return null;
  };

  return (
    <Layout style={styles.layout}>
      <Header style={styles.header}>
        <div style={styles.logo}>
          <EnvironmentOutlined style={styles.logoIcon} />
          <span style={styles.logoText}>签到游记生成器</span>
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={items}
          style={styles.tabs}
          tabBarStyle={styles.tabBar}
          size="large"
        />
      </Header>
      <Content style={styles.content}>
        <div
          key={contentKey}
          style={{
            ...styles.contentInner,
            animation: 'fadeIn 0.3s ease forwards',
          }}
        >
          {renderContent()}
        </div>
      </Content>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #fff !important;
        }

        .ant-tabs-ink-bar {
          background: #BBDEFB !important;
        }

        .ant-tabs-tab .ant-tabs-tab-btn {
          color: rgba(255, 255, 255, 0.6) !important;
          transition: color 0.3s ease;
        }

        .ant-tabs-tab:hover .ant-tabs-tab-btn {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .ant-tabs-top > .ant-tabs-nav::before {
          border-bottom: none !important;
        }

        .ant-tabs-nav {
          margin-bottom: 0 !important;
        }

        .travelog-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
          transform: translateY(-3px) !important;
        }

        .travelog-card:hover .travelog-card-image {
          transform: scale(1.05) !important;
        }

        .travelog-card:hover .travelog-card-overlay {
          opacity: 1 !important;
        }

        .list-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12) !important;
        }

        .mini-map-container:hover .map-overlay {
          opacity: 1 !important;
        }

        @media (max-width: 1024px) {
          .travelog-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .travelog-grid {
            grid-template-columns: 1fr !important;
          }
          .sidebar {
            width: 280px !important;
          }
        }
      `}</style>
    </Layout>
  );
};

const styles = {
  layout: {
    height: '100vh',
    width: '100vw',
    overflow: 'hidden' as const,
  },
  header: {
    background: '#1A237E',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    lineHeight: '56px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    zIndex: 100,
    position: 'relative' as const,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 24,
    color: '#BBDEFB',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 600,
    color: '#fff',
  },
  tabs: {
    marginLeft: 32,
  },
  tabBar: {
    background: 'transparent',
    border: 'none',
  },
  content: {
    flex: 1,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  contentInner: {
    width: '100%',
    height: '100%',
    opacity: 0,
  },
};

export default App;
