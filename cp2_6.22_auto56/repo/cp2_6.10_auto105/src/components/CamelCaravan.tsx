import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit, Check, X, Package } from 'lucide-react';
import { useStore } from '@/store';
import type { Caravan, Camel, CargoType, CamelType } from '@/types';
import {
  CARGO_COLORS,
  CARGO_NAMES,
  CAMEL_COLORS,
  CAMEL_NAMES,
} from '@/types';

const CamelIcon: React.FC<{ type: CamelType; isOverloaded: boolean }> = ({
  type,
  isOverloaded,
}) => {
  const color = CAMEL_COLORS[type];
  const isBactrian = type === 'bactrian';

  return (
    <svg width="60" height="50" viewBox="0 0 60 50" fill="none">
      <ellipse cx="30" cy="35" rx="20" ry="8" fill={color} />
      <g className={isOverloaded ? 'hump-shake' : ''}>
        {isBactrian ? (
          <>
            <ellipse cx="22" cy="28" rx="7" ry="8" fill={color} />
            <ellipse cx="38" cy="28" rx="7" ry="8" fill={color} />
          </>
        ) : (
          <ellipse cx="30" cy="26" rx="9" ry="10" fill={color} />
        )}
      </g>
      <circle cx="48" cy="28" r="5" fill={color} />
      <circle cx="50" cy="27" r="1.5" fill="#333" />
      <path d="M52 30 L55 28" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="15" y="42" width="3" height="6" fill={color} />
      <rect x="25" y="42" width="3" height="6" fill={color} />
      <rect x="35" y="42" width="3" height="6" fill={color} />
      <rect x="43" y="42" width="3" height="6" fill={color} />
    </svg>
  );
};

const CargoTag: React.FC<{ type: CargoType; weight: number; maxLoad: number }> = ({
  type,
  weight,
  maxLoad,
}) => {
  const percentage = (weight / maxLoad) * 100;
  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: CARGO_COLORS[type] }}
    >
      {CARGO_NAMES[type]}: {percentage.toFixed(0)}%
    </div>
  );
};

