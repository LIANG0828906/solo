import React from 'react';
import axios from 'axios';

const DEVICE_ICONS: Record<string, string> = {
  light: '💡',
  ac: '❄️',
  curtain: '🪟',
};

const ROOM_LABELS: Record<string, string> = {
  living: '客厅',
  bedroom: '卧室',
  kitchen: '厨房',
  bathroom: '卫生间',
};

const AC_MODES = [
  { value: 'cooling', label: '制冷 Cooling' },
  { value: 'heating', label: '制热 Heating' },
  { value: 'fan', label: '送风 Fan' },
];

interface DeviceControlProps {
  devices: any[];
  onToggle: (id: string) => void;
  onSetMode: (id: string, mode: string) => void;
  onSetValue: (id: string, key: string, value: number) => void;
}

const DeviceControl: React.FC<DeviceControlProps> = ({
  devices,
  onToggle,
  onSetMode,
  onSetValue,
}) => {
  const total = devices.length;
  const online = devices.filter((d) => d.state?.on).length;

  const handleToggle = async (id: string) => {
    try {
      const res = await axios.post(`/api/devices/${id}/toggle`);
      onToggle(id);
    } catch {}
  };

  const handleMode = async (id: string, mode: string) => {
    try {
      await axios.post(`/api/devices/${id}/mode`, { mode });
      onSetMode(id, mode);
    } catch {}
  };

  const handleValue = async (id: string, key: string, value: number) => {
    try {
      await axios.post(`/api/devices/${id}/value`, { key, value });
      onSetValue(id, key, value);
    } catch {}
  };

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <span style={styles.stat}>Devices: <strong>{total}</strong></span>
        <span style={styles.stat}>Online: <strong style={{ color: '#4caf50' }}>{online}</strong></span>
      </div>

      <div style={styles.grid}>
        {devices.map((device) => {
          const isOn = device.state?.on ?? false;
          return (
            <div
              key={device.id}
              className="card"
              style={styles.deviceCard}
            >
              <div style={styles.cardHeader}>
                <span style={styles.roomLabel}>{ROOM_LABELS[device.room] || device.room}</span>
                <span style={styles.deviceIcon}>{DEVICE_ICONS[device.type] || '📡'}</span>
              </div>

              <div style={styles.deviceName}>{device.name}</div>

              <div style={styles.stateRow}>
                <span style={{ ...styles.stateIndicator, color: isOn ? '#4caf50' : '#777' }}>
                  {isOn ? 'ON' : 'OFF'}
                </span>
                {device.type === 'ac' && isOn && device.state?.temperature != null && (
                  <span style={styles.tempDisplay}>{device.state.temperature}°C</span>
                )}
              </div>

              <div style={styles.controls}>
                <button
                  className="switch-btn"
                  style={{
                    ...styles.switchBtn,
                    backgroundColor: isOn ? '#4caf50' : '#555',
                    color: isOn ? '#fff' : '#ccc',
                  }}
                  onClick={() => handleToggle(device.id)}
                >
                  {isOn ? 'ON' : 'OFF'}
                </button>

                {device.type === 'ac' && (
                  <select
                    style={styles.modeSelect}
                    value={device.state?.mode || 'cooling'}
                    onChange={(e) => handleMode(device.id, e.target.value)}
                  >
                    {AC_MODES.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                )}

                {device.type === 'ac' && isOn && (
                  <input
                    type="range"
                    min={16}
                    max={30}
                    value={device.state?.temperature ?? 24}
                    onChange={(e) => handleValue(device.id, 'temperature', Number(e.target.value))}
                    style={styles.slider}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '1.5rem',
    flex: 1,
  },
  topBar: {
    display: 'flex',
    gap: 24,
    marginBottom: 20,
    padding: '0.8rem 1.2rem',
    background: 'linear-gradient(135deg, #16213e, #0f3460)',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  stat: {
    fontSize: 14,
    color: '#e0e0e0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  deviceCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    cursor: 'default',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomLabel: {
    fontSize: 12,
    color: '#a0a0b0',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceName: {
    fontSize: 15,
    fontWeight: 600,
    color: '#e0e0e0',
  },
  stateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  stateIndicator: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
  },
  tempDisplay: {
    fontSize: 13,
    color: '#e8b83a',
    fontWeight: 600,
  },
  controls: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 4,
  },
  switchBtn: {
    padding: '0.45rem 1rem',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 1,
    transition: 'background-color 0.3s ease, color 0.3s ease',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  modeSelect: {
    background: '#16213e',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6,
    padding: '0.3rem 0.5rem',
    color: '#e0e0e0',
    fontSize: 12,
  },
  slider: {
    width: '100%',
    accentColor: '#e8b83a',
  },
};

export default DeviceControl;
