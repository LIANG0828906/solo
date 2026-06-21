import { useState, useEffect, useCallback, useRef } from 'react';
import Panel from './components/Panel';
import Timer from './components/Timer';
import Summary from './components/Summary';
import type { Stage, SpeechRecord } from './types';
import { v4 as uuidv4 } from 'uuid';

type ViewMode = 'panel' | 'timer' | 'summary';

function App() {
  const [view, setView] = useState<ViewMode>('panel');
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [completedStages, setCompletedStages] = useState<{ id: string; actualDuration: number }[]>([]);
  const [speechRecord, setSpeechRecord] = useState<SpeechRecord | null>(null);
  const [totalWordCount, setTotalWordCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; stages: Stage[] }[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTickSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio not available');
    }
  }, [getAudioContext]);

  const playStageCompleteSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const freqs = [523.25, 659.25, 783.99];
      freqs.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        const start = ctx.currentTime + i * 0.1;
        gainNode.gain.setValueAtTime(0.15, start);
        gainNode.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        oscillator.start(start);
        oscillator.stop(start + 0.2);
      });
    } catch (e) {
      console.warn('Audio not available');
    }
  }, [getAudioContext]);

  useEffect(() => {
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => setTemplates(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (stages.length === 0 && templates.length > 0) {
      setStages(templates[0].stages);
    }
  }, [templates, stages.length]);

  const handleStartSpeech = () => {
    if (stages.length === 0) {
      alert('请至少添加一个演讲阶段');
      return;
    }
    setCurrentStageIndex(0);
    setCompletedStages([]);
    setView('timer');
  };

  const handleStageComplete = useCallback(
    (stageIndex: number, actualDuration: number) => {
      const stage = stages[stageIndex];
      if (stage) {
        setCompletedStages((prev) => [
          ...prev,
          { id: stage.id, actualDuration: Math.round(actualDuration) },
        ]);
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        playStageCompleteSound();
      }
      if (stageIndex < stages.length - 1) {
        setCurrentStageIndex(stageIndex + 1);
      }
    },
    [stages, playStageCompleteSound]
  );

  const handleSpeechComplete = (totalDuration: number) => {
    const stageResults = stages.map((stage) => {
      const completed = completedStages.find((c) => c.id === stage.id);
      const actual = completed
        ? completed.actualDuration
        : stage.id === stages[currentStageIndex]?.id
        ? totalDuration -
          completedStages.reduce((sum, c) => sum + c.actualDuration, 0)
        : 0;
      return {
        ...stage,
        actualDuration: Math.max(0, Math.round(actual)),
      };
    });

    const record: SpeechRecord = {
      id: uuidv4(),
      date: new Date().toISOString(),
      totalDuration: Math.round(totalDuration),
      totalWordCount,
      stages: stageResults,
    };

    fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    }).catch(() => {});

    setSpeechRecord(record);
    setView('summary');
  };

  const handleReturnToPanel = () => {
    setView('panel');
    setSpeechRecord(null);
    setCompletedStages([]);
    setCurrentStageIndex(0);
  };

  return (
    <div className="app-root">
      {view === 'panel' && (
        <Panel
          stages={stages}
          setStages={setStages}
          onStart={handleStartSpeech}
          totalWordCount={totalWordCount}
          setTotalWordCount={setTotalWordCount}
          templates={templates}
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
        />
      )}
      {view === 'timer' && (
        <Timer
          stages={stages}
          currentStageIndex={currentStageIndex}
          completedStages={completedStages}
          onStageComplete={handleStageComplete}
          onSpeechComplete={handleSpeechComplete}
          onReturn={handleReturnToPanel}
          playTick={playTickSound}
        />
      )}
      {view === 'summary' && speechRecord && (
        <Summary record={speechRecord} onReturn={handleReturnToPanel} />
      )}
    </div>
  );
}

export default App;
