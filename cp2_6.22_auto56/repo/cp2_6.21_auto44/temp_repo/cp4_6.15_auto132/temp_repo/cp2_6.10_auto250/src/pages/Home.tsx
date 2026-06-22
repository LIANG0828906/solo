import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SceneCard from '../components/SceneCard';
import ActionPanel from '../components/ActionPanel';
import EventModal from '../components/EventModal';
import { generateYaji, getAvailableActions, submitAction, triggerRandomEvent, handleEvent } from '../utils/api';
import type { Scene, Action, GameEvent, ActionResult } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [scene, setScene] = useState<Scene | null>(null);
  const [actions, setActions] = useState<Action | null>(null);
  const [timeLeft, setTimeLeft] = useState(900);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
  const [eventResult, setEventResult] = useState<{ success: boolean; message: string } | null>(null);
  const [actionCount, setActionCount] = useState(0);

  const loadScene = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const sceneData = await generateYaji();
      setScene(sceneData);
      setTimeLeft(sceneData.timeLimit);

      const actionsData = await getAvailableActions(sceneData.id);
      setActions(actionsData);
    } catch (err) {
      setError('加载雅集场景失败，请稍后重试');
      console.error('Failed to load scene:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScene();
  }, [loadScene]);

  useEffect(() => {
    if (timeLeft <= 0 || !scene) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, scene]);

  useEffect(() => {
    if (timeLeft === 0 && scene) {
      if (scene.day >= 10) {
        navigate('/report');
      } else {
        loadScene();
      }
    }
  }, [timeLeft, scene, navigate, loadScene]);

  const handleSubmit = useCallback(async (musicId: string, chessId: string, paintingId: string) => {
    if (!scene || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setActionResult(null);

      const result: ActionResult = await submitAction(scene.id, musicId, chessId, paintingId);
      setActionResult({ success: result.success, message: result.message });

      setScene(prev => prev ? { ...prev, atmosphere: result.newAtmosphere } : null);

      const newActionCount = actionCount + 1;
      setActionCount(newActionCount);

      if (result.triggerEvent || (newActionCount > 0 && Math.random() < 0.25)) {
        const event = await triggerRandomEvent(scene.id);
        setCurrentEvent(event);
      }
    } catch (err) {
      setActionResult({ success: false, message: '提交失败，请稍后重试' });
      console.error('Failed to submit action:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [scene, isSubmitting, actionCount]);

  const handleEventSelect = useCallback(async (optionId: string) => {
    if (!currentEvent || !scene) return;

    try {
      const result: ActionResult = await handleEvent(currentEvent.id, optionId, scene.id);
      setEventResult({ success: result.success, message: result.message });

      setScene(prev => prev ? { ...prev, atmosphere: result.newAtmosphere } : null);
    } catch (err) {
      setEventResult({ success: false, message: '处理事件失败' });
      console.error('Failed to handle event:', err);
    }
  }, [currentEvent, scene]);

  const handleCloseEvent = useCallback(() => {
    setCurrentEvent(null);
    setEventResult(null);
    if (scene && scene.day >= 10) {
      navigate('/report');
    } else {
      loadScene();
    }
  }, [scene, navigate, loadScene]);

  if (loading) {
    return <div className="loading">正在生成今日雅集场景...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!scene || !actions) {
    return <div className="error">暂无雅集数据</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">雅集录</h1>
        <p className="page-subtitle">第 {scene.day} 日 · 共赴文会之约</p>
      </div>

      <div className="home-layout">
        <SceneCard scene={scene} timeLeft={timeLeft} />
        <ActionPanel
          actions={actions}
          onSubmit={handleSubmit}
          disabled={isSubmitting || timeLeft === 0}
          result={actionResult}
        />
      </div>

      {currentEvent && (
        <div onClick={handleCloseEvent}>
          <EventModal
            event={currentEvent}
            onSelect={handleEventSelect}
            result={eventResult}
          />
        </div>
      )}
    </div>
  );
};

export default Home;
