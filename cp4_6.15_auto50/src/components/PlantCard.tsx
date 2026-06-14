import { Leaf, MapPin, Stethoscope, Clock, Camera } from 'lucide-react';
import type { Plant } from '@/utils/db';
import { theme } from '@/styles/theme';

interface PlantCardProps {
  plant: Plant;
  gradientIndex: number;
  onClick: () => void;
  onRecordSymptom: () => void;
  onViewHistory: () => void;
  onUpdatePhoto: () => void;
}

export default function PlantCard({
  plant,
  gradientIndex,
  onClick,
  onRecordSymptom,
  onViewHistory,
  onUpdatePhoto,
}: PlantCardProps) {
  const gradient = theme.cardGradients[gradientIndex % theme.cardGradients.length];

  return (
    <div
      className="group rounded-2xl shadow-lg overflow-hidden h-64 cursor-pointer relative flex flex-col justify-between p-5"
      style={{ background: gradient }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        {plant.lastDiagnosisDate && (
          <span className="bg-white/20 backdrop-blur text-white text-xs rounded-full px-2 py-0.5">
            {plant.lastDiagnosisDate}
          </span>
        )}
        {!plant.lastDiagnosisDate && <span />}
        {plant.photos[0] && (
          <img
            src={plant.photos[0]}
            alt={plant.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white/40"
          />
        )}
      </div>

      <div className="flex flex-col items-center gap-1 flex-1 justify-center">
        <Leaf size={48} className="text-white/80" />
        <span className="text-white font-display font-bold text-xl">{plant.name}</span>
        <span className="text-white/80 text-sm flex items-center gap-1">
          <MapPin size={14} />
          {plant.location}
        </span>
      </div>

      <div className="translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1 bg-white/15 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onRecordSymptom(); }}
        >
          <Stethoscope size={14} />
          记录新症状
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 bg-white/15 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onViewHistory(); }}
        >
          <Clock size={14} />
          查看历史诊断
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1 bg-white/15 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl"
          onClick={(e) => { e.stopPropagation(); onUpdatePhoto(); }}
        >
          <Camera size={14} />
          更新照片
        </button>
      </div>
    </div>
  );
}