const CamelCard: React.FC<{
  camel: Camel;
  onDelete: () => void;
  onUpdateType: (type: CamelType) => void;
  onUpdateCargo: (cargoType: CargoType, weight: number) => void;
}> = ({ camel, onDelete, onUpdateType, onUpdateCargo }) => {
  const [isEditing, setIsEditing] = useState(false);
  const totalWeight = camel.cargo.reduce((sum, c) => sum + c.weight, 0);
  const loadPercentage = (totalWeight / camel.maxLoad) * 100;
  const isOverloaded = loadPercentage > 90;

  const cargoTypes: CargoType[] = ['silk', 'tea', 'porcelain', 'spice', 'gem'];

  return (
    <motion.div
      className="relative p-4 rounded-xl"
      style={{
        backdropFilter: 'blur(8px)',
        background: 'rgba(255,255,245,0.85)',
        border: '1px solid rgba(182, 138, 92, 0.3)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <CamelIcon type={camel.type} isOverloaded={isOverloaded} />
          <div>
            <div className="font-semibold" style={{ color: '#8b4513' }}>
              {CAMEL_NAMES[camel.type]}
            </div>
            <div className="text-sm" style={{ color: '#a0522d' }}>
              载重: {totalWeight.toFixed(1)}/{camel.maxLoad}kg
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1.5 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(182, 138, 92, 0.2)' }}
          >
            {isEditing ? <X size={16} style={{ color: '#8b4513' }} /> : <Edit size={16} style={{ color: '#8b4513' }} />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-95"
            style={{ backgroundColor: 'rgba(255, 107, 107, 0.2)' }}
          >
            <Trash2 size={16} color="#ff6b6b" />
          </button>
        </div>
      </div>

      <div className="w-full h-2 rounded-full mb-3" style={{ backgroundColor: 'rgba(182, 138, 92, 0.2)' }}>
        <motion.div
          className="h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(loadPercentage, 100)}%` }}
          transition={{ duration: 0.5 }}
          style={{
            backgroundColor: isOverloaded ? '#ff6b6b' : '#2ecc71',
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2">
        {camel.cargo.map(
          (c) =>
            c.weight > 0 && (
              <CargoTag key={c.type} type={c.type} weight={c.weight} maxLoad={camel.maxLoad} />
            )
        )}
      </div>

      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 pt-2 border-t"
            style={{ borderColor: 'rgba(182, 138, 92, 0.3)' }}
          >
            <div className="flex gap-2">
              <label className="text-sm font-medium" style={{ color: '#8b4513' }}>
                类型:
              </label>
              <select
                value={camel.type}
                onChange={(e) => onUpdateType(e.target.value as CamelType)}
                className="flex-1 px-2 py-1 rounded text-sm border"
                style={{
                  borderColor: 'rgba(182, 138, 92, 0.5)',
                  backgroundColor: 'rgba(255,255,245,0.9)',
                  color: '#8b4513',
                }}
              >
                <option value="bactrian">双峰驼</option>
                <option value="dromedary">单峰驼</option>
              </select>
            </div>
            {cargoTypes.map((type) => {
              const currentWeight = camel.cargo.find((c) => c.type === type)?.weight || 0;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-16 text-xs font-medium"
                    style={{ color: CARGO_COLORS[type] }}
                  >
                    {CARGO_NAMES[type]}:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={camel.maxLoad}
                    step="0.5"
                    value={currentWeight}
                    onChange={(e) => onUpdateCargo(type, parseFloat(e.target.value))}
                    className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                    style={{ accentColor: CARGO_COLORS[type] }}
                  />
                  <span className="w-12 text-xs text-right" style={{ color: '#8b4513' }}>
                    {currentWeight.toFixed(1)}kg
                  </span>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CaravanForm: React.FC<{
  onSubmit: (caravan: Omit<Caravan, 'id'>) => void;
  onCancel: () => void;
  initialData?: Caravan;
}> = ({ onSubmit, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [origin, setOrigin] = useState(initialData?.origin || '');
  const [currentStation, setCurrentStation] = useState(initialData?.currentStation || '');
  const [camelCount, setCamelCount] = useState(initialData?.camels.length || 1);
  const [camelTypes, setCamelTypes] = useState<CamelType[]>(
    initialData?.camels.map((c) => c.type) || Array(1).fill('bactrian' as CamelType)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const camels: Camel[] = [];
    for (let i = 0; i < camelCount; i++) {
      camels.push({
        id: '',
        type: camelTypes[i] || 'bactrian',
        cargo: [],
        maxLoad: 200,
      });
    }
    onSubmit({
      name,
      origin,
      currentStation,
      camels,
    });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      onSubmit={handleSubmit}
      className="p-6 rounded-2xl mb-6"
      style={{
        backdropFilter: 'blur(8px)',
        background: 'rgba(255,255,245,0.85)',
        border: '2px solid rgba(182, 138, 92, 0.4)',
      }}
    >
      <h3 className="text-xl font-bold mb-4" style={{ color: '#8b4513' }}>
        {initialData ? '编辑驼队' : '创建新驼队'}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#8b4513' }}>
            驼队名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'rgba(182, 138, 92, 0.5)',
              backgroundColor: 'rgba(255,255,245,0.9)',
              color: '#8b4513',
            }}
            placeholder="如：西域商队"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#8b4513' }}>
            出发地
          </label>
          <input
            type="text"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'rgba(182, 138, 92, 0.5)',
              backgroundColor: 'rgba(255,255,245,0.9)',
              color: '#8b4513',
            }}
            placeholder="如：长安"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#8b4513' }}>
            当前驿站
          </label>
          <input
            type="text"
            value={currentStation}
            onChange={(e) => setCurrentStation(e.target.value)}
            required
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'rgba(182, 138, 92, 0.5)',
              backgroundColor: 'rgba(255,255,245,0.9)',
              color: '#8b4513',
            }}
            placeholder="如：敦煌"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#8b4513' }}>
            骆驼数量 (最多10峰)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={camelCount}
            onChange={(e) => {
              const count = Math.min(10, Math.max(1, parseInt(e.target.value) || 1));
              setCamelCount(count);
              const newTypes = [...camelTypes];
              while (newTypes.length < count) {
                newTypes.push('bactrian');
              }
              setCamelTypes(newTypes.slice(0, count));
            }}
            className="w-full px-4 py-2 rounded-lg border"
            style={{
              borderColor: 'rgba(182, 138, 92, 0.5)',
              backgroundColor: 'rgba(255,255,245,0.9)',
              color: '#8b4513',
            }}
          />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2" style={{ color: '#8b4513' }}>
          各峰骆驼类型
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {Array.from({ length: camelCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-sm" style={{ color: '#8b4513' }}>
                #{i + 1}
              </span>
              <select
                value={camelTypes[i] || 'bactrian'}
                onChange={(e) => {
                  const newTypes = [...camelTypes];
                  newTypes[i] = e.target.value as CamelType;
                  setCamelTypes(newTypes);
                }}
                className="flex-1 px-2 py-1 rounded text-sm border"
                style={{
                  borderColor: 'rgba(182, 138, 92, 0.5)',
                  backgroundColor: 'rgba(255,255,245,0.9)',
                  color: '#8b4513',
                }}
              >
                <option value="bactrian">双峰驼</option>
                <option value="dromedary">单峰驼</option>
              </select>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-medium transition-all duration-300 ease-out hover:scale-105 active:scale-96"
          style={{
            backgroundColor: 'rgba(182, 138, 92, 0.2)',
            color: '#8b4513',
          }}
        >
          取消
        </button>
        <button
          type="submit"
          className="px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg active:scale-96 flex items-center gap-2"
          style={{ backgroundColor: '#b68a5c' }}
        >
          <Check size={18} />
          {initialData ? '保存修改' : '创建驼队'}
        </button>
      </div>
    </motion.form>
  );
};

const CaravanCard: React.FC<{
  caravan: Caravan;
  onEdit: () => void;
  onDelete: () => void;
  onAddCamel: () => void;
}> = ({ caravan, onEdit, onDelete, onAddCamel }) => {
  const { updateCamel, deleteCamel, updateCargo } = useStore();
  const [expanded, setExpanded] = useState(true);

  const totalCamels = caravan.camels.length;
  const totalWeight = caravan.camels.reduce(
    (sum, c) => sum + c.cargo.reduce((s, cg) => s + cg.weight, 0),
    0
  );

  return (
    <motion.div
      className="mb-6 rounded-2xl overflow-hidden"
      style={{
        backdropFilter: 'blur(8px)',
        background: 'rgba(255,255,245,0.85)',
        border: '2px solid rgba(182, 138, 92, 0.4)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'linear-gradient(135deg, rgba(182,138,92,0.2) 0%, rgba(210,180,140,0.2) 100%)',
        }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold" style={{ color: '#8b4513' }}>
              {caravan.name}
            </h3>
            <p className="text-sm" style={{ color: '#a0522d' }}>
              {caravan.origin} → {caravan.currentStation} · {totalCamels}峰骆驼 · 总载重{' '}
              {totalWeight.toFixed(1)}kg
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddCamel();
              }}
              className="p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-96"
              style={{ backgroundColor: 'rgba(46, 204, 113, 0.2)' }}
              title="添加骆驼"
            >
              <Plus size={18} color="#2ecc71" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-96"
              style={{ backgroundColor: 'rgba(182, 138, 92, 0.2)' }}
              title="编辑驼队"
            >
              <Edit size={18} style={{ color: '#8b4513' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg transition-all duration-300 ease-out hover:scale-105 active:scale-96"
              style={{ backgroundColor: 'rgba(255, 107, 107, 0.2)' }}
              title="删除驼队"
            >
              <Trash2 size={18} color="#ff6b6b" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {caravan.camels.map((camel) => (
                <CamelCard
                  key={camel.id}
                  camel={camel}
                  onDelete={() => deleteCamel(caravan.id, camel.id)}
                  onUpdateType={(type) => updateCamel(caravan.id, camel.id, { type })}
                  onUpdateCargo={(cargoType, weight) =>
                    updateCargo(caravan.id, camel.id, cargoType, weight)
                  }
                />
              ))}
            </div>
            {caravan.camels.length === 0 && (
              <div className="text-center py-8" style={{ color: '#a0522d' }}>
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p>暂无骆驼，点击上方按钮添加</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const CamelCaravan: React.FC = () => {
  const { caravans, addCaravan, updateCaravan, deleteCaravan, addCamel } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [editingCaravan, setEditingCaravan] = useState<Caravan | null>(null);

  const handleSubmit = (caravanData: Omit<Caravan, 'id'>) => {
    if (editingCaravan) {
      updateCaravan(editingCaravan.id, caravanData);
    } else {
      addCaravan(caravanData);
    }
    setShowForm(false);
    setEditingCaravan(null);
  };

  const handleEdit = (caravan: Caravan) => {
    setEditingCaravan(caravan);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCaravan(null);
  };

  const handleAddCamel = (caravanId: string) => {
    addCamel(caravanId, {
      type: 'bactrian',
      cargo: [],
      maxLoad: 200,
    });
  };

  return (
    <div
      className="min-h-screen p-4 md:p-8"
      style={{
        background: 'linear-gradient(180deg, #f5e6d3 0%, #e8d4b8 50%, #d4b896 100%)',
      }}
    >
      <style>{`
        @keyframes humpShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-8deg); }
          75% { transform: rotate(8deg); }
        }
        .hump-shake {
          animation: humpShake 0.8s ease-in-out infinite;
          transform-origin: center bottom;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: '#8b4513' }}>
              🏜️ 驼队管理
            </h1>
            <p className="text-lg" style={{ color: '#a0522d' }}>
              丝绸之路上的商队守护者
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ease-out hover:scale-105 hover:shadow-xl active:scale-96 flex items-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #b68a5c 0%, #d2b48c 100%)',
              boxShadow: '0 4px 15px rgba(182, 138, 92, 0.4)',
            }}
          >
            <Plus size={20} />
            创建驼队
          </button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <AnimatePresence>
            {showForm && (
              <CaravanForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                initialData={editingCaravan || undefined}
              />
            )}
          </AnimatePresence>

          {caravans.length === 0 && !showForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 rounded-2xl"
              style={{
                backdropFilter: 'blur(8px)',
                background: 'rgba(255,255,245,0.85)',
                border: '2px dashed rgba(182, 138, 92, 0.4)',
              }}
            >
              <Package size={64} className="mx-auto mb-4 opacity-50" style={{ color: '#b68a5c' }} />
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#8b4513' }}>
                暂无驼队
              </h3>
              <p className="mb-6" style={{ color: '#a0522d' }}>
                点击右上角按钮创建你的第一支商队
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 ease-out hover:scale-105 active:scale-96"
                style={{ backgroundColor: '#b68a5c' }}
              >
                创建驼队
              </button>
            </motion.div>
          )}

          <div className="space-y-6">
            {caravans.map((caravan) => (
              <CaravanCard
                key={caravan.id}
                caravan={caravan}
                onEdit={() => handleEdit(caravan)}
                onDelete={() => deleteCaravan(caravan.id)}
                onAddCamel={() => handleAddCamel(caravan.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CamelCaravan;
