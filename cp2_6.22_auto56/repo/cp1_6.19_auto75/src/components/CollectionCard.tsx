import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Collection } from '../types';
import { FaArrowRight } from 'react-icons/fa';

interface CollectionCardProps {
  collection: Collection;
  index?: number;
}

export function CollectionCard({ collection, index = 0 }: CollectionCardProps) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate(`/collection/${collection.id}`);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative w-full aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        animationDelay: `${index * 0.15}s`
      }}
    >
      <div
        className="absolute inset-0 transition-transform duration-700"
        style={{
          background: `linear-gradient(135deg, ${collection.themeColors[0]} 0%, ${collection.themeColors[1]} 100%)`
        }}
      />

      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-full h-full opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30,5 Q35,15 30,25 Q25,15 30,5 M15,20 Q20,30 15,40 Q10,30 15,20 M45,20 Q50,30 45,40 Q40,30 45,20 M20,40 Q25,50 20,55 Q15,50 20,40 M40,40 Q45,50 40,55 Q35,50 40,40' fill='%23000'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <svg viewBox="0 0 300 400" className="w-3/5 h-3/5 drop-shadow-2xl">
          <defs>
            <linearGradient id={`collect-${collection.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g filter="url(#glow)">
            <path
              d="M150,40 Q100,80 90,140 L70,340 Q150,380 230,340 L210,140 Q200,80 150,40"
              fill={`url(#collect-${collection.id})`}
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="2"
            />
            <circle cx="150" cy="30" r="25" fill="rgba(255,255,255,0.5)" />
          </g>
        </svg>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute top-4 left-4">
        <span className="inline-block px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-sm font-semibold text-gray-800 shadow-lg">
          {collection.name}
        </span>
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg p-4 transition-all duration-200 ease-out ${
          isHovered ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      >
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {collection.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">探索系列</span>
          <div className="flex items-center gap-1 text-emerald-600 font-medium text-sm">
            <span>查看更多</span>
            <FaArrowRight
              className={`transition-transform duration-300 ${
                isHovered ? 'translate-x-1' : ''
              }`}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
              {collection.name}
            </h3>
          </div>
          <div
            className={`w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'bg-white/40 scale-110' : ''
            }`}
          >
            <FaArrowRight className="text-white" size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
