import { useSiteStore } from '../store/siteStore';
import { FACILITY_CONFIGS } from '../types';
import type { FacilityType } from '../types';
import { motion } from 'framer-motion';

export function StatsPanel() {
  const facilities = useSiteStore((s) => s.facilities);
  const getTypeCounts = useSiteStore((s) => s.getTypeCounts);
  const getAverageDensity = useSiteStore((s) => s.getAverageDensity);
  const getMaxHeatPoint = useSiteStore((s) => s.getMaxHeatPoint);
  const isSimulating = useSiteStore((s) => s.isSimulating);

  const totalCount = facilities.length;
  const typeCounts = getTypeCounts();
  const avgDensity = getAverageDensity();
  const maxPoint = getMaxHeatPoint();

  const typeEntries = Object.entries(typeCounts) as [FacilityType, number][];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: '200px',
        background: 'rgba(255, 255, 255, 0.87)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        padding: '12px',
        zIndex: 1000,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{
        fontSize: '13px',
        fontWeight: 700,
        color: '#1A1A2E',
        marginBottom: '10px',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        paddingBottom: '8px',
      }}>
        📊 场地统计
      </div>

      <div style={{ fontSize: '12px', color: '#333', marginBottom: '8px' }}>
        <span style={{ color: '#666' }}>设施总数:</span>{' '}
        <span style={{ fontWeight: 700, color: '#E94560' }}>{totalCount}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
          类型分布:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {typeEntries.map(([type, count]) => {
            const config = FACILITY_CONFIGS[type];
            const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px' }}>{config.icon}</span>
                <div style={{
                  flex: 1,
                  height: '6px',
                  background: '#eee',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: config.color,
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#666', minWidth: '24px', textAlign: 'right' }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.1)',
        paddingTop: '8px',
        fontSize: '12px',
      }}>
        <div style={{ color: '#666', marginBottom: '4px' }}>平均人流密度:</div>
        <motion.div
          key={avgDensity}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.3 }}
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: isSimulating
              ? avgDensity > 0.05 ? '#F44336' : avgDensity > 0.02 ? '#FF9800' : '#4CAF50'
              : '#999',
          }}
        >
          {isSimulating ? `${(avgDensity * 100).toFixed(2)}%` : '--'}
        </motion.div>
      </div>

      {isSimulating && maxPoint && (
        <div style={{
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(0,0,0,0.1)',
          fontSize: '11px',
        }}>
          <div style={{ color: '#666', marginBottom: '2px' }}>
            🔥 最高密度点:
          </div>
          <div style={{ color: '#E94560', fontWeight: 600 }}>
            {maxPoint.lat.toFixed(4)}, {maxPoint.lng.toFixed(4)}
          </div>
        </div>
      )}
    </motion.div>
  );
}
