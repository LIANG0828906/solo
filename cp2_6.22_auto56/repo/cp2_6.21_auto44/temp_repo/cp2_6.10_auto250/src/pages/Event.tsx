import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EventModal from '../components/EventModal';
import { triggerRandomEvent, handleEvent } from '../utils/api';
import type { GameEvent, ActionResult } from '../types';

const Event: React.FC = () => {
  const navigate = useNavigate();
  const [event, setEvent] = useState<GameEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [sceneId, setSceneId] = useState<string>('');

  const loadEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams(window.location.search);
      const id = params.get('sceneId') || `scene_${Date.now()}`;
      setSceneId(id);

      const eventData = await triggerRandomEvent(id);
      setEvent(eventData);
    } catch (err) {
      setError('加载事件失败，请稍后重试');
      console.error('Failed to load event:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  const handleSelect = useCallback(async (optionId: string) => {
    if (!event || result) return;

    try {
      const actionResult: ActionResult = await handleEvent(event.id, optionId, sceneId);
      setResult({ success: actionResult.success, message: actionResult.message });
    } catch (err) {
      setResult({ success: false, message: '处理事件失败' });
      console.error('Failed to handle event:', err);
    }
  }, [event, result, sceneId]);

  const handleBack = useCallback(() => {
    navigate('/');
  }, [navigate]);

  if (loading) {
    return <div className="loading">事件发生中...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button className="btn" onClick={handleBack} style={{ marginTop: '20px' }}>
          返回雅集
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="error">
        <p>暂无事件</p>
        <button className="btn" onClick={handleBack} style={{ marginTop: '20px' }}>
          返回雅集
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">雅集变故</h1>
        <p className="page-subtitle">沉着应对，方能彰显主人风范</p>
      </div>

      {result ? (
        <div className="ink-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div
            className={result.success ? 'success-message' : 'error-message'}
            style={{
              padding: '20px',
              borderRadius: '8px',
              background: result.success ? 'rgba(74, 124, 89, 0.1)' : 'rgba(192, 57, 43, 0.1)',
              textAlign: 'center',
              marginBottom: '24px',
              fontSize: '1.0625rem',
            }}
          >
            {result.message}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleBack}>
              返回雅集
            </button>
          </div>
        </div>
      ) : (
        <EventModal
          event={event}
          onSelect={handleSelect}
          result={result}
        />
      )}
    </div>
  );
};

export default Event;
