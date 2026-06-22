import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inventory,
  Player,
  OreType,
  IngotType,
  ORE_COLORS,
  INGOT_COLORS,
  ORE_TO_INGOT,
  getUpgradeCost,
  canAfford,
} from '../utils/gameLogic';

interface UIPanelProps {
  inventory: Inventory;
  player: Player;
  depth: number;
  isSmelting: boolean;
  smeltProgress: number;
  currentSmeltOre: OreType | null;
  onStartSmelt: (oreType: OreType) => void;
  onUpgradePickaxe: () => void;
  onUpgradeLamp: () => void;
  onUpgradeBackpack: () => void;
  onChangeDepth: (delta: number) => void;
}

interface DragState {
  ore: OreType;
  x: number;
  y: number;
}

const OreIcon: React.FC<{ type: OreType; size?: number }> = ({ type, size = 16 }) => {
  const color = ORE_COLORS[type];
  const gradients: Record<OreType, [string, string]> = {
    coal: ['#424242', '#616161'],
    iron: ['#A1887F', '#BCAAA4'],
    gold: ['#FFD700', '#FFE082'],
    diamond: ['#00BCD4', '#4DD0E1'],
  };
  const [c1, c2] = gradients[type];

  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <defs>
        <linearGradient id={`grad-${type}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={c2} />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
      </defs>
      {type === 'coal' && (
        <rect x="2" y="2" width="12" height="12" rx="2" fill={`url(#grad-${type})`} />
      )}
      {type === 'iron' && (
        <polygon points="8,2 14,14 2,14" fill={`url(#grad-${type})`} />
      )}
      {type === 'gold' && (
        <circle cx="8" cy="8" r="6" fill={`url(#grad-${type})`} />
      )}
      {type === 'diamond' && (
        <polygon points="8,1 15,8 8,15 1,8" fill={`url(#grad-${type})`} />
      )}
    </svg>
  );
};

const IngotIcon: React.FC<{ type: IngotType; size?: number }> = ({ type, size = 16 }) => {
  const color = INGOT_COLORS[type];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16">
      <rect x="1" y="5" width="14" height="6" rx="2" fill={color} stroke="#37474F" strokeWidth="0.5" />
      <rect x="2" y="6" width="12" height="2" rx="1" fill="white" fillOpacity="0.3" />
    </svg>
  );
};

