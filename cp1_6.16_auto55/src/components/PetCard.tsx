import React from 'react';
import { Pet } from '../types';
import { petStatusLabels } from '../data/PetData';

interface PetCardProps {
  pet: Pet;
  onClick: (pet: Pet) => void;
}

const PetCard: React.FC<PetCardProps> = ({ pet, onClick }) => {
  return (
    <div className="pet-card" onClick={() => onClick(pet)}>
      <div className="pet-card-image">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4.5 11.5L3 10C3 10 2 7 4 5C6 3 8.5 4 8.5 4L10 5.5" />
          <path d="M19.5 11.5L21 10C21 10 22 7 20 5C18 3 15.5 4 15.5 4L14 5.5" />
          <ellipse cx="12" cy="13" rx="7" ry="6" />
          <circle cx="9" cy="12" r="0.8" fill="currentColor" />
          <circle cx="15" cy="12" r="0.8" fill="currentColor" />
          <path d="M10.5 15.5C10.5 15.5 11 16.5 12 16.5C13 16.5 13.5 15.5 13.5 15.5" />
        </svg>
      </div>
      <div className="pet-card-content">
        <h3 className="pet-card-name">{pet.name}</h3>
        <p className="pet-card-breed">{pet.breed}</p>
        <div className="pet-card-footer">
          <span className="pet-card-age">{pet.age} 岁</span>
          <span className="adoption-count">
            领养 {pet.adoptionCount} 次 · {petStatusLabels[pet.status]}
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PetCard);
