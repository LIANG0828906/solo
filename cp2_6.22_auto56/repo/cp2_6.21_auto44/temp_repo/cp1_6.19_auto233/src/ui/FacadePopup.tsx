import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAppStore } from '@/store/appStore';
import { FACADE_NAMES } from '@/types';

export const FacadePopup = () => {
  const { selectedFacadeId, facadeData, buildings, selectFacade } = useAppStore();

  const selectedData = useMemo(() => {
    if (!selectedFacadeId) return null;
    const [buildingId, facadeIndexStr] = selectedFacadeId.split('-');
    const facadeIndex = parseInt(facadeIndexStr);
    const fd = facadeData.find(
      (f) => f.buildingId === buildingId && f.facadeIndex === facadeIndex
    );
    const building = buildings.find((b) => b.id === buildingId);
    return fd && building ? { fd, building, facadeIndex } : null;
  }, [selectedFacadeId, facadeData, buildings]);

  const chartData = useMemo(() => {
    if (!selectedData) return [];
    return selectedData.fd.hourlyIntensity
      .map((intensity, hour) => ({
        hour: `${hour}:00`,
        hourNum: hour,
        intensity: Math.round(intensity * 100) / 100,
      }))
      .filter((d) => d.hourNum >= 5 && d.hourNum <= 19);
  }, [selectedData]);

  const handleClose = () => {
    selectFacade(null, null);
  };

  if (!selectedData) return null;

  const { fd, building, facadeIndex } = selectedData;

  const lineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#1A2236',
            border: '1px solid #2A3A5C',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <p style={{ color: '#E0E6F0', margin: 0, marginBottom: '4px' }}>{label}</p>
          <p style={{ color: '#FFD700', margin: 0 }}>强度: {payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <AnimatePresence>
      <motion.div
        className="popup"
        style={{
          right: '310px',
          top: '50%',
          transform: 'translateY(-50%)',
        }}
        initial={{ opacity: 0, x: 20, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <div className="popup-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sun size={16} color="#FFD700" />
            <span>{FACADE_NAMES[facadeIndex]}</span>
          </div>
          <button className="popup-close" onClick={handleClose}>
            <X size={16} />
          </button>
        </div>

        <div style={{ fontSize: '11px', color: '#8899BB', marginBottom: '4px' }}>
          建筑位置: ({building.position.x.toFixed(1)}, {building.position.z.toFixed(1)})
        </div>

        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: '#8899BB', marginBottom: '4px' }}>
            当日累计日照时长
          </div>
          <div className="sunlight-value">
            {fd.sunlightHours}
            <span className="sunlight-unit">小时</span>
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: `linear-gradient(to right, #1A1A40 0%, #FFD700 ${(fd.sunlightHours / 12) * 100}%, #2A3A5C ${(fd.sunlightHours / 12) * 100}%)`,
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              color: '#8899BB',
              marginTop: '4px',
            }}
          >
            <span>0h</span>
            <span>12h</span>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#8899BB', marginBottom: '8px' }}>
            24小时光照强度曲线
          </div>
          <div style={{ height: '120px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3A5C" />
                <XAxis
                  dataKey="hour"
                  stroke="#8899BB"
                  tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                  interval={2}
                />
                <YAxis
                  stroke="#8899BB"
                  tick={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }}
                  domain={[0, 'auto']}
                />
                <Tooltip content={lineTooltip} />
                <Line
                  type="monotone"
                  dataKey="intensity"
                  stroke="#FFD700"
                  strokeWidth={2}
                  dot={{ fill: '#FFD700', r: 3 }}
                  activeDot={{ r: 5, fill: '#4FC3F7' }}
                  animationDuration={500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          style={{
            marginTop: '12px',
            padding: '8px',
            background: 'rgba(79, 195, 247, 0.1)',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#4FC3F7',
          }}
        >
          立面颜色:{' '}
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              background: fd.color,
              borderRadius: '2px',
              marginRight: '4px',
              verticalAlign: 'middle',
            }}
          />
          {fd.color}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
