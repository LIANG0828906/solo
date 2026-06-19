import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Building, MaterialType } from '../utils/buildingData';
import { MATERIAL_COLORS, MATERIAL_NAMES } from '../utils/buildingData';
import { formatTime } from '../utils/shadowCalculator';

interface ControlPanelProps {
  buildings: Building[];
  timeMinutes: number;
  isPlaying: boolean;
  selectedBuildingId: string | null;
  onTimeChange: (minutes: number) => void;
  onTogglePlay: () => void;
  onDeleteBuilding: (id: string) => void;
  onUpdateBuilding: (id: string, height?: number, material?: MaterialType) => void;
  onSelectBuilding: (id: string | null) => void;
}

const materials: MaterialType[] = ['glass', 'metal', 'stone'];

const ControlPanel: React.FC<ControlPanelProps> = ({
  buildings,
  timeMinutes,
  isPlaying,
  selectedBuildingId,
  onTimeChange,
  onTogglePlay,
  onDeleteBuilding,
  onUpdateBuilding,
  onSelectBuilding,
}) => {
  const timeProgress = ((timeMinutes - 480) / 600) * 100;

  return (
    <div
      style={{
        backgroundColor: '#2A2A3E',
        borderRadius: '8px',
        padding: '16px',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        width: '280px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2
          style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: '#FFFFFF',
            letterSpacing: '0.5px',
          }}
        >
          控制面板
        </h2>
        <motion.button
          onClick={onTogglePlay}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          animate={{ rotate: isPlaying ? 0 : 180 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#00BFFF',
            color: '#1E1E2E',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 'bold',
            padding: 0,
            boxShadow: '0 0 12px rgba(0, 191, 255, 0.4)',
          }}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </motion.button>
      </div>

      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#AAAAAA' }}>模拟时间</span>
          <span
            style={{
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Consolas, monospace',
              color: '#00BFFF',
            }}
          >
            {formatTime(timeMinutes)}
          </span>
        </div>
        <div style={{ position: 'relative', height: '24px', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '4px',
              backgroundColor: '#444',
              borderRadius: '2px',
            }}
          />
          <motion.div
            style={{
              position: 'absolute',
              left: 0,
              width: `${timeProgress}%`,
              height: '4px',
              backgroundColor: '#00BFFF',
              borderRadius: '2px',
            }}
          />
          <input
            type="range"
            min={480}
            max={1080}
            step={1}
            value={timeMinutes}
            onChange={(e) => onTimeChange(Number(e.target.value))}
            style={{
              position: 'absolute',
              width: '100%',
              height: '24px',
              margin: 0,
              padding: 0,
              background: 'transparent',
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
              outline: 'none',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '4px',
            fontSize: '11px',
            color: '#666',
            fontFamily: 'Consolas, monospace',
          }}
        >
          <span>08:00</span>
          <span>12:00</span>
          <span>18:00</span>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid #3A3A50',
          paddingTop: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '13px', color: '#AAAAAA' }}>
            建筑列表 ({buildings.length})
          </span>
        </div>

        {buildings.length === 0 ? (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              color: '#666',
              fontSize: '12px',
              border: '1px dashed #3A3A50',
              borderRadius: '6px',
            }}
          >
            点击画布网格放置建筑
          </div>
        ) : (
          buildings.map((b) => {
            const isSelected = b.id === selectedBuildingId;
            return (
              <BuildingCard
                key={b.id}
                building={b}
                isSelected={isSelected}
                onSelect={() => onSelectBuilding(b.id)}
                onDelete={() => onDeleteBuilding(b.id)}
                onUpdate={(h, m) => onUpdateBuilding(b.id, h, m)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

interface BuildingCardProps {
  building: Building;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (height?: number, material?: MaterialType) => void;
}

const BuildingCard: React.FC<BuildingCardProps> = ({
  building,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(isSelected);

  React.useEffect(() => {
    setIsExpanded(isSelected);
  }, [isSelected]);

  const handleClick = () => {
    onSelect();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      layout
      initial={false}
      style={{
        backgroundColor: isSelected ? '#353550' : '#222236',
        borderRadius: '6px',
        border: `1px solid ${isSelected ? '#00BFFF' : '#3A3A50'}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      <div
        onClick={handleClick}
        style={{
          padding: '10px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          height: '50px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            backgroundColor: MATERIAL_COLORS[building.material],
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {MATERIAL_NAMES[building.material]}建筑
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            高度: {building.height.toFixed(1)}u · ({building.x.toFixed(1)}, {building.z.toFixed(1)})
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          style={{ color: '#888', fontSize: '14px' }}
        >
          ▾
        </motion.span>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '8px 12px 12px',
                borderTop: '1px solid #3A3A50',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#888',
                    marginBottom: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>高度</span>
                  <span style={{ color: '#00BFFF', fontFamily: 'Consolas, monospace' }}>
                    {building.height.toFixed(1)}u
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={5.0}
                  step={0.1}
                  value={building.height}
                  onChange={(e) => onUpdate(Number(e.target.value))}
                  style={{
                    width: '100%',
                    height: '20px',
                    margin: 0,
                    padding: 0,
                    cursor: 'pointer',
                    accentColor: '#00BFFF',
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
                  材质
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {materials.map((m) => (
                    <button
                      key={m}
                      onClick={() => onUpdate(undefined, m)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: `1px solid ${building.material === m ? '#00BFFF' : '#3A3A50'}`,
                        backgroundColor: building.material === m ? '#00BFFF22' : 'transparent',
                        color: building.material === m ? '#00BFFF' : '#AAAAAA',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {MATERIAL_NAMES[m]}
                    </button>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: '#FF4444' }}
                whileTap={{ scale: 0.95 }}
                onClick={onDelete}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #FF444455',
                  backgroundColor: 'transparent',
                  color: '#FF6666',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  width: '100%',
                }}
              >
                删除建筑
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ControlPanel;
