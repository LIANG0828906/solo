import React, { useState, useEffect } from 'react';
import { useFlowerStore } from '../store';

const FlowerModal: React.FC = () => {
  const { isModalOpen, selectedFlower, closeModal, addFlower } = useFlowerStore();
  const [quantity, setQuantity] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      setIsVisible(true);
      setQuantity(1);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isModalOpen, closeModal]);

  if (!isVisible || !selectedFlower) return null;

  const handleAdd = () => {
    addFlower(selectedFlower, quantity);
    closeModal();
  };

  const increaseQuantity = () => {
    if (quantity < selectedFlower.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={closeModal}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#00000080',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        opacity: isModalOpen ? 1 : 0,
        transition: 'opacity 0.3s ease-out',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          borderRadius: '16px',
          padding: '32px',
          width: '90%',
          maxWidth: '400px',
          transform: isModalOpen ? 'scale(1)' : 'scale(0.9)',
          transition: 'transform 0.3s ease-out',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            height: '200px',
            backgroundColor: selectedFlower.color + '20',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: selectedFlower.color,
              boxShadow: `0 6px 25px ${selectedFlower.color}60`,
            }}
          />
        </div>

        <h2
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#333',
            marginBottom: '8px',
          }}
        >
          {selectedFlower.name}
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#E91E63',
            }}
          >
            ¥{selectedFlower.price.toFixed(1)}
          </span>
          <span style={{ fontSize: '14px', color: '#888', marginLeft: '4px' }}>
            /枝
          </span>
        </div>

        <div
          style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '24px',
          }}
        >
          库存：{selectedFlower.stock} 枝
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: '#F5F5F5',
            borderRadius: '12px',
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
            选择数量
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={decreaseQuantity}
              className="qty-btn"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#81C784',
                color: '#fff',
                border: 'none',
                fontSize: '20px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease-out',
              }}
            >
              -
            </button>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#333',
                minWidth: '40px',
                textAlign: 'center',
              }}
            >
              {quantity}
            </span>
            <button
              onClick={increaseQuantity}
              className="qty-btn"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#81C784',
                color: '#fff',
                border: 'none',
                fontSize: '20px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease-out',
              }}
            >
              +
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={closeModal}
            className="cancel-btn"
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '10px',
              border: '2px solid #E0E0E0',
              backgroundColor: '#fff',
              color: '#666',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
            }}
          >
            取消
          </button>
          <button
            onClick={handleAdd}
            className="add-btn"
            style={{
              flex: 2,
              padding: '14px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#81C784',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
            }}
          >
            添加到工作台
          </button>
        </div>

        <style>{`
          .qty-btn:hover {
            background-color: #66BB6A !important;
          }
          
          .qty-btn:active {
            background-color: #4CAF50 !important;
            transform: scale(0.95);
          }
          
          .cancel-btn:hover {
            border-color: #BDBDBD !important;
            background-color: #FAFAFA !important;
          }
          
          .cancel-btn:active {
            transform: scale(0.95);
          }
          
          .add-btn:hover {
            background-color: #66BB6A !important;
          }
          
          .add-btn:active {
            transform: scale(0.95);
          }
        `}</style>
      </div>
    </div>
  );
};

export default FlowerModal;