const UIPanel: React.FC<UIPanelProps> = ({
  inventory,
  player,
  depth,
  isSmelting,
  smeltProgress,
  currentSmeltOre,
  onStartSmelt,
  onUpgradePickaxe,
  onUpgradeLamp,
  onUpgradeBackpack,
  onChangeDepth,
}) => {
  const [smeltingOpen, setSmeltingOpen] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const furnaceRef = useRef<HTMLDivElement>(null);
  const [furnaceBright, setFurnaceBright] = useState(false);

  const ores: OreType[] = ['coal', 'iron', 'gold', 'diamond'];
  const ingots: IngotType[] = ['steel', 'ironIngot', 'goldIngot', 'diamondRaw'];
  const oreNames: Record<OreType, string> = {
    coal: '煤矿',
    iron: '铁矿',
    gold: '金矿',
    diamond: '钻石',
  };
  const ingotNames: Record<IngotType, string> = {
    steel: '钢锭',
    ironIngot: '铁锭',
    goldIngot: '金锭',
    diamondRaw: '钻石原石',
  };

  const handleDragStart = (e: React.MouseEvent, ore: OreType) => {
    if (inventory[ore] <= 0 || isSmelting) return;
    setDrag({ ore, x: e.clientX, y: e.clientY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!drag) return;
    setDrag({ ...drag, x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    if (!drag || !furnaceRef.current) {
      setDrag(null);
      return;
    }
    const rect = furnaceRef.current.getBoundingClientRect();
    if (
      drag.x >= rect.left &&
      drag.x <= rect.right &&
      drag.y >= rect.top &&
      drag.y <= rect.bottom
    ) {
      setFurnaceBright(true);
      setTimeout(() => setFurnaceBright(false), 500);
      onStartSmelt(drag.ore);
    }
    setDrag(null);
  };

  const handleUpgradeClick = (fn: () => void) => {
    fn();
  };

  const pickaxeCost = getUpgradeCost(player.pickaxeLevel);
  const lampCost = getUpgradeCost(player.lampLevel);
  const backpackCost = getUpgradeCost(player.backpackLevel);

  return (
    <div
      ref={containerRef}
      style={{
        width: 800,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        userSelect: 'none',
      }}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
      <div
        style={{
          padding: 12,
          background: '#263238',
          borderRadius: 8,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {ores.map((ore) => (
            <motion.div
              key={ore}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#1E2930',
                padding: '6px 12px',
                borderRadius: 6,
                cursor: inventory[ore] > 0 && !isSmelting ? 'grab' : 'default',
                opacity: inventory[ore] > 0 && !isSmelting ? 1 : 0.5,
              }}
              whileHover={{ scale: inventory[ore] > 0 && !isSmelting ? 1.05 : 1 }}
              whileTap={{ scale: inventory[ore] > 0 && !isSmelting ? 0.95 : 1 }}
              onMouseDown={(e) => handleDragStart(e, ore)}
              title={`${oreNames[ore]}: 拖拽到熔炉熔炼`}
            >
              <OreIcon type={ore} />
              <span style={{ color: '#ECEFF1', fontSize: 14, fontWeight: 600 }}>
                {inventory[ore]}
              </span>
            </motion.div>
          ))}
          <div style={{ width: 1, height: 28, background: '#455A64' }} />
          {ingots.map((ingot) => (
            <div
              key={ingot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#1E2930',
                padding: '6px 12px',
                borderRadius: 6,
              }}
              title={ingotNames[ingot]}
            >
              <IngotIcon type={ingot} />
              <span style={{ color: '#ECEFF1', fontSize: 14, fontWeight: 600 }}>
                {inventory[ingot]}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#90A4AE', fontSize: 13 }}>深度: {depth}</span>
          <motion.button
            style={buttonStyle}
            whileHover={{ scale: depth > 1 ? 1.05 : 1 }}
            whileTap={{ scale: depth > 1 ? 0.95 : 1 }}
            onClick={() => onChangeDepth(-1)}
            disabled={depth <= 1}
          >
            ↑ 上一层
          </motion.button>
          <motion.button
            style={buttonStyle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChangeDepth(1)}
          >
            ↓ 下一层
          </motion.button>
        </div>
      </div>

      <motion.div
        style={{
          background: '#263238',
          borderRadius: 8,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        <motion.button
          style={{
            width: '100%',
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            color: '#ECEFF1',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setSmeltingOpen(!smeltingOpen)}
        >
          <span>熔炼 &amp; 升级</span>
          <span style={{ transform: smeltingOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease-out' }}>
            ▼
          </span>
        </motion.button>

        <AnimatePresence>
          {smeltingOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div
                style={{
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr',
                  gap: 20,
                  borderTop: '1px solid #37474F',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ color: '#B0BEC5', fontSize: 13, fontWeight: 600 }}>
                    熔炉
                  </div>
                  <div
                    ref={furnaceRef}
                    style={{
                      position: 'relative',
                      width: 140,
                      height: 140,
                      background: '#1A1A1A',
                      borderRadius: 12,
                      border: '3px solid #424242',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: furnaceBright
                        ? '0 0 40px #FF6F00, inset 0 0 30px #FFAB00'
                        : 'inset 0 0 20px rgba(0,0,0,0.5)',
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                    <motion.div
                      animate={{
                        opacity: [0.6, 1, 0.6],
                        scale: [0.9, 1.1, 0.9],
                      }}
                      transition={{ duration: 0.4, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${furnaceBright ? '#FFD54F' : '#FFAB00'} 0%, #FF6F00 60%, #BF360C 100%)`,
                        filter: 'blur(4px)',
                      }}
                    />
                    {currentSmeltOre && (
                      <motion.div
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 0.8, opacity: 0.6 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                        style={{ position: 'relative', zIndex: 1 }}
                      >
                        <OreIcon type={currentSmeltOre} size={32} />
                      </motion.div>
                    )}
                  </div>

                  {isSmelting && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div
                        style={{
                          height: 10,
                          background: '#1E2930',
                          borderRadius: 5,
                          overflow: 'hidden',
                        }}
                      >
                        <motion.div
                          animate={{ width: `${smeltProgress * 100}%` }}
                          transition={{ duration: 0.1, ease: 'linear' }}
                          style={{
                            height: '100%',
                            background: 'linear-gradient(90deg, #FF6F00, #FFCC80)',
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <span style={{ color: '#90A4AE', fontSize: 11 }}>
                        熔炼中... {Math.floor(smeltProgress * 100)}%
                      </span>
                    </div>
                  )}

                  {!isSmelting && (
                    <span style={{ color: '#78909C', fontSize: 11, textAlign: 'center' }}>
                      将矿石从顶部拖入熔炉
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ color: '#B0BEC5', fontSize: 13, fontWeight: 600 }}>
                    工具升级
                  </div>
                  <UpgradeButton
                    label={`⛏️ 镐头 Lv.${player.pickaxeLevel}`}
                    subLabel="挖掘更快"
                    cost={pickaxeCost}
                    inventory={inventory}
                    onClick={() => handleUpgradeClick(onUpgradePickaxe)}
                  />
                  <UpgradeButton
                    label={`💡 矿灯 Lv.${player.lampLevel}`}
                    subLabel="视野更广"
                    cost={lampCost}
                    inventory={inventory}
                    onClick={() => handleUpgradeClick(onUpgradeLamp)}
                  />
                  <UpgradeButton
                    label={`🎒 背包 Lv.${player.backpackLevel}`}
                    subLabel="容量更大"
                    cost={backpackCost}
                    inventory={inventory}
                    onClick={() => handleUpgradeClick(onUpgradeBackpack)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {drag && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.7, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              left: drag.x - 16,
              top: drag.y - 16,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <OreIcon type={drag.ore} size={32} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: '#37474F',
  color: '#ECEFF1',
  border: 'none',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};

interface UpgradeButtonProps {
  label: string;
  subLabel: string;
  cost: { steel: number; ironIngot: number; goldIngot: number; diamondRaw: number };
  inventory: Inventory;
  onClick: () => void;
}

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ label, subLabel, cost, inventory, onClick }) => {
  const affordable = canAfford(inventory, cost);
  const costItems: { type: IngotType; amount: number }[] = [];
  if (cost.steel > 0) costItems.push({ type: 'steel', amount: cost.steel });
  if (cost.ironIngot > 0) costItems.push({ type: 'ironIngot', amount: cost.ironIngot });
  if (cost.goldIngot > 0) costItems.push({ type: 'goldIngot', amount: cost.goldIngot });
  if (cost.diamondRaw > 0) costItems.push({ type: 'diamondRaw', amount: cost.diamondRaw });

  return (
    <motion.button
      style={{
        padding: 12,
        background: affordable ? '#1E2930' : '#2A2A2A',
        border: 'none',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: affordable ? 'pointer' : 'not-allowed',
        opacity: affordable ? 1 : 0.5,
      }}
      whileHover={{ scale: affordable ? 1.02 : 1 }}
      whileTap={{ scale: affordable ? 0.97 : 1 }}
      onClick={onClick}
      disabled={!affordable}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ color: '#ECEFF1', fontSize: 14, fontWeight: 600 }}>{label}</span>
        <span style={{ color: '#78909C', fontSize: 11 }}>{subLabel}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {costItems.map((item) => (
          <div
            key={item.type}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              opacity: inventory[item.type] >= item.amount ? 1 : 0.4,
            }}
          >
            <IngotIcon type={item.type} size={14} />
            <span style={{ color: '#B0BEC5', fontSize: 12 }}>{item.amount}</span>
          </div>
        ))}
      </div>
    </motion.button>
  );
};

export default UIPanel;
