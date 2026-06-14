import React, { useState } from 'react';
import { Plant } from '../data/mockData';
import { usePlant } from '../context/PlantContext';

interface PlantDetailProps {
  plant: Plant;
  onClose: () => void;
}

const PlantDetail: React.FC<PlantDetailProps> = ({ plant, onClose }) => {
  const { getUserById, createSwapRequest, currentUser, getRequestsFromMe } = usePlant();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [applied, setApplied] = useState(false);
  const [closing, setClosing] = useState(false);
  const [reason, setReason] = useState('');
  const [expectation, setExpectation] = useState('');

  const owner = getUserById(plant.ownerId);
  const myRequests = getRequestsFromMe();
  const alreadyApplied = applied || myRequests.some(r => r.plantId === plant.id && r.fromUserId === currentUser.id);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
    }, 350);
  };

  const nextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % plant.images.length);
  };

  const prevImage = () => {
    setCurrentImageIdx((prev) => (prev - 1 + plant.images.length) % plant.images.length);
  };

  const handleSubmit = () => {
    if (!reason.trim() || !expectation.trim()) return;
    createSwapRequest(plant.id, reason, expectation);
    setApplied(true);
    setShowModal(false);
    setReason('');
    setExpectation('');
  };

  return (
    <>
      <div
        className={`detail-overlay ${closing ? 'closing' : ''}`}
        onClick={handleClose}
      />
      <div className={`detail-panel ${closing ? 'closing' : ''}`}>
        <button className="detail-close-btn" onClick={handleClose}>
          ✕
        </button>

        <div className="detail-carousel">
          <img
            src={plant.images[currentImageIdx]}
            alt={plant.name}
            className="detail-carousel-img"
          />
          {plant.images.length > 1 && (
            <>
              <button className="carousel-nav prev" onClick={prevImage}>
                ‹
              </button>
              <button className="carousel-nav next" onClick={nextImage}>
                ›
              </button>
              <div className="carousel-dots">
                {plant.images.map((_, idx) => (
                  <div
                    key={idx}
                    className={`carousel-dot ${idx === currentImageIdx ? 'active' : ''}`}
                    onClick={() => setCurrentImageIdx(idx)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="detail-body">
          <h1 className="detail-name">{plant.name}</h1>
          <div className="detail-variety">{plant.variety}</div>

          <div className="detail-section">
            <div className="detail-section-title">🌿 生长习性</div>
            <div className="detail-section-content">{plant.habits}</div>
          </div>

          <div className="detail-section">
            <div className="detail-section-title">🤝 交换要求</div>
            <div className="detail-section-content">{plant.swapRequirements}</div>
          </div>

          {owner && (
            <div className="detail-section">
              <div className="detail-section-title">👤 主人信息</div>
              <div className="detail-owner">
                <img
                  src={owner.avatar}
                  alt={owner.nickname}
                  className="detail-owner-avatar"
                />
                <div className="detail-owner-info">
                  <div className="detail-owner-name">{owner.nickname}</div>
                  <div className="detail-owner-bio">{owner.bio}</div>
                </div>
              </div>
            </div>
          )}

          {owner && alreadyApplied && (
            <div className="detail-section">
              <div className="detail-section-title">📞 联系方式</div>
              <div className="detail-contact">{owner.contact}</div>
            </div>
          )}

          {plant.ownerId !== currentUser.id && (
            <button
              className={`initiate-swap-btn ${alreadyApplied ? 'applied' : ''}`}
              onClick={() => !alreadyApplied && setShowModal(true)}
              disabled={alreadyApplied}
            >
              {alreadyApplied ? (
                <>
                  <span className="check-icon" />
                  已申请交换
                </>
              ) : (
                <>
                  🌱 发起交换
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="modal-content">
            <h3 className="modal-title">🌿 发起交换申请</h3>
            <div className="form-group">
              <label className="form-label">交换理由</label>
              <textarea
                className="form-textarea"
                placeholder="告诉对方为什么想交换这盆植物..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">你的期望</label>
              <input
                className="form-input"
                type="text"
                placeholder="你想用什么来交换？"
                value={expectation}
                onChange={(e) => setExpectation(e.target.value)}
              />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setShowModal(false)}>
                取消
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!reason.trim() || !expectation.trim()}
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlantDetail;
