import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pet, PetStatus } from '../types';
import { petStatusLabels } from '../data/PetData';

interface PetModalProps {
  pet: Pet;
  onClose: () => void;
}

const PetModal: React.FC<PetModalProps> = ({ pet, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const handleApply = () => {
    handleClose();
    setTimeout(() => {
      navigate(`/application/${pet.id}`);
    }, 300);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className={`modal-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className={`modal-content ${isClosing ? 'closing' : ''}`}>
        <button className="modal-close" onClick={handleClose} aria-label="关闭">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="modal-pet-image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4.5 11.5L3 10C3 10 2 7 4 5C6 3 8.5 4 8.5 4L10 5.5" />
            <path d="M19.5 11.5L21 10C21 10 22 7 20 5C18 3 15.5 4 15.5 4L14 5.5" />
            <ellipse cx="12" cy="13" rx="7" ry="6" />
            <circle cx="9" cy="12" r="0.8" fill="currentColor" />
            <circle cx="15" cy="12" r="0.8" fill="currentColor" />
            <path d="M10.5 15.5C10.5 15.5 11 16.5 12 16.5C13 16.5 13.5 15.5 13.5 15.5" />
          </svg>
        </div>

        <h2 className="modal-pet-name">{pet.name}</h2>
        <p className="modal-pet-breed">{pet.breed}</p>

        <div className="modal-pet-info">
          <div className="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
            {pet.age} 岁
          </div>
          <div className="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            领养 {pet.adoptionCount} 次
          </div>
          <div className="info-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
            {petStatusLabels[pet.status]}
          </div>
        </div>

        <div className="modal-pet-personality">
          <p className="personality-label">性格特点</p>
          {pet.personality.map((trait, index) => (
            <span key={index} className="tag">{trait}</span>
          ))}
        </div>

        <p className="modal-pet-description">{pet.description}</p>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={handleClose}>
            取消
          </button>
          <button
            className="btn btn-accent"
            onClick={handleApply}
            disabled={pet.status !== PetStatus.AVAILABLE}
          >
            {pet.status === PetStatus.AVAILABLE ? '申请领养' : '暂不可领养'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PetModal;
