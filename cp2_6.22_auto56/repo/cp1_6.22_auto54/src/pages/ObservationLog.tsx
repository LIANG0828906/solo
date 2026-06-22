import React, { useState, useEffect, useCallback, useRef } from 'react';
import StarCanvas from '../components/StarCanvas';
import ObservationSidebar from '../components/ObservationSidebar';
import {
  generateStars,
  Star,
  Constellation,
  ObservedStar,
  CustomConnection,
  ObservationLog as ObservationLogType,
  ObservationState,
} from '../utils/stellarData';
import './ObservationLog.css';

const ObservationLog: React.FC = () => {
  const [stars, setStars] = useState<Star[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [observedStars, setObservedStars] = useState<ObservedStar[]>([]);
  const [customConnections, setCustomConnections] = useState<CustomConnection[]>([]);
  const [observationLogs, setObservationLogs] = useState<ObservationLogType[]>([]);
  const [selectedConstellationId, setSelectedConstellationId] = useState<string | null>(null);
  const [lineColor, setLineColor] = useState('#7FDBFF');
  const [shiftPressed, setShiftPressed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const initialStars = generateStars(60, 1000, 800);
    setStars(initialStars);
  }, []);

  const fetchConstellations = useCallback(async () => {
    try {
      const res = await fetch('/api/constellations');
      const data = await res.json();
      setConstellations(data);
    } catch (err) {
      console.error('Failed to fetch constellations:', err);
    }
  }, []);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch('/api/observation/state');
      const data: ObservationState = await res.json();
      setObservedStars(data.observedStars || []);
      setCustomConnections(data.customConnections || []);
      setObservationLogs(data.observationLogs || []);
      setSelectedConstellationId(data.selectedConstellation || null);
      setLoaded(true);
    } catch (err) {
      console.error('Failed to fetch state:', err);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchConstellations();
    fetchState();
  }, [fetchConstellations, fetchState]);

  const saveState = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/observation/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            observedStars,
            customConnections,
            observationLogs,
            selectedConstellation: selectedConstellationId,
          }),
        });
      } catch (err) {
        console.error('Failed to save state:', err);
      }
    }, 300);
  }, [observedStars, customConnections, observationLogs, selectedConstellationId]);

  useEffect(() => {
    if (loaded) {
      saveState();
    }
  }, [observedStars, customConnections, observationLogs, selectedConstellationId, loaded, saveState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftPressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const addLogEntry = useCallback((type: 'observe' | 'connect' | 'constellation', target: string) => {
    const newLog: ObservationLogType = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      target,
      note: '',
      mood: '',
      timestamp: new Date().toISOString(),
    };
    setObservationLogs((prev) => [newLog, ...prev]);
  }, []);

  const handleStarClick = useCallback((star: Star) => {
    const isObserved = observedStars.some((s) => s.starId === star.id);

    if (isObserved) {
      setObservedStars((prev) => prev.filter((s) => s.starId !== star.id));
    } else {
      const newObserved: ObservedStar = {
        id: Date.now().toString(),
        starId: star.id,
        starName: star.name,
        note: '',
        observedAt: new Date().toISOString(),
      };
      setObservedStars((prev) => [...prev, newObserved]);
      addLogEntry('observe', `标记恒星: ${star.name}`);
    }
  }, [observedStars, addLogEntry]);

  const handleConnectionCreate = useCallback((fromStarId: string, toStarId: string) => {
    const fromStar = stars.find((s) => s.id === fromStarId);
    const toStar = stars.find((s) => s.id === toStarId);

    if (!fromStar || !toStar) return;

    const exists = customConnections.some(
      (c) =>
        (c.fromStarId === fromStarId && c.toStarId === toStarId) ||
        (c.fromStarId === toStarId && c.toStarId === fromStarId)
    );

    if (!exists) {
      const newConn: CustomConnection = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        fromStarId,
        toStarId,
        color: lineColor,
        note: '',
        createdAt: new Date().toISOString(),
      };
      setCustomConnections((prev) => [...prev, newConn]);
      addLogEntry('connect', `连接: ${fromStar.name} → ${toStar.name}`);
    }
  }, [stars, customConnections, lineColor, addLogEntry]);

  const handleConstellationSelect = useCallback((id: string | null) => {
    setSelectedConstellationId(id);
    if (id) {
      const constellation = constellations.find((c) => c.id === id);
      if (constellation) {
        addLogEntry('constellation', `选中星座: ${constellation.name}`);
      }
    }
  }, [constellations, addLogEntry]);

  const handleLogNoteChange = useCallback((logId: string, note: string) => {
    setObservationLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, note } : log))
    );
  }, []);

  const handleLogMoodChange = useCallback((logId: string, mood: string) => {
    setObservationLogs((prev) =>
      prev.map((log) => (log.id === logId ? { ...log, mood } : log))
    );
  }, []);

  const selectedConstellation = constellations.find((c) => c.id === selectedConstellationId) || null;

  return (
    <div className={`observation-log ${loaded ? 'fade-in' : ''}`}>
      <div className="canvas-container">
        <StarCanvas
          stars={stars}
          observedStars={observedStars}
          customConnections={customConnections}
          selectedConstellation={selectedConstellation}
          lineColor={lineColor}
          isConnectMode={shiftPressed}
          onStarClick={handleStarClick}
          onConnectionCreate={handleConnectionCreate}
        />
        <div className="canvas-info">
          <p>🌟 恒星: {stars.length} 颗</p>
          <p>✨ 已观测: {observedStars.length} 颗</p>
          <p>🔗 自定义连线: {customConnections.length} 条</p>
        </div>
      </div>
      <ObservationSidebar
        logs={observationLogs}
        constellations={constellations}
        selectedConstellationId={selectedConstellationId}
        lineColor={lineColor}
        onConstellationSelect={handleConstellationSelect}
        onLineColorChange={setLineColor}
        onLogNoteChange={handleLogNoteChange}
        onLogMoodChange={handleLogMoodChange}
      />
    </div>
  );
};

export default ObservationLog;
