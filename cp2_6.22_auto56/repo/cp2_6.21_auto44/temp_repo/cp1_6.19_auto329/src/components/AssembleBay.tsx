import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package } from 'lucide-react';
import { useGameStore } from '../gameStore';
import { Slot } from './Slot';
import { ModuleCard } from './ModuleCard';
import { AttributeBar } from './AttributeBar';
import type { ShipModule, ModuleType } from '../types';

export const AssembleBay = () => {
  const {
    warehouse,
    playerShip,
    draggedModule,
    assembleModule,
    disassembleModule,
    setDraggedModule,
    getTotalThrust,
    getTotalShield,
    getTotalWeapon,
  } = useGameStore();

  const totalThrust = useMemo(() => getTotalThrust(), [getTotalThrust]);
  const totalShield = useMemo(() => getTotalShield(), [getTotalShield]);
  const totalWeapon = useMemo(() => getTotalWeapon(), [getTotalWeapon]);

  const groupedModules = useMemo(() => {
    const groups: Record<ModuleType, ShipModule[]> = {
      engine: [],
      shield: [],
      weapon: [],
    };
    warehouse.forEach(m => {
      groups[m.type].push(m);
    });
    return groups;
  }, [warehouse]);

  const handleDragStart = (module: ShipModule) => {
    setDraggedModule(module);
  };

  const handleDragEnd = () => {
    setDraggedModule(null);
  };

  const typeLabels: Record<ModuleType, string> = {
    engine: '🚀 引擎模块',
    shield: '🛡️ 护盾模块',
    weapon: '⚔️ 武器模块',
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      <div className="flex-1 flex flex-col gap-4">
        <div className="bg-[#2a2a3e] rounded-xl p-4 space-y-4">
          <h2 className="text-lg font-bold text-[#4FC3F7] flex items-center gap-2">
            <span>📊</span>
            <span>飞船属性</span>
          </h2>
          <AttributeBar
            label="总推力"
            value={totalThrust}
            maxValue={50}
            color="#FF5252"
            icon="thrust"
          />
          <AttributeBar
            label="总护盾"
            value={totalShield}
            maxValue={100}
            color="#448AFF"
            icon="shield"
          />
          <AttributeBar
            label="武器伤害"
            value={totalWeapon}
            maxValue={60}
            color="#69F0AE"
            icon="weapon"
          />
        </div>

        <div
          className="flex-1 relative rounded-xl overflow-hidden"
          style={{
            backgroundColor: '#2a2a3e',
            minHeight: '400px',
          }}
        >
          <div className="absolute top-4 left-4 z-10">
            <h2 className="text-lg font-bold text-[#4FC3F7] flex items-center gap-2">
              <span>🛸</span>
              <span>{playerShip.name}</span>
            </h2>
          </div>

          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 400 400"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4FC3F7" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#29B6F6" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            
            <motion.path
              d="M 200 50 
                 C 280 50, 340 120, 350 200 
                 C 350 280, 300 350, 200 360
                 C 100 350, 50 280, 50 200
                 C 60 120, 120 50, 200 50 Z"
              fill="url(#shipGradient)"
              stroke="#4FC3F7"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 2, ease: 'easeInOut' }}
            />
            
            <motion.path
              d="M 170 360 L 150 380 L 200 365 L 250 380 L 230 360"
              fill="none"
              stroke="#FF5252"
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.8 }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            
            <motion.path
              d="M 30 200 L 50 200 M 350 200 L 370 200"
              stroke="#448AFF"
              strokeWidth="2"
              strokeDasharray="5,5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1 }}
            />
            
            <circle cx="200" cy="180" r="30" fill="none" stroke="#4FC3F7" strokeWidth="1.5" opacity="0.5" />
            <circle cx="200" cy="180" r="15" fill="#4FC3F7" opacity="0.2" />
          </svg>

          {playerShip.slots.map(slot => (
            <Slot
              key={slot.id}
              slot={slot}
              onDrop={assembleModule}
              onRemove={disassembleModule}
              draggedModule={draggedModule}
            />
          ))}
        </div>
      </div>

      <div className="lg:w-80 bg-[#2a2a3e] rounded-xl p-4 flex flex-col">
        <h2 className="text-lg font-bold text-[#4FC3F7] flex items-center gap-2 mb-4">
          <Package size={20} />
          <span>模块仓库</span>
          <span className="text-sm opacity-60">({warehouse.length})</span>
        </h2>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {(Object.keys(groupedModules) as ModuleType[]).map(type => (
            <div key={type} className="space-y-2">
              <h3 className="text-sm font-semibold opacity-70">
                {typeLabels[type]}
              </h3>
              {groupedModules[type].length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {groupedModules[type].map(module => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      onDragStart={() => handleDragStart(module)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedModule?.id === module.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-sm opacity-40 text-center py-2">
                  暂无可用模块
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#4FC3F7]20 text-xs opacity-50">
          <p>💡 拖拽模块到对应插槽进行装配</p>
          <p className="mt-1">❌ 点击模块右上角X可卸下模块</p>
        </div>
      </div>
    </div>
  );
};

export default AssembleBay;
