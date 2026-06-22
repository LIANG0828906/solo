import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { api } from '@/utils/api';

export function useGameState() {
  const {
    currentEvent,
    timeRemaining,
    selectedStar,
    selectedInscription,
    setEvents,
    setSelectedStar,
    setSelectedInscription,
    setTimeRemaining,
    submitAnswer,
    setRandomEvent,
    setLoading,
    showResultMessage,
    loadRecords,
    cultivation,
  } = useGameStore();

  const timerRef = useRef<number | null>(null);

  const startGame = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.getStarEvents();
      setEvents(response.events, response.day, response.xun, response.cultivation);
      if (response.randomEvent) {
        setRandomEvent(response.randomEvent);
      }
      loadRecords();
    } catch {
      showResultMessage('加载游戏数据失败', 0);
    } finally {
      setLoading(false);
    }
  }, [setEvents, setRandomEvent, setLoading, showResultMessage, loadRecords]);

  const handleStarSelect = useCallback(
    (star: string | null) => {
      if (currentEvent && star && currentEvent.availableStars.includes(star)) {
        setSelectedStar(star);
      }
    },
    [currentEvent, setSelectedStar]
  );

  const handleInscriptionSelect = useCallback(
    (inscription: string | null) => {
      if (currentEvent && inscription && currentEvent.availableInscriptions.includes(inscription)) {
        setSelectedInscription(inscription);
      }
    },
    [currentEvent, setSelectedInscription]
  );

  const handleSubmit = useCallback(async () => {
    if (!selectedStar || !selectedInscription) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await submitAnswer();
  }, [selectedStar, selectedInscription, submitAnswer]);

  const handleTimeout = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    showResultMessage('时间耗尽，处理失败', -5);
    setTimeRemaining(0);
    setTimeout(() => {
      useGameStore.getState().nextEvent();
    }, 1500);
  }, [showResultMessage, setTimeRemaining]);

  useEffect(() => {
    if (!currentEvent || timeRemaining <= 0) return;

    timerRef.current = window.setInterval(() => {
      const newTime = useGameStore.getState().timeRemaining - 1;
      setTimeRemaining(newTime);
      if (newTime <= 0) {
        handleTimeout();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentEvent?.id, setTimeRemaining, handleTimeout]);

  return {
    startGame,
    handleStarSelect,
    handleInscriptionSelect,
    handleSubmit,
    handleTimeout,
    cultivation,
    currentEvent,
    timeRemaining,
    selectedStar,
    selectedInscription,
  };
}
