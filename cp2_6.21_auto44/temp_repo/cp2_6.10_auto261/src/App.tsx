import React, { useState, useEffect, useCallback, useRef } from 'react';
import StarMap from './components/StarMap';
import TaskPanel from './components/TaskPanel';
import OfficerInfo from './components/OfficerInfo';
import EventModal from './components/EventModal';
import ScorePage from './components/ScorePage';
import { CONSTELLATIONS } from './constellations';
import { generateCelestialEvent, validateChoice, calculateXunScore } from './api';
import { playSuccessSound, playErrorSound, randomWeather, randomEvent, getConstellationById } from './utils';
import { Constellation, CelestialEvent, Weather, GameState } from './types';

const DAYS_PER_XUN = 10;
const EVENT_INTERVAL = 8000;
const RANDOM_EVENT_CHANCE = 0.2;

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentEvent: null,
    starOfficer: {
      name: '南宫辰',
      cultivation: 100,
      rank: '铜星官',
      accuracy: 0,
      totalEvents: 0,
      correctEvents: 0,
      daysInCurrentXun: 1,
    },
    weather: randomWeather() as Weather,
    constellations: CONSTELLATIONS,
    selectedConstellation: null,
    showEventModal: false,
    showScorePage: false,
    xunScore: null,
    countdown: 0,
    flashConstellation: null,
    flowLines: [],
    gamePhase: 'playing',
  });

  const [selectedOption, setSelectedOption] = useState<{ constellationId: string; inscription: string } | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const eventTimeoutRef = useRef<number | null>(null);
  const flowLineIntervalRef = useRef<number | null>(null);

  const clearAllTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (eventTimeoutRef.current) {
      clearTimeout(eventTimeoutRef.current);
      eventTimeoutRef.current = null;
    }
    if (flowLineIntervalRef.current) {
      clearInterval(flowLineIntervalRef.current);
      flowLineIntervalRef.current = null;
    }
  }, []);

  const updateRank = (cultivation: number): string => {
    if (cultivation >= 800) return '紫微星官';
    if (cultivation >= 600) return '太白金官';
    if (cultivation >= 400) return '青龙星官';
    if (cultivation >= 200) return '玄武星官';
    return '铜星官';
  };

  const triggerRandomEvent = useCallback(() => {
    const eventTypes = ['starfall', 'battle', 'destruction'];
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const eventData = randomEvent(eventType);
    
    const baseEvent = gameState.currentEvent;
    if (!baseEvent) return;

    const randomEventObj: CelestialEvent = {
      ...baseEvent,
      id: `random-${Date.now()}`,
      type: eventType as any,
      name: eventData.name,
      description: eventData.description,
    };

    setGameState(prev => ({
      ...prev,
      currentEvent: randomEventObj,
      showEventModal: true,
      gamePhase: 'event',
      countdown: 15,
    }));
  }, [gameState.currentEvent]);

  const startCountdown = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = window.setInterval(() => {
      setGameState(prev => {
        const newCountdown = prev.countdown - 0.1;
        if (newCountdown <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          handleTimeout();
          return { ...prev, countdown: 0 };
        }
        return { ...prev, countdown: newCountdown };
      });
    }, 100);
  }, []);

  const handleTimeout = useCallback(() => {
    playErrorSound();
    setGameState(prev => {
      const newTotalEvents = prev.starOfficer.totalEvents + 1;
      const newAccuracy = prev.starOfficer.totalEvents > 0 
        ? prev.starOfficer.correctEvents / newTotalEvents 
        : 0;
      return {
        ...prev,
        showEventModal: false,
        gamePhase: 'playing',
        currentEvent: null,
        starOfficer: {
          ...prev.starOfficer,
          totalEvents: newTotalEvents,
          accuracy: newAccuracy,
          cultivation: Math.max(0, prev.starOfficer.cultivation - 15),
          rank: updateRank(Math.max(0, prev.starOfficer.cultivation - 15)),
        },
      };
    });
    setSelectedOption(null);
    setIsCorrect(null);
    scheduleNextEvent();
  }, []);

  const generateNewEvent = useCallback(async () => {
    if (gameState.gamePhase !== 'playing') return;

    const event = await generateCelestialEvent(gameState.weather);
    
    if (Math.random() < RANDOM_EVENT_CHANCE && gameState.starOfficer.daysInCurrentXun > 2) {
      setGameState(prev => ({
        ...prev,
        currentEvent: event,
      }));
      setTimeout(() => triggerRandomEvent(), 1000);
    } else {
      setGameState(prev => ({
        ...prev,
        currentEvent: event,
        showEventModal: true,
        gamePhase: 'event',
        countdown: event.timeLimit,
      }));
      startCountdown();
    }
  }, [gameState.weather, gameState.gamePhase, gameState.starOfficer.daysInCurrentXun, startCountdown, triggerRandomEvent]);

  const scheduleNextEvent = useCallback(() => {
    clearAllTimers();
    eventTimeoutRef.current = window.setTimeout(() => {
      generateNewEvent();
    }, EVENT_INTERVAL);
  }, [clearAllTimers, generateNewEvent]);

  const addFlowLines = useCallback((constellationId: string) => {
    const constellation = getConstellationById(constellationId, CONSTELLATIONS);
    if (!constellation) return;

    const lines = constellation.lines.map((toId: string) => ({
      from: constellationId,
      to: toId,
      progress: 0,
    }));

    setGameState(prev => ({ ...prev, flowLines: lines }));

    flowLineIntervalRef.current = window.setInterval(() => {
      setGameState(prev => {
        const updated = prev.flowLines.map(line => ({
          ...line,
          progress: line.progress + 0.05,
        })).filter(line => line.progress < 2);
        return { ...prev, flowLines: updated };
      });
    }, 50);

    setTimeout(() => {
      if (flowLineIntervalRef.current) {
        clearInterval(flowLineIntervalRef.current);
      }
      setGameState(prev => ({ ...prev, flowLines: [] }));
    }, 3000);
  }, []);

  const handleOptionSelect = useCallback(async (constellationId: string, inscription: string) => {
    if (!gameState.currentEvent || selectedOption) return;

    clearAllTimers();
    setSelectedOption({ constellationId, inscription });

    const result = await validateChoice(gameState.currentEvent.id, constellationId, inscription);
    setIsCorrect(result.isCorrect);

    if (result.isCorrect) {
      playSuccessSound();
      setGameState(prev => ({ ...prev, flashConstellation: constellationId }));
      addFlowLines(constellationId);

      setTimeout(() => {
        setGameState(prev => {
          const newCorrectEvents = prev.starOfficer.correctEvents + 1;
          const newTotalEvents = prev.starOfficer.totalEvents + 1;
          const newCultivation = prev.starOfficer.cultivation + result.cultivationGain;
          const newAccuracy = newCorrectEvents / newTotalEvents;
          const newDays = prev.starOfficer.daysInCurrentXun + 1;

          if (newDays > DAYS_PER_XUN) {
            return prev;
          }

          return {
            ...prev,
            flashConstellation: null,
            showEventModal: false,
            gamePhase: 'playing',
            currentEvent: null,
            weather: Math.random() < 0.3 ? randomWeather() as Weather : prev.weather,
            starOfficer: {
              ...prev.starOfficer,
              correctEvents: newCorrectEvents,
              totalEvents: newTotalEvents,
              cultivation: newCultivation,
              accuracy: newAccuracy,
              rank: updateRank(newCultivation),
              daysInCurrentXun: newDays,
            },
          };
        });
        setSelectedOption(null);
        setIsCorrect(null);
        scheduleNextEvent();
      }, 1500);
    } else {
      playErrorSound();
      setTimeout(() => {
        setGameState(prev => {
          const newTotalEvents = prev.starOfficer.totalEvents + 1;
          const newAccuracy = prev.starOfficer.correctEvents / newTotalEvents;
          const newDays = prev.starOfficer.daysInCurrentXun + 1;

          if (newDays > DAYS_PER_XUN) {
            return prev;
          }

          return {
            ...prev,
            showEventModal: false,
            gamePhase: 'playing',
            currentEvent: null,
            weather: Math.random() < 0.3 ? randomWeather() as Weather : prev.weather,
            starOfficer: {
              ...prev.starOfficer,
              totalEvents: newTotalEvents,
              accuracy: newAccuracy,
              cultivation: Math.max(0, prev.starOfficer.cultivation - 10),
              rank: updateRank(Math.max(0, prev.starOfficer.cultivation - 10)),
              daysInCurrentXun: newDays,
            },
          };
        });
        setSelectedOption(null);
        setIsCorrect(null);
        scheduleNextEvent();
      }, 1500);
    }
  }, [gameState.currentEvent, selectedOption, clearAllTimers, addFlowLines, scheduleNextEvent]);

  const handleConstellationClick = useCallback((constellation: Constellation) => {
    setGameState(prev => ({
      ...prev,
      selectedConstellation: constellation,
    }));
  }, []);

  const endXun = useCallback(async () => {
    clearAllTimers();
    const score = await calculateXunScore(
      gameState.starOfficer.accuracy,
      gameState.starOfficer.cultivation,
      gameState.starOfficer.totalEvents
    );
    setGameState(prev => ({
      ...prev,
      showScorePage: true,
      xunScore: score,
      gamePhase: 'scoring',
    }));
  }, [gameState.starOfficer, clearAllTimers]);

  const restartGame = useCallback(() => {
    clearAllTimers();
    setGameState({
      currentEvent: null,
      starOfficer: {
        name: '南宫辰',
        cultivation: 100,
        rank: '铜星官',
        accuracy: 0,
        totalEvents: 0,
        correctEvents: 0,
        daysInCurrentXun: 1,
      },
      weather: randomWeather() as Weather,
      constellations: CONSTELLATIONS,
      selectedConstellation: null,
      showEventModal: false,
      showScorePage: false,
      xunScore: null,
      countdown: 0,
      flashConstellation: null,
      flowLines: [],
      gamePhase: 'playing',
    });
    setSelectedOption(null);
    setIsCorrect(null);
    setTimeout(() => generateNewEvent(), 2000);
  }, [clearAllTimers, generateNewEvent]);

  useEffect(() => {
    if (gameState.starOfficer.daysInCurrentXun > DAYS_PER_XUN && !gameState.showScorePage) {
      endXun();
    }
  }, [gameState.starOfficer.daysInCurrentXun, gameState.showScorePage, endXun]);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateNewEvent();
    }, 2000);

    return () => {
      clearAllTimers();
      clearTimeout(timer);
    };
  }, []);

  if (gameState.showScorePage && gameState.xunScore) {
    return (
      <ScorePage
        score={gameState.xunScore}
        officerName={gameState.starOfficer.name}
        onRestart={restartGame}
      />
    );
  }

  return (
    <div className="app-container">
      <TaskPanel
        currentEvent={gameState.currentEvent}
        constellations={gameState.constellations}
        onOptionSelect={handleOptionSelect}
        selectedOption={selectedOption}
        isCorrect={isCorrect}
      />

      <div className="center-panel">
        <StarMap
          constellations={gameState.constellations}
          flashConstellation={gameState.flashConstellation}
          flowLines={gameState.flowLines}
          onConstellationClick={handleConstellationClick}
        />
      </div>

      <OfficerInfo
        starOfficer={gameState.starOfficer}
        weather={gameState.weather}
      />

      {gameState.showEventModal && gameState.currentEvent && (
        <EventModal
          event={gameState.currentEvent}
          constellations={gameState.constellations}
          countdown={gameState.countdown}
          onSelect={handleOptionSelect}
        />
      )}
    </div>
  );
};

export default App;
