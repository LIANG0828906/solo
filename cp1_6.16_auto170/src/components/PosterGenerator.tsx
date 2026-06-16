// 海报生成器组件 - 弹窗
import React from 'react';

interface PosterGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PosterGenerator: React.FC<PosterGeneratorProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        minWidth: '400px'
      }}>
        <h2>海报生成器</h2>
        <p>在这里生成书展海报</p>
        <button onClick={onClose}>关闭</button>
      </div>
    </div>
  );
};

export default PosterGenerator;
