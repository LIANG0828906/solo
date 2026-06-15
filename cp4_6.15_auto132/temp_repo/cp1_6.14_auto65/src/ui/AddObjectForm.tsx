import { useState } from 'react';
import { Box, Circle, Cylinder } from 'lucide-react';
import type { BodyType, HSLColor } from '@/types';
import { HSLPicker } from './HSLPicker';
import { generateRandomColor } from '@/utils/hsl';
import { usePhysicsStore } from '@/store/usePhysicsStore';

interface AddObjectFormProps {
  onClose: () => void;
}

const bodyTypes: { type: BodyType; label: string; icon: React.ReactNode }[] = [
  { type: 'box', label: '立方体', icon: <Box size={20} /> },
  { type: 'sphere', label: '球体', icon: <Circle size={20} /> },
  { type: 'cylinder', label: '圆柱体', icon: <Cylinder size={20} /> },
];

export function AddObjectForm({ onClose }: AddObjectFormProps) {
  const [selectedType, setSelectedType] = useState<BodyType>('box');
  const [mass, setMass] = useState(1);
  const [restitution, setRestitution] = useState(0.6);
  const [positionX, setPositionX] = useState(0);
  const [positionZ, setPositionZ] = useState(0);
  const [color, setColor] = useState<HSLColor>(generateRandomColor());
  const addBody = usePhysicsStore((s) => s.addBody);

  const handleRandomize = () => {
    setPositionX((Math.random() - 0.5) * 6);
    setPositionZ((Math.random() - 0.5) * 6);
    setMass(0.5 + Math.random() * 4.5);
    setRestitution(0.2 + Math.random() * 0.7);
    setColor(generateRandomColor());
  };

  const handleAdd = () => {
    const spawnHeight = 4 + Math.random() * 3;
    addBody(
      selectedType,
      [positionX, spawnHeight, positionZ],
      mass,
      restitution,
      color
    );
    onClose();
  };

  return (
    <div className="p-5 space-y-5 animate-[float-in_0.2s_ease-out]">
      <h3 className="text-white font-semibold text-sm flex items-center gap-2">
        <Box size={16} className="text-cyan-400" />
        添加物理体
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {bodyTypes.map(({ type, label, icon }) => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`glass-button rounded-xl p-3 flex flex-col items-center gap-1.5 transition-all ${
              selectedType === type ? 'active' : ''
            }`}
          >
            <span className={selectedType === type ? 'text-purple-400' : 'text-gray-400'}>
              {icon}
            </span>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-cyan-300/70 block mb-1.5">质量 (kg)</label>
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={mass.toFixed(1)}
              onChange={(e) => setMass(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-cyan-300/70 block mb-1.5">弹性系数</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={restitution.toFixed(2)}
              onChange={(e) => setRestitution(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-cyan-300/70 block mb-1.5">初始位置 X</label>
            <input
              type="number"
              min="-8"
              max="8"
              step="0.5"
              value={positionX.toFixed(1)}
              onChange={(e) => setPositionX(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-cyan-300/70 block mb-1.5">初始位置 Z</label>
            <input
              type="number"
              min="-8"
              max="8"
              step="0.5"
              value={positionZ.toFixed(1)}
              onChange={(e) => setPositionZ(Number(e.target.value))}
              className="glass-input w-full px-3 py-2 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs text-cyan-300/70 block mb-2">物体颜色</label>
        <HSLPicker value={color} onChange={setColor} compact />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleRandomize}
          className="glass-button flex-1 py-2.5 rounded-xl text-xs text-gray-300"
        >
          随机参数
        </button>
        <button
          onClick={handleAdd}
          className="glass-button active flex-[2] py-2.5 rounded-xl text-xs font-medium text-white"
        >
          添加物体
        </button>
      </div>
    </div>
  );
}
