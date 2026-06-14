import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Pet } from '../types';

interface PetCardProps {
  pet: Pet;
  index: number;
}

const PetCard: React.FC<PetCardProps> = ({ pet, index }) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleClick = () => {
    navigate(`/pet/${pet.id}`);
  };

  const genderText = pet.gender === 'male' ? '♂' : '♀';
  const genderColor = pet.gender === 'male' ? '#60a5fa' : '#f472b6';

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="pet-card glass-card cursor-pointer overflow-hidden"
      style={{
        animationDelay: `${index * 0.1}s`,
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 20px 40px rgba(0, 0, 0, 0.12)'
          : '0 8px 32px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <div className="relative p-6 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-4">
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{
              opacity: imageLoaded ? 1 : 0,
              transform: imageLoaded ? 'scale(1) rotate(0deg)' : 'scale(0.8) rotate(-10deg)',
              transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <img
              src={pet.avatar || '/uploads/default-avatar.png'}
              alt={pet.name}
              className="w-full h-full object-cover"
              onLoad={() => setImageLoaded(true)}
              style={{ clipPath: 'circle(50% at 50% 50%)' }}
            />
          </div>
          {!imageLoaded && (
            <div className="absolute inset-0 rounded-full animate-shimmer" />
          )}
          <div
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: genderColor, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            {genderText}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-800 mb-2">{pet.name}</h3>

        <div
          className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-700 animate-breath"
          style={{
            background: 'linear-gradient(135deg, #fbcfe8 0%, #bbf7d0 100%)',
          }}
        >
          {pet.breed}
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
          <span>🎂 {pet.birthday ? new Date(pet.birthday).getFullYear() + '年' : '未知'}</span>
          {pet.weight && <span>⚖️ {pet.weight}kg</span>}
        </div>
      </div>

      <div
        className="h-1 w-full"
        style={{
          background: 'linear-gradient(90deg, #f472b6, #a78bfa, #34d399)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
};

export default PetCard;
