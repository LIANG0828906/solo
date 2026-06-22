import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flower, Leaf, TreeDeciduous, Sprout, Sparkles } from 'lucide-react';
import type { Plant } from '@/types';
import { formatDateTime } from '@/utils/date';

interface PlantCardProps {
  plant: Plant;
  lastCareDate: string | null;
  index: number;
}

const speciesIcons = [Flower, Leaf, TreeDeciduous, Sprout, Sparkles];

function getSpeciesIcon(species: string) {
  let hash = 0;
  for (let i = 0; i < species.length; i++) {
    hash = (hash * 31 + species.charCodeAt(i)) >>> 0;
  }
  return speciesIcons[hash % speciesIcons.length];
}

function PlantCardImpl({ plant, lastCareDate, index }: PlantCardProps) {
  const navigate = useNavigate();
  const Icon = getSpeciesIcon(plant.species);

  return (
    <div
      onClick={() => navigate(`/plant/${plant.id}`)}
      className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover cursor-pointer transition-all duration-200 hover:-translate-y-1 overflow-hidden border border-primary/5"
      style={{
        animation: `fadeInUp 0.5s ease-out ${index * 0.06}s both`,
      }}
    >
      <div className="absolute top-3 left-3 z-10 w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>

      <div className="aspect-[4/3] w-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
        {plant.photo ? (
          <img
            src={plant.photo}
            alt={plant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flower className="w-16 h-16 text-primary/30" />
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-serif font-semibold text-lg text-app-text truncate">
            {plant.name}
          </h3>
        </div>
        <p className="text-xs text-primary font-medium mb-3 truncate">{plant.species}</p>

        <div className="flex items-center justify-between pt-2 border-t border-primary/5">
          <span className="text-[11px] text-app-text-light">
            {lastCareDate ? `最近养护：${formatDateTime(lastCareDate).split(' ')[0]}` : '暂无养护记录'}
          </span>
          <div className="w-2 h-2 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
        </div>
      </div>
    </div>
  );
}

export const PlantCard = memo(PlantCardImpl);
