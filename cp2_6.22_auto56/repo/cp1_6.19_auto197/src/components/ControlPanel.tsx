import { useState, useEffect } from 'react';
import { useSiteStore } from '../store/siteStore';
import { FacilityType, FACILITY_CONFIGS } from '../types';
import type { Facility } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

type SortMode = 'default' | 'density-desc' | 'density-asc';

export function ControlPanel() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isExpanded, setIsExpanded] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>('default');

  const facilities = useSiteStore((s) => s.facilities);
  const selectedFacilityType = useSiteStore((s) => s.selectedFacilityType);
  const isPlacingMode = useSiteStore((s) => s.isPlacingMode);
  const densityFactor = useSiteStore((s) => s.densityFactor);
  const isSimulating = useSiteStore((s) => s.isSimulating);

  const setSelectedFacilityType = useSiteStore((s) => s.setSelectedFacilityType);
  const setPlacingMode = useSiteStore((s) => s.setPlacingMode);
  const setDensityFactor = useSiteStore((s) => s.setDensityFactor);
  const startSimulation = useSiteStore((s) => s.startSimulation);
  const stopSimulation = useSiteStore((s) => s.stopSimulation);
  const removeFacility = useSiteStore((s) => s.removeFacility);
  const clearFacilities = useSiteStore((s) => s.clearFacilities);
  const getFacilityDensity = useSiteStore((s) => s.getFacilityDensity);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const facilityTypes = Object.values(FACILITY_CONFIGS);
  const typeCounts = facilityTypes.reduce((acc, cfg) => {
    acc[cfg.type] = facilities.filter((f) => f.type === cfg.type).length;
    return acc;
  }, {} as Record<FacilityType, number>);

  const sortedFacilities = [...facilities].sort((a, b) => {
    if (sortMode === 'density-desc') {
      return getFacilityDensity(b.id) - getFacilityDensity(a.id);
    } else if (sortMode === 'density-asc') {
      return getFacilityDensity(a.id) - getFacilityDensity(b.id);
    }
    return 0;
  });

  const handleAddClick = () => {
    setPlacingMode(!isPlacingMode);
  };

  const panelContent = (
    <>
      <div style={{
        fontSize: '16px',
        fontWeight: 700,
        color: 'white',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        🎵 音乐节场地规划
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.7)',
          marginBottom: '8px',
        }}>
          选择设施类型
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          {facilityTypes.map((cfg) => {
            const isSelected = selectedFacilityType === cfg.type;
            return (
              <motion.button
                key={cfg.type}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedFacilityType(cfg.type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: isSelected ? `2px solid ${cfg.color}` : '2px solid transparent',
                  background: isSelected
                    ? `${cfg.color}33`
                    : 'rgba(255,255,255,0.06)',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: '16px' }}>{cfg.icon}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600 }}>{cfg.name}</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>
                    {typeCounts[cfg.type]} 个
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <motion.button
        whileHover={{
          filter: 'brightness(1.15)',
          scale: 1.02,
        }}
        whileTap={{ scale: 0.98 }}
        onClick={handleAddClick}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: isPlacingMode ? '#4CAF50' : '#E94560',
          color: 'white',
          border: 'none',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
        }}
      >
        {isPlacingMode ? '📍 点击地图放置...' : '➕ 添加设施'}
      </motion.button>

      <div style={{ marginBottom: '16px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            人群密度因子
          </span>
          <span style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#E94560',
          }}>
            {densityFactor}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={500}
          value={densityFactor}
          onChange={(e) => setDensityFactor(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255,255,255,0.1)',
            outline: 'none',
            cursor: 'pointer',
            WebkitAppearance: 'none',
            appearance: 'none',
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.4)',
          marginTop: '4px',
        }}>
          <span>10</span>
          <span>250</span>
          <span>500</span>
        </div>
      </div>

      <motion.button
        whileHover={{ filter: 'brightness(1.15)', scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={isSimulating ? stopSimulation : startSimulation}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '8px',
          background: isSimulating ? '#F44336' : '#4CAF50',
          color: 'white',
          border: 'none',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '16px',
          transition: 'all 0.2s ease',
          fontFamily: 'inherit',
        }}
      >
        {isSimulating ? '⏹ 停止模拟' : '▶ 模拟人流'}
      </motion.button>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '12px',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 600,
        }}>
          设施列表 ({facilities.length})
        </span>
        <select
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SortMode)}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 6px',
            fontSize: '10px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <option value="default">默认排序</option>
          <option value="density-desc">密度↓</option>
          <option value="density-asc">密度↑</option>
        </select>
      </div>

      <div style={{
        maxHeight: isMobile ? '200px' : 'calc(100vh - 480px)',
        overflowY: 'auto',
        marginBottom: '12px',
        paddingRight: '4px',
      }}>
        {sortedFacilities.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '12px',
            padding: '20px 0',
          }}>
            暂无设施
          </div>
        ) : (
          sortedFacilities.map((facility) => (
            <FacilityListItem
              key={facility.id}
              facility={facility}
              density={getFacilityDensity(facility.id)}
              isSimulating={isSimulating}
              onRemove={() => removeFacility(facility.id)}
            />
          ))
        )}
      </div>

      {facilities.length > 0 && (
        <motion.button
          whileHover={{ filter: 'brightness(1.15)' }}
          whileTap={{ scale: 0.98 }}
          onClick={clearFacilities}
          style={{
            width: '100%',
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(244, 67, 54, 0.2)',
            color: '#F44336',
            border: '1px solid rgba(244, 67, 54, 0.4)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
          }}
        >
          🗑 清空全部设施
        </motion.button>
      )}
    </>
  );

  if (isMobile) {
    return (
      <motion.div
        initial={false}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(22, 33, 62, 0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '2px solid #E94560',
          borderRadius: '0 0 12px 12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'inherit',
          }}
        >
          <span>🎵 场地规划面板</span>
          <span>{isExpanded ? '▲' : '▼'}</span>
        </button>
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 16px 16px' }}>{panelContent}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '280px',
        background: 'rgba(22, 33, 62, 0.73)',
        backdropFilter: 'blur(10px)',
        borderRadius: '0 12px 12px 0',
        borderRight: '2px solid #E94560',
        padding: '16px',
        zIndex: 1000,
        overflowY: 'auto',
        overflowX: 'hidden',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
      }}
    >
      {panelContent}
    </motion.div>
  );
}

function FacilityListItem({
  facility,
  density,
  isSimulating,
  onRemove,
}: {
  facility: Facility;
  density: number;
  isSimulating: boolean;
  onRemove: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      whileHover={{ background: 'rgba(15, 52, 96, 0.8)' }}
      style={{
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        borderRadius: '6px',
        marginBottom: '4px',
        gap: '8px',
        transition: 'background 0.2s ease',
      }}
    >
      <span style={{ fontSize: '18px' }}>{facility.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '12px',
          color: 'white',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {facility.name}
        </div>
        <div style={{
          width: '40px',
          height: '3px',
          background: facility.color,
          borderRadius: '2px',
          marginTop: '2px',
          opacity: 0.6,
        }} />
      </div>
      {isSimulating && (
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: density > 0.7 ? '#F44336' : density > 0.3 ? '#FF9800' : '#4CAF50',
          minWidth: '36px',
          textAlign: 'right',
        }}>
          {(density * 100).toFixed(0)}%
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.5)',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '4px',
          lineHeight: 1,
          fontFamily: 'inherit',
        }}
      >
        ✕
      </motion.button>
    </motion.div>
  );
}
