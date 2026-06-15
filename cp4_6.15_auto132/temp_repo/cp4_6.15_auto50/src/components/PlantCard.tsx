import { Leaf, MapPin, Stethoscope, Clock, Camera, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
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
  const formattedLastDiagnosis = plant.lastDiagnosisDate
    ? format(parseISO(plant.lastDiagnosisDate), 'yyyy-MM-dd 诊断', { locale: zhCN })
    : null;

  return (
    <div
      className="group rounded-2xl shadow-lg overflow-hidden h-64 cursor-pointer relative flex flex-col justify-between p-5 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
      style={{ background: gradient }}
      onClick={onClick}
    >
      <div className="flex justify-between items-start z-10 relative mt-1">
        <div className="flex items-center gap-1.5 -ml-0.5">
          {formattedLastDiagnosis ? (
            <span className="inline-flex items-center gap-1 bg-white/25 backdrop-blur text-white text-[11px] font-body rounded-full px-2.5 py-1 shadow-sm border border-white/20">
              <Calendar size={11} />
              <span>{formattedLastDiagnosis}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur text-white/80 text-[11px] font-body rounded-full px-2.5 py-1 border border-white/15">
              <Calendar size={11} />
              <span>暂无诊断</span>
            </span>
          )}
        </div>

        {plant.photos[0] ? (
          <div className="relative">
            <img
              src={plant.photos[0]}
              alt={plant.name}
              loading="lazy"
              className="w-14 h-14 rounded-full object-cover border-2 border-white/50 shadow-md progressive-img"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/20">
            <Leaf size={20} className="text-white/70" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5 flex-1 justify-center z-10 relative">
        {!plant.photos[0] && (
          <Leaf size={52} className="text-white/80 mb-1" strokeWidth={1.5} />
        )}
        <span className="text-white font-display font-bold text-xl tracking-wide drop-shadow-sm">
          {plant.name}
        </span>
        <span className="text-white/85 text-sm flex items-center gap-1 font-body">
          <MapPin size={14} strokeWidth={2} />
          {plant.location}
        </span>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-all duration-300 ease-out opacity-0 group-hover:opacity-100 flex gap-2 p-4 pt-6"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)',
        }}
      >
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/90 text-bark-500 text-[12px] font-medium px-2 py-2.5 rounded-xl shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onRecordSymptom();
          }}
        >
          <Stethoscope size={14} />
          <span>记录新症状</span>
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/90 text-bark-500 text-[12px] font-medium px-2 py-2.5 rounded-xl shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onViewHistory();
          }}
        >
          <Clock size={14} />
          <span>历史诊断</span>
        </button>
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/90 text-bark-500 text-[12px] font-medium px-2 py-2.5 rounded-xl shadow-md hover:bg-white hover:scale-105 active:scale-95 transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            onUpdatePhoto();
          }}
        >
          <Camera size={14} />
          <span>更新照片</span>
        </button>
      </div>
    </div>
  );
}
