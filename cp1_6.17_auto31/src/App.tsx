import { useState } from 'react';
import { Tabs, ConfigProvider, theme } from 'antd';
import {
  EnvironmentOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import MapView from '@/components/MapView';
import TravelogList from '@/components/TravelogList';
import TravelogDetail from '@/components/TravelogDetail';
import type { Travelog } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedTravelog, setSelectedTravelog] = useState<Travelog | null>(null);

  const handleSelectTravelog = (travelog: Travelog) => {
    setSelectedTravelog(travelog);
  };

  const handleBackToList = () => {
    setSelectedTravelog(null);
  };

  const renderTravelogTab = () => {
    if (selectedTravelog) {
      return (
        <div className="tab-content">
          <TravelogDetail travelog={selectedTravelog} onBack={handleBackToList} />
        </div>
      );
    }
    return (
      <div className="tab-content">
        <TravelogList onSelectTravelog={handleSelectTravelog} />
      </div>
    );
  };

  const tabItems = [
    {
      key: 'map',
      label: (
        <span>
          <EnvironmentOutlined style={{ marginRight: '6px' }} />
          地图签到处
        </span>
      ),
      children: (
        <div className="tab-content">
          <MapView />
        </div>
      ),
    },
    {
      key: 'travelog',
      label: (
        <span>
          <ReadOutlined style={{ marginRight: '6px' }} />
          我的游记
        </span>
      ),
      children: renderTravelogTab(),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1A237E',
          colorInfo: '#1976D2',
          borderRadius: 8,
        },
        components: {
          Tabs: {
            itemSelectedColor: '#1A237E',
            inkBarColor: '#1A237E',
            itemColor: '#757575',
            titleFontSize: 16,
          },
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <div className="app-container">
        <header className="app-header">
          <div className="app-logo">
            <EnvironmentOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
            位置签到与游记生成器
          </div>
        </header>
        <main className="app-main">
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              if (key === 'travelog') {
                setSelectedTravelog(null);
              }
            }}
            items={tabItems}
            size="large"
            className="main-tabs"
          />
        </main>
      </div>
    </ConfigProvider>
  );
}
