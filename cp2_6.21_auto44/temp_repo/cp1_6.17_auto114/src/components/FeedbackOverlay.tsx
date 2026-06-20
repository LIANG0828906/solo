import React from 'react';
import { Check, X } from 'lucide-react';
import type { CheckResult } from '../types';

interface FeedbackOverlayProps {
  result: CheckResult;
}

const FeedbackOverlay: React.FC<FeedbackOverlayProps> = ({ result }) => {
  const borderColor = result.isCorrect ? '#4CAF50' : '#F44336';

  return (
    <div
      className="feedback-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: `3px solid ${borderColor}`,
        opacity: 0,
        animation: 'fadeIn 0.3s ease-in forwards',
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: result.isCorrect ? '0' : '8px',
        }}
      >
        {result.isCorrect ? (
          <Check style={{ color: '#fff', width: '28px', height: '28px' }} />
        ) : (
          <X style={{ color: '#fff', width: '28px', height: '28px' }} />
        )}
      </div>

      {!result.isCorrect && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '4px',
            padding: '0 16px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#F44336',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            正确答案
          </div>
          <div style={{ fontSize: '13px', color: '#3E2723', lineHeight: '1.4' }}>
            <span style={{ color: '#6D4C41' }}>
              {result.correctYear < 0 ? `${Math.abs(result.correctYear)}BC` : result.correctYear}年
            </span>
            {' · '}
            <span style={{ fontWeight: 'bold' }}>{result.correctEvent}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#8D6E63', marginTop: '4px' }}>
            正确位置：第 {result.correctPosition + 1} 位
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackOverlay;
