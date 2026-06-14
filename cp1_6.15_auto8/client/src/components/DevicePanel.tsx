import { useState, useMemo } from 'react';
import { Device, Booking } from '../types';
import useDebounce from '../hooks/useDebounce';
import '../styles/DevicePanel.css';

interface DevicePanelProps {
  devices: Device[];
  bookings: Booking[];
  onBookDevice: (device: Device) => void;
  onViewHistory: (device: Device) => void;
  onAddDevice: () => void;
  onCloseMobile: () => void;
}

type FilterType = 'all' | 'available' | 'borrowed' | 'maintenance';

function DevicePanel({
  devices,
  onBookDevice,
  onViewHistory,
  onAddDevice,
  onCloseMobile,
}: DevicePanelProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 200);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesFilter = filter === 'all' || device.status === filter;
      const matchesSearch = debouncedSearchTerm === ''
        ? true
        : device.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [devices, filter, debouncedSearchTerm]);

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'available':
        return '可用';
      case 'borrowed':
        return '借用中';
      case 'maintenance':
        return '维修中';
      default:
        return status;
    }
  };

  const formatNextAvailable = (dateStr: string | null): string => {
    if (!dateStr) return '立即可用';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日后可用`;
  };

  return (
    <div className="device-panel">
      <div className="panel-header">
        <h2 className="panel-title">设备列表</h2>
        <button className="mobile-close-btn" onClick={onCloseMobile}>
          ✕
        </button>
      </div>

      <div className="panel-actions">
        <button className="add-device-btn" onClick={onAddDevice}>
          <span className="add-icon">+</span>
          添加设备
        </button>
      </div>

      <div className="filter-section">
        <input
          type="text"
          className="search-input"
          placeholder="搜索设备..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="filter-tabs">
          {(['all', 'available', 'borrowed', 'maintenance'] as FilterType[]).map((f) => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? '全部' : getStatusText(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="device-grid">
        {filteredDevices.map((device, index) => (
          <div
            key={device.id}
            className="device-card"
            style={{ animationDelay: `${Math.min(index * 0.05, 0.5)}s` }}
          >
            <div className="device-card-header">
              <span className="device-icon">{device.icon}</span>
              <div className="status-indicator" title={getStatusText(device.status)}>
                <span className={`status-dot ${device.status}`} />
                <span className="status-pulse" />
              </div>
            </div>

            <div className="device-card-body">
              <h3 className="device-name">{device.name}</h3>
              <div className="device-status-row">
                <span className={`status-dot ${device.status}`} />
                <p className={`device-status-text ${device.status}`}>
                  {getStatusText(device.status)}
                </p>
              </div>
              <p className="device-next-available">
                {device.status === 'available' && device.nextAvailableDate === null
                  ? '✅ 立即可用'
                  : `📅 ${formatNextAvailable(device.nextAvailableDate)}`}
              </p>
            </div>

            <div className="device-card-actions">
              <button
                className="card-btn book-btn"
                onClick={() => onBookDevice(device)}
                disabled={device.status === 'maintenance'}
                title={device.status === 'maintenance' ? '维修中，暂时无法预约' : '预约此设备'}
              >
                📝 预约
              </button>
              <button
                className="card-btn history-btn"
                onClick={() => onViewHistory(device)}
                title="查看借用历史"
              >
                📜 历史
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">📦</span>
          <p>没有找到设备</p>
          <button className="btn btn-secondary empty-add-btn" onClick={onAddDevice}>
            立即添加
          </button>
        </div>
      )}
    </div>
  );
}

export default DevicePanel;
