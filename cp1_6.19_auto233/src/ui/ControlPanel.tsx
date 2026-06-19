import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Trash2, Move3d, Sun } from 'lucide-react';
import { useAppStore } from '@/store/appStore';

const formatDate = (date: Date): string => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
};

const formatTime = (time: number): string => {
  const hours = Math.floor(time);
  const minutes = Math.round((time - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const dayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const dateFromDayOfYear = (year: number, day: number): Date => {
  const date = new Date(year, 0);
  date.setDate(day);
  return date;
};

export const ControlPanel = () => {
  const {
    date,
    time,
    latitude,
    longitude,
    buildings,
    selectedBuildingId,
    setDate,
    setTime,
    setLatitude,
    setLongitude,
    updateBuildingHeight,
    removeBuilding,
    sunPosition,
  } = useAppStore();

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId),
    [buildings, selectedBuildingId]
  );

  const currentDay = dayOfYear(date);
  const year = date.getFullYear();

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const day = parseInt(e.target.value);
    setDate(dateFromDayOfYear(year, day));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(parseFloat(e.target.value));
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedBuildingId) {
      updateBuildingHeight(selectedBuildingId, parseFloat(e.target.value));
    }
  };

  const handleDelete = () => {
    if (selectedBuildingId) {
      removeBuilding(selectedBuildingId);
    }
  };

  const sunAltitudeDeg = (sunPosition.altitude * 180) / Math.PI;
  const sunAzimuthDeg = (sunPosition.azimuth * 180) / Math.PI;

  return (
    <motion.div
      className="right-panel panel"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="control-group">
        <div className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} />
            日期设置
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label>日期</label>
            <span className="value-display">{formatDate(date)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="365"
            value={currentDay}
            onChange={handleDateChange}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8899BB', marginTop: '4px' }}>
            <span>1月1日</span>
            <span>12月31日</span>
          </div>
        </div>
      </div>

      <div className="control-group">
        <div className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            时间设置
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label>时间</label>
            <span className="value-display">{formatTime(time)}</span>
          </div>
          <input
            type="range"
            min="6"
            max="18"
            step="0.1"
            value={time}
            onChange={handleTimeChange}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8899BB', marginTop: '4px' }}>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
          </div>
        </div>
      </div>

      <div className="control-group">
        <div className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={14} />
            地理位置
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label>纬度</label>
            <input
              type="number"
              value={latitude}
              onChange={(e) => setLatitude(parseFloat(e.target.value))}
              min="-90"
              max="90"
              step="0.1"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>经度</label>
            <input
              type="number"
              value={longitude}
              onChange={(e) => setLongitude(parseFloat(e.target.value))}
              min="-180"
              max="180"
              step="0.1"
              style={{ width: '100%', marginTop: '4px' }}
            />
          </div>
        </div>
      </div>

      <div className="control-group">
        <div className="section-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sun size={14} />
            太阳位置
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label>高度角</label>
            <div className="value-display" style={{ marginTop: '4px' }}>
              {sunAltitudeDeg.toFixed(1)}°
            </div>
          </div>
          <div>
            <label>方位角</label>
            <div className="value-display" style={{ marginTop: '4px' }}>
              {sunAzimuthDeg.toFixed(1)}°
            </div>
          </div>
        </div>
      </div>

      {selectedBuilding && (
        <motion.div
          className="control-group"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="section-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Move3d size={14} />
              选中建筑
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label>建筑高度</label>
              <span className="value-display">{selectedBuilding.size.height.toFixed(1)} 单位</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={selectedBuilding.size.height}
              onChange={handleHeightChange}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#8899BB', marginTop: '4px' }}>
              <span>1</span>
              <span>10</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label>宽度</label>
              <div className="value-display" style={{ marginTop: '4px' }}>
                {selectedBuilding.size.width}
              </div>
            </div>
            <div>
              <label>深度</label>
              <div className="value-display" style={{ marginTop: '4px' }}>
                {selectedBuilding.size.depth}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: '8px' }}>
            <label>位置</label>
            <div className="value-display mono" style={{ marginTop: '4px', fontSize: '12px' }}>
              ({selectedBuilding.position.x.toFixed(1)}, {selectedBuilding.position.z.toFixed(1)})
            </div>
          </div>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={16} />
            删除建筑
          </button>
        </motion.div>
      )}

      <div className="control-group">
        <div className="section-title">统计信息</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label>建筑总数</label>
            <div className="value-display" style={{ marginTop: '4px' }}>
              {buildings.length}
            </div>
          </div>
          <div>
            <label>街区数量</label>
            <div className="value-display" style={{ marginTop: '4px' }}>
              {new Set(buildings.map((b) => b.blockId)).size}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
