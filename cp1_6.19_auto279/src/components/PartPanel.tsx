import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { Part, PartCategory } from '../types';

const CATEGORY_CONFIG: Record<PartCategory, { gradient: [string, string]; label: string }> = {
  weapon: {
    gradient: ['#4A3B4E', '#3A2B3E'],
    label: '武器',
  },
  shield: {
    gradient: ['#2E4A4E', '#1E3A3E'],
    label: '护盾',
  },
  engine: {
    gradient: ['#3E402E', '#2E301E'],
    label: '引擎',
  },
};

interface PartCardProps {
  part: Part;
  isUsed: boolean;
}

function PartCard({ part, isUsed }: PartCardProps) {
  const { setDraggedPart } = useGameStore();
  const config = CATEGORY_CONFIG[part.category];

  const handleDragStart = (e: React.DragEvent) => {
    if (isUsed) {
      e.preventDefault();
      return;
    }
    setDraggedPart(part);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', part.id);
  };

  const handleDragEnd = () => {
    setDraggedPart(null);
  };

  return (
    <motion.div
      draggable={!isUsed}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      whileHover={!isUsed ? { scale: 1.05, boxShadow: '0 0 0 2px #C9A96E' } : {}}
      whileTap={!isUsed ? { scale: 0.97 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      style={{
        width: '80px',
        height: '100px',
        borderRadius: '8px',
        background: `linear-gradient(180deg, ${config.gradient[0]} 0%, ${config.gradient[1]} 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: isUsed ? 'not-allowed' : 'grab',
        opacity: isUsed ? 0.4 : 1,
        userSelect: 'none',
        position: 'relative',
        willChange: 'transform',
      }}
    >
      <div style={{ fontSize: '24px' }}>{part.icon}</div>
      <div
        style={{
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {part.name}
      </div>
      <div
        style={{
          color: '#A0B0C0',
          fontSize: '12px',
        }}
      >
        +{part.value}
      </div>
      {isUsed && (
        <div
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: '#E74C3C',
          }}
        >
          ✕
        </div>
      )}
    </motion.div>
  );
}

function PartPanel() {
  const { availableParts, currentShip } = useGameStore();

  const usedPartIds = new Set(currentShip.slots.filter((s) => s.part).map((s) => s.part!.id));

  const weapons = availableParts.filter((p) => p.category === 'weapon');
  const shields = availableParts.filter((p) => p.category === 'shield');
  const engines = availableParts.filter((p) => p.category === 'engine');

  const renderCategory = (parts: Part[], category: PartCategory) => {
    const config = CATEGORY_CONFIG[category];
    return (
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '13px',
            color: '#A0B0C0',
            marginBottom: '8px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}
        >
          {config.label}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 80px)',
            gap: '8px',
            justifyContent: 'center',
          }}
        >
          {parts.map((part) => (
            <PartCard key={part.id} part={part} isUsed={usedPartIds.has(part.id)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#2A2E35',
        padding: '16px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#E6EDF3',
          marginBottom: '16px',
          textAlign: 'center',
          paddingBottom: '10px',
          borderBottom: '1px solid #3A3E45',
        }}
      >
        零件库
      </div>

      <div style={{ flex: 1, willChange: 'transform' }}>
        {renderCategory(weapons, 'weapon')}
        {renderCategory(shields, 'shield')}
        {renderCategory(engines, 'engine')}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: '#6B7B8D',
          textAlign: 'center',
          marginTop: '8px',
          paddingTop: '8px',
          borderTop: '1px solid #3A3E45',
        }}
      >
        拖拽零件到战舰槽位
      </div>
    </div>
  );
}

export default PartPanel;
