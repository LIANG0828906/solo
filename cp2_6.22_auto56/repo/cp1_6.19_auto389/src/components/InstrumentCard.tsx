import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { useStore } from '../store';
import ConditionBar from './ConditionBar';
import type { Instrument } from '../types';
import '../index.css';

interface InstrumentCardProps {
  instrument: Instrument;
  index?: number;
}

export default function InstrumentCard({ instrument, index = 0 }: InstrumentCardProps) {
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useStore();
  const isFavorite = favorites.includes(instrument.id);

  const handleClick = () => {
    navigate(`/detail/${instrument.id}`);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(instrument.id);
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col rounded-xl bg-white cursor-pointer group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        width: '280px',
        height: '320px',
        boxShadow: '0 2px 8px #E0E0E0',
        animation: `fadeInUp 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      <div className="relative overflow-hidden rounded-t-xl" style={{ height: '180px' }}>
        <img
          src={instrument.image}
          alt={`${instrument.brand} ${instrument.model}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex-1 p-4 flex flex-col">
        <div className="mb-2">
          <h3 className="font-bold text-base" style={{ color: '#333' }}>
            {instrument.brand} {instrument.model}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">{instrument.type}</p>
        </div>

        <div className="mb-3">
          <ConditionBar condition={instrument.condition} />
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold" style={{ color: '#333' }}>
            ¥{instrument.expectedPrice.toLocaleString()}
          </span>
          <button
            onClick={handleFavoriteClick}
            className="p-2 rounded-full transition-all hover:scale-110"
            style={{
              backgroundColor: isFavorite ? 'rgba(255, 215, 0, 0.1)' : 'transparent',
            }}
          >
            <Star
              className="w-5 h-5 transition-all"
              style={{
                fill: isFavorite ? '#FFD700' : 'none',
                color: isFavorite ? '#FFD700' : '#9CA3AF',
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
