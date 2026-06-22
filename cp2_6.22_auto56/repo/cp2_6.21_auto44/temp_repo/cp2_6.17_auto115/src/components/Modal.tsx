import React from 'react';
import { TaskStatistics } from '../data/taskStore';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  statistics: TaskStatistics;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, statistics }) => {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '500px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          padding: '32px',
          boxSizing: 'border-box',
        }}
      >
        <h2
          style={{
            margin: '0 0 24px 0',
            fontSize: '20px',
            fontWeight: 700,
            color: '#333',
          }}
        >
          工时统计汇总
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: '#F5F5FA',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              总预估工时
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#6C63FF' }}>
              {statistics.totalEstimatedHours}
              <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px' }}>h</span>
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#F5F5FA',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
              总实际工时
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#333' }}>
              {statistics.totalActualHours}
              <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px' }}>h</span>
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#F5F5FA',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '13px', color: '#666' }}>完成率</span>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
              {statistics.completedTasks} / {statistics.totalTasks} 个任务
            </span>
          </div>
          <div
            style={{
              height: '8px',
              backgroundColor: '#E0E0E0',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                backgroundColor: '#6C63FF',
                borderRadius: '4px',
                width: `${statistics.completionRate * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '16px', fontWeight: 700, color: '#6C63FF' }}>
            {(statistics.completionRate * 100).toFixed(1)}%
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            height: '40px',
            backgroundColor: '#6C63FF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#5A52D5')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#6C63FF')}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default Modal;
