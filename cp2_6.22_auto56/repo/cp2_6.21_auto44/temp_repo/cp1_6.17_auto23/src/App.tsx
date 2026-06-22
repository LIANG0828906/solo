import { useState, useEffect } from 'react';
import { Tabs, ConfigProvider, Spin, Button } from 'antd';
import { EnvironmentOutlined, ReadOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import MapView from './components/MapView';
import TravelogList from './components/TravelogList';
import TravelogDetail from './components/TravelogDetail';
import { useMapStore } from './store/mapStore';
import { useTravelogStore } from './store/travelogStore';

function App() {
  const [activeTab, setActiveTab] = useState('map');
  const [selectedTravelogId, setSelectedTravelogId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const { fetchCheckins, userPosition, setUserPosition } = useMapStore();
  const { fetchTravelogs, travelogs } = useTravelogStore();

  useEffect(() => {
    fetchCheckins();
    fetchTravelogs();

    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let positionReceived = false;

    const setDefaultPosition = () => {
      if (!positionReceived) {
        positionReceived = true;
        setUserPosition([39.9042, 116.4074]);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!positionReceived) {
            positionReceived = true;
            if (fallbackTimer) clearTimeout(fallbackTimer);
            setUserPosition([position.coords.latitude, position.coords.longitude]);
          }
        },
        () => {
          setDefaultPosition();
        },
        { timeout: 5000, maximumAge: 60000 }
      );
      fallbackTimer = setTimeout(setDefaultPosition, 3000);
    } else {
      setDefaultPosition();
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [fetchCheckins, fetchTravelogs, setUserPosition]);

  const handleTabChange = (key: string) => {
    if (key === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(key);
      setSelectedTravelogId(null);
      setAnimating(false);
    }, 150);
  };

  const handleTravelogClick = (travelogId: string) => {
    setSelectedTravelogId(travelogId);
  };

  const handleBackToList = () => {
    setSelectedTravelogId(null);
  };

  const selectedTravelog = selectedTravelogId
    ? travelogs.find((t) => t.id === selectedTravelogId) || null
    : null;

  const tabItems = [
    {
      key: 'map',
      label: (
        <span>
          <EnvironmentOutlined />
          地图签到处
        </span>
      ),
    },
    {
      key: 'travelogs',
      label: (
        <span>
          <ReadOutlined />
          我的游记
        </span>
      ),
    },
  ];

  const renderContent = () => {
    if (activeTab === 'map') {
      if (!userPosition) {
        return (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Spin size="large" />
            <span style={{ color: '#757575' }}>正在定位...</span>
          </div>
        );
      }
      return <MapView />;
    }

    if (selectedTravelog) {
      return (
        <div>
          <div
            style={{
              position: 'absolute',
              top: 110,
              left: 24,
              zIndex: 100,
            }}
          >
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToList}
              style={{
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              返回列表
            </Button>
          </div>
          <TravelogDetail travelog={selectedTravelog} onBack={handleBackToList} />
        </div>
      );
    }
    return <TravelogList onTravelogClick={handleTravelogClick} />;
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1976D2',
          borderRadius: 4,
        },
      }}
    >
      <div className="app-container">
        <div className="app-header">旅行签到与游记生成器</div>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          style={{
            position: 'absolute',
            top: 56,
            left: 0,
            right: 0,
            zIndex: 100,
            background: 'white',
          }}
        />
        <div className="app-content" style={{ paddingTop: 45 }}>
          <div className={animating ? 'fade-enter' : 'fade-enter-active'}>
            {renderContent()}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default App;
