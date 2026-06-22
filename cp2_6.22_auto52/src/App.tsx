import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import SensorDashboard from './components/SensorDashboard';
import RuleEditor from './components/RuleEditor';
import DeviceControl from './components/DeviceControl';
import NotificationQueue from './components/NotificationQueue';

type Tab = 'sensor' | 'rule' | 'device';

const TABS: { key: Tab; label: string }[] = [
  { key: 'sensor', label: 'Sensor Dashboard' },
  { key: 'rule', label: 'Rule Editor' },
  { key: 'device', label: 'Device Control' },
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('sensor');
  const [sensorData, setSensorData] = useState<any>({});
  const [historyData, setHistoryData] = useState<any>({});
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<
    Array<{ id: string; type: string; message: string; timestamp: number }>
  >([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(window.location.origin, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('sensor-data', (update: any) => {
      setSensorData((prev: any) => ({
        ...prev,
        [update.roomId]: {
          ...update.sensors,
          _timestamp: update.timestamp,
        },
      }));

      setHistoryData((prev: any) => {
        const roomHist = prev[update.roomId] || { temperature: [], humidity: [], light: [] };
        const next = {
          temperature: [...roomHist.temperature, update.sensors.temperature].slice(-100),
          humidity: [...roomHist.humidity, update.sensors.humidity].slice(-100),
          light: [...roomHist.light, update.sensors.light].slice(-100),
        };
        return { ...prev, [update.roomId]: next };
      });
    });

    socket.on('device-update', (device: any) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? device : d))
      );
    });

    socket.on('rule-triggered', (data: any) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: `rt-${data.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'rule-triggered',
          message: `Rule "${data.rule?.name || 'Unknown'}" triggered in ${data.roomId}`,
          timestamp: data.timestamp,
        },
      ]);
    });

    socket.on('alert', (data: any) => {
      setNotifications((prev) => [
        ...prev,
        {
          id: `alert-${data.timestamp}-${Math.random().toString(36).slice(2, 8)}`,
          type: 'alert',
          message: data.message,
          timestamp: data.timestamp,
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [sensorsRes, devicesRes] = await Promise.all([
          axios.get('/api/sensors'),
          axios.get('/api/devices'),
        ]);
        const now = Date.now();
        const withTs: Record<string, any> = {};
        for (const [room, data] of Object.entries<any>(sensorsRes.data)) {
          withTs[room] = { ...data, _timestamp: now };
        }
        setSensorData(withTs);
        setDevices(devicesRes.data);

        const rooms = Object.keys(sensorsRes.data);
        const histResults = await Promise.all(
          rooms.map((room) =>
            axios.get(`/api/sensors/${room}/history`).then((res) => ({
              room,
              data: res.data,
            })).catch(() => ({ room, data: null }))
          )
        );
        const histMap: any = {};
        for (const { room, data } of histResults) {
          if (data) histMap[room] = data;
        }
        setHistoryData(histMap);
      } catch (err) {
        console.error('Failed to fetch initial data', err);
      }
    };
    fetchInitial();
  }, []);

  const handleToggleDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, state: { ...d.state, on: !d.state.on } } : d
      )
    );
  };

  const handleSetMode = (id: string, mode: string) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, state: { ...d.state, mode } } : d
      )
    );
  };

  const handleSetValue = (id: string, key: string, value: number) => {
    setDevices((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, state: { ...d.state, [key]: value } } : d
      )
    );
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>🏠 Smart Home</h1>
        <nav style={styles.tabBar}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...styles.tab,
                ...(activeTab === tab.key ? styles.tabActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main style={styles.main}>
        {activeTab === 'sensor' && (
          <SensorDashboard
            sensorData={sensorData}
            historyData={historyData}
            onSelectRoom={setSelectedRoom}
            selectedRoom={selectedRoom}
          />
        )}
        {activeTab === 'rule' && <RuleEditor />}
        {activeTab === 'device' && (
          <DeviceControl
            devices={devices}
            onToggle={handleToggleDevice}
            onSetMode={handleSetMode}
            onSetValue={handleSetValue}
          />
        )}
      </main>

      <NotificationQueue notifications={notifications} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#1a1a2e',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '0.8rem 1.5rem',
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  logo: {
    fontSize: 20,
    color: '#e8b83a',
    whiteSpace: 'nowrap' as const,
  },
  tabBar: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    padding: '0.5rem 1.2rem',
    borderRadius: 8,
    fontSize: 14,
    color: '#a0a0b0',
    background: 'transparent',
    transition: 'background-color 0.2s, color 0.2s',
  },
  tabActive: {
    background: 'rgba(232, 184, 58, 0.15)',
    color: '#e8b83a',
    fontWeight: 600,
  },
  main: {
    flex: 1,
    display: 'flex',
    minHeight: 0,
  },
};

export default App;
