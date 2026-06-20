import React, { useCallback } from 'react';
import type { GameEvent } from '../types';

interface EventModalProps {
  event: GameEvent;
  onSelect: (optionId: string) => void;
  result?: { success: boolean; message: string } | null;
}

const EventModal: React.FC<EventModalProps> = ({ event, onSelect, result }) => {
  const handleSelect = useCallback((optionId: string) => {
    if (result) return;
    onSelect(optionId);
  }, [onSelect, result]);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📜</div>
          <h2 style={{ color: 'var(--zhu-sha)' }}>{event.title}</h2>
        </div>

        <p style={{ marginBottom: '24px', textAlign: 'center', fontSize: '1.0625rem' }}>
          {event.description}
        </p>

        {result ? (
          <div
            className={result.success ? 'success-message' : 'error-message'}
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: result.success ? 'rgba(74, 124, 89, 0.1)' : 'rgba(192, 57, 43, 0.1)',
              textAlign: 'center',
              marginBottom: '20px',
            }}
          >
            {result.message}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {event.options.map((option, index) => (
              <button
                key={option.id}
                className="btn"
                onClick={() => handleSelect(option.id)}
                style={{ animation: `slideUp 0.3s ease ${index * 0.1}s both` }}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {result && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={() => window.location.reload()}>
              继续雅集
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventModal;
