import React, { useState, useEffect, useCallback } from 'react';
import ParticipantPanel from './ParticipantPanel';
import SpinWheel from './SpinWheel';
import WinnerList from './WinnerList';
import './App.css';

export interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

export interface DrawRecord {
  id: string;
  name: string;
  round: number;
  time: string;
}

type SpinningPhase = 'idle' | 'spinning' | 'result';

const App: React.FC = () => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [history, setHistory] = useState<DrawRecord[]>([]);
  const [phase, setPhase] = useState<SpinningPhase>('idle');
  const [currentDisplay, setCurrentDisplay] = useState<string>('');
  const [winner, setWinner] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await fetch('/api/participants');
      const data = await res.json();
      setParticipants(data.participants);
    } catch {
      console.error('获取参与者列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleAddParticipant = useCallback(async (name: string) => {
    try {
      const res = await fetch('/api/add-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.participant) {
        setParticipants((prev) => [...prev, data.participant]);
      }
    } catch {
      console.error('添加参与者失败');
    }
  }, []);

  const handleImportList = useCallback(async (names: string[]) => {
    try {
      const res = await fetch('/api/import-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names }),
      });
      const data = await res.json();
      if (data.added) {
        setParticipants((prev) => [...prev, ...data.added]);
      }
    } catch {
      console.error('导入列表失败');
    }
  }, []);

  const handleRemoveParticipant = useCallback(async (id: string) => {
    try {
      await fetch('/api/remove-participant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      setParticipants((prev) => prev.filter((p) => p.id !== id));
    } catch {
      console.error('移除参与者失败');
    }
  }, []);

  const playDingSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // Web Audio API not available
    }
  }, []);

  const handleDrawWinner = useCallback(async () => {
    if (phase !== 'idle' || participants.length === 0) return;

    setPhase('spinning');
    setWinner(null);

    const startTime = Date.now();
    const totalDuration = 3000;
    let intervalId: ReturnType<typeof setInterval>;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);

      const eased = 1 - Math.pow(1 - progress, 4);
      const interval = 25 + eased * 300;

      const randomIndex = Math.floor(Math.random() * participants.length);
      setCurrentDisplay(participants[randomIndex].name);

      if (progress >= 1) {
        clearInterval(intervalId);
        finishDraw();
        return;
      }

      intervalId = setTimeout(animate, interval);
    };

    intervalId = setTimeout(animate, 25);

    const finishDraw = async () => {
      try {
        const res = await fetch('/api/draw', { method: 'POST' });
        const data = await res.json();
        if (data.winner) {
          setCurrentDisplay(data.winner.name);
          setWinner(data.winner);
          setParticipants((prev) => prev.filter((p) => p.id !== data.winner.id));
          setHistory((prev) => [data.record, ...prev]);
          playDingSound();
          setPhase('result');
          setTimeout(() => setPhase('idle'), 2500);
        }
      } catch {
        setPhase('idle');
      }
    };
  }, [phase, participants, playDingSound]);

  const handleReset = useCallback(async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setHistory([]);
      setWinner(null);
      setPhase('idle');
      setCurrentDisplay('');
      fetchParticipants();
    } catch {
      console.error('重置失败');
    }
  }, [fetchParticipants]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">🎉 幸运转盘</h1>
        <p className="app-subtitle">互动抽奖系统</p>
      </header>
      <div className="app-body">
        <div className="panel-left">
          <ParticipantPanel
            participants={participants}
            onAddParticipant={handleAddParticipant}
            onImportList={handleImportList}
            onRemoveParticipant={handleRemoveParticipant}
            loading={loading}
          />
        </div>
        <div className="panel-center">
          <SpinWheel
            participants={participants}
            phase={phase}
            currentDisplay={currentDisplay}
            winner={winner}
            onDrawWinner={handleDrawWinner}
          />
          <button
            className="reset-btn"
            onClick={handleReset}
            disabled={phase === 'spinning'}
          >
            🔄 重置抽奖
          </button>
        </div>
        <div className="panel-right">
          <WinnerList history={history} />
        </div>
      </div>
    </div>
  );
};

export default App;
