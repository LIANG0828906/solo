import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { EmissionSource, GAS_COLORS, GAS_NAMES } from '@/types';
import { getTotalEmission } from '@/data/emissionSources';

const BubbleChart = () => {
  const { emissionSources, selectedSourceId, setSelectedSourceId } = useAppStore();
  const [hoveredSource, setHoveredSource] = useState<EmissionSource | null>(null);

  const totalEmission = useMemo(() => getTotalEmission(), []);

  const bubblePositions = useMemo(() => {
    const centerX = 200;
    const centerY = 220;
    const baseRadius = 100;
    const sortedSources = [...emissionSources].sort((a, b) => b.annualEmission - a.annualEmission);
    
    return sortedSources.map((source, index) => {
      const angle = (index / sortedSources.length) * Math.PI * 2 - Math.PI / 2;
      const sizeRatio = source.annualEmission / totalEmission;
      const bubbleRadius = 20 + sizeRatio * 40;
      const orbitRadius = baseRadius + (index % 2) * 30;
      const x = centerX + Math.cos(angle) * orbitRadius;
      const y = centerY + Math.sin(angle) * orbitRadius;
      
      return {
        source,
        x,
        y,
        radius: bubbleRadius,
        color: GAS_COLORS[source.gasType],
      };
    });
  }, [emissionSources, totalEmission]);

  const handleBubbleClick = (source: EmissionSource) => {
    if (selectedSourceId === source.id) {
      setSelectedSourceId(null);
    } else {
      setSelectedSourceId(source.id);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      position: 'relative',
    }}>
      <h2 style={{
        color: '#A8D0E6',
        fontSize: '16px',
        fontWeight: 600,
        marginBottom: '12px',
        fontFamily: 'Inter, sans-serif',
      }}>
        排放源贡献分布
      </h2>

      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '12px',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        {Object.entries(GAS_COLORS).map(([gas, color]) => (
          <div key={gas} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: color,
            }} />
            <span style={{ color: '#A8D0E6', fontSize: '12px' }}>
              {GAS_NAMES[gas as keyof typeof GAS_NAMES]}
            </span>
          </div>
        ))}
      </div>

      <svg width="400" height="440" style={{ overflow: 'visible' }}>
        <defs>
          <radialGradient id="bubbleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </radialGradient>
        </defs>

        {[80, 110, 140].map((r, i) => (
          <circle
            key={i}
            cx={200}
            cy={220}
            r={r}
            fill="none"
            stroke="#2C3E50"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity={0.5}
          />
        ))}

        <AnimatePresence>
          {bubblePositions.map(({ source, x, y, radius, color }) => {
            const isSelected = selectedSourceId === source.id;
            const isHovered = hoveredSource?.id === source.id;

            return (
              <g key={source.id}>
                {isSelected && (
                  <motion.circle
                    initial={{ r: radius, opacity: 0 }}
                    animate={{ r: radius + 15, opacity: 0.8 }}
                    exit={{ r: radius, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    cx={x}
                    cy={y}
                    fill="url(#bubbleGlow)"
                  />
                )}

                <motion.circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={color}
                  stroke={isSelected ? '#FFD700' : 'transparent'}
                  strokeWidth={isSelected ? 3 : 0}
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: isHovered ? 1.15 : 1,
                    opacity: selectedSourceId && !isSelected ? 0.4 : 1,
                  }}
                  transition={{ 
                    duration: 0.3, 
                    ease: 'easeInOut',
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  style={{
                    cursor: 'pointer',
                    filter: isSelected ? 'drop-shadow(0 0 10px #FFD700)' : 'none',
                  }}
                  onMouseEnter={() => setHoveredSource(source)}
                  onMouseLeave={() => setHoveredSource(null)}
                  onClick={() => handleBubbleClick(source)}
                  whileTap={{ scale: 0.95 }}
                />

                <text
                  x={x}
                  y={y + 4}
                  textAnchor="middle"
                  fill="white"
                  fontSize="11"
                  fontWeight={600}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {source.name.slice(0, 2)}
                </text>
              </g>
            );
          })}
        </AnimatePresence>
      </svg>

      <AnimatePresence>
        {hoveredSource && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(15, 27, 51, 0.95)',
              border: '1px solid #2C3E50',
              borderRadius: '8px',
              padding: '12px 16px',
              color: 'white',
              fontSize: '13px',
              minWidth: '200px',
              textAlign: 'center',
              zIndex: 10,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px', color: GAS_COLORS[hoveredSource.gasType] }}>
              {hoveredSource.name}
            </div>
            <div style={{ color: '#A8D0E6', fontSize: '12px' }}>
              气体类型: {GAS_NAMES[hoveredSource.gasType]}
            </div>
            <div style={{ color: '#A8D0E6', fontSize: '12px', marginTop: '2px' }}>
              年排放量: <span style={{ fontFamily: 'monospace', color: 'white' }}>{hoveredSource.annualEmission.toFixed(1)} GtCO₂-eq</span>
            </div>
            <div style={{ color: '#A8D0E6', fontSize: '12px', marginTop: '2px' }}>
              升温贡献: <span style={{ fontFamily: 'monospace', color: 'white' }}>{(hoveredSource.contribution * 100).toFixed(1)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BubbleChart;
