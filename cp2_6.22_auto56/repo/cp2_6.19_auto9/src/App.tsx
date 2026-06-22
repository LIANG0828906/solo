import { useState, useEffect, useRef, useCallback } from 'react';
import StageScene from './stage/StageScene';
import ControlPanel from './control/ControlPanel';
import Timeline from './control/Timeline';
import { KeyframeEngine } from './control/KeyframeEngine';
import {
  saveProject,
  loadProject,
  createNewProject,
  createKeyframeFromLights,
  generateRandomScheme,
} from './utils/storage';
import type { LightParams, Keyframe, LightShowProject, EasingType } from './types';
import { MAX_KEYFRAMES, createInitialLights } from './types';

function App() {
  const [lights, setLights] = useState<LightParams[]>(createInitialLights());
  const [currentLightIndex, setCurrentLightIndex] = useState(0);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const engineRef = useRef<KeyframeEngine | null>(null);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    const engine = new KeyframeEngine();
    engineRef.current = engine;

    engine.setOnUpdate((updatedLights) => {
      if (isPlayingRef.current) {
        setLights(updatedLights);
      }
    });

    const saved = loadProject();
    if (saved && saved.keyframes.length > 0) {
      setKeyframes(saved.keyframes);
      setCurrentLightIndex(saved.currentLightIndex || 0);
      engine.setKeyframes(saved.keyframes);
      setTotalDuration(engine.getTotalDuration());
      if (saved.keyframes.length > 0) {
        setLights(saved.keyframes[0].lights.map((l) => ({ ...l })));
      }
    }

    return () => {
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setKeyframes(keyframes);
      setTotalDuration(engineRef.current.getTotalDuration());
    }
  }, [keyframes]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) return;

    let animationId: number;
    const updateTime = () => {
      if (engineRef.current && isPlayingRef.current) {
        setCurrentTime(engineRef.current.getCurrentTime());
      }
      animationId = requestAnimationFrame(updateTime);
    };
    animationId = requestAnimationFrame(updateTime);

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  const handleLightChange = useCallback(
    (index: number, params: Partial<LightParams>) => {
      if (isPlaying) return;
      setLights((prev) =>
        prev.map((light, i) => (i === index ? { ...light, ...params } : light)),
      );
    },
    [isPlaying],
  );

  const handleRandomize = useCallback(() => {
    if (isPlaying) return;
    const randomLights = generateRandomScheme();
    setLights(randomLights);
  }, [isPlaying]);

  const handleAddKeyframe = useCallback(() => {
    if (keyframes.length >= MAX_KEYFRAMES) return;
    const newKeyframe = createKeyframeFromLights(lights);
    setKeyframes((prev) => [...prev, newKeyframe]);
  }, [lights, keyframes.length]);

  const handleDeleteKeyframe = useCallback((id: string) => {
    setKeyframes((prev) => prev.filter((kf) => kf.id !== id));
  }, []);

  const handleUpdateDuration = useCallback((id: string, duration: number) => {
    setKeyframes((prev) =>
      prev.map((kf) => (kf.id === id ? { ...kf, duration: Math.max(100, duration) } : kf)),
    );
  }, []);

  const handleUpdateEasing = useCallback((id: string, easing: EasingType) => {
    setKeyframes((prev) =>
      prev.map((kf) => (kf.id === id ? { ...kf, easing } : kf)),
    );
  }, []);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setKeyframes((prev) => {
      const result = [...prev];
      const [removed] = result.splice(fromIndex, 1);
      result.splice(toIndex, 0, removed);
      return result;
    });
  }, []);

  const handlePlay = useCallback(() => {
    if (keyframes.length < 2) return;
    if (engineRef.current) {
      engineRef.current.play();
      setIsPlaying(true);
    }
  }, [keyframes.length]);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(engineRef.current.getCurrentTime());
    }
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (engineRef.current) {
      engineRef.current.seek(time);
      setCurrentTime(time);
      if (!isPlaying) {
        setLights(engineRef.current.getCurrentLights());
      }
    }
  }, [isPlaying]);

  const handleSave = useCallback(() => {
    const project: LightShowProject = {
      version: '1.0.0',
      createdAt: Date.now(),
      keyframes,
      currentLightIndex,
    };
    saveProject(project);
  }, [keyframes, currentLightIndex]);

  const canAddKeyframe = keyframes.length < MAX_KEYFRAMES && !isPlaying;

  return (
    <div className="w-screen h-screen flex bg-[#1a1a2e] overflow-hidden">
      <div className="w-80 flex-shrink-0 flex flex-col bg-black/20 backdrop-blur-md border-r border-white/10 overflow-y-auto">
        <ControlPanel
          lights={lights}
          currentLightIndex={currentLightIndex}
          onLightChange={handleLightChange}
          onRandomize={handleRandomize}
          onAddKeyframe={handleAddKeyframe}
          onSave={handleSave}
          onSelectLight={setCurrentLightIndex}
          canAddKeyframe={canAddKeyframe}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 relative">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            <h1 className="text-2xl font-bold text-white/90 tracking-wider drop-shadow-lg">
              🎵 虚拟音乐节舞台灯光
            </h1>
          </div>
          <StageScene lights={lights} />
        </div>

        <div className="h-72 flex-shrink-0 bg-black/30 backdrop-blur-md border-t border-white/10 overflow-y-auto">
          <Timeline
            keyframes={keyframes}
            isPlaying={isPlaying}
            currentTime={currentTime}
            totalDuration={totalDuration}
            onPlay={handlePlay}
            onPause={handlePause}
            onDeleteKeyframe={handleDeleteKeyframe}
            onUpdateDuration={handleUpdateDuration}
            onUpdateEasing={handleUpdateEasing}
            onReorder={handleReorder}
            onSeek={handleSeek}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
