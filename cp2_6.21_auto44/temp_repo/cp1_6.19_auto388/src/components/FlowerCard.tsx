import React from 'react';
import { Flower, useFlowerStore } from '../store';

interface FlowerCardProps {
  flower: Flower;
}

const FlowerCard: React.FC<FlowerCardProps> = ({ flower }) => {
  const openModal = useFlowerStore((state) => state.openModal);

  return (
    <div
      className="flower-card"
      onClick={() => openModal(flower)}
      style={{
        width: '200px',
        height: '280px',
        borderRadius: '12px',
        backgroundColor: '#fff',
        boxShadow: '0 2px 8px #E0E0E0',
        cursor: 'pointer',
        transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: '160px',
          backgroundColor: flower.color + '20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: flower.color,
            boxShadow: `0 4px 15px ${flower.color}60`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: flower.color,
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          库存 {flower.stock}
        </div>
      </div>
      <div
        style={{
          padding: '12px 16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#333',
            marginBottom: '4px',
          }}
        >
          {flower.name}
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#E91E63',
            }}
          >
            ¥{flower.price.toFixed(1)}
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#888',
            }}
          >
            /枝
          </span>
        </div>
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            marginTop: '6px',
          }}
        >
          点击查看详情并添加
        </div>
      </div>

      <style>{`
        .flower-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px #E0E0E0;
        }
        
        .flower-card:active {
          transform: scale(0.97);
        }
      `}</style>
    </div>
  );
};

export default FlowerCard;
