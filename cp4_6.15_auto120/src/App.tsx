import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '@/engine/AudioEngine';
import { RecorderModule } from '@/engine/RecorderModule';
import { useAudioStore } from '@/store/useAudioStore';
import InstrumentDeck from '@/components/InstrumentDeck';
import MixerControls from '@/components/MixerControls';
import WaveformVisualizer from '@/components/WaveformVisualizer';
import VirtualKeyboard from '@/components/VirtualKeyboard';

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const recorderRef = useRef<RecorderModule | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioEngine = AudioEngine.getInstance();
  const { masterVolume, tracks } = useAudioStore();

  const initAudio = useCallback(async (): Promise<void> => {
    if (isInitialized) return;
    try {
      await audioEngine.init();
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }, [audioEngine, isInitialized]);

  const handleUserInteraction = useCallback((): void => {
    if (!isInitialized) {
      initAudio();
    }
  }, [isInitialized, initAudio]);

  useEffect(() => {
    const handleClick = (): void => handleUserInteraction();
    const handleKeyDown = (): void => handleUserInteraction();

    window.addEventListener('click', handleClick, { once: true });
    window.addEventListener('keydown', handleKeyDown, { once: true });

    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUserInteraction]);

  useEffect(() => {
    if (isInitialized) {
      audioEngine.setMasterVolume(masterVolume);
    }
  }, [isInitialized, masterVolume, audioEngine]);

  useEffect(() => {
    if (isInitialized) {
      tracks.forEach((track) => {
        audioEngine.setVolume(track.id, track.enabled ? track.volume : 0);
        audioEngine.setPan(track.id, track.pan);
      });
    }
  }, [isInitialized, tracks, audioEngine]);

  const handleToggleRecording = useCallback((): void => {
    if (!isInitialized) return;

    if (isRecording) {
      if (recorderRef.current) {
        recorderRef.current.stop();
        setIsRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    } else {
      try {
        if (!recorderRef.current) {
          const destination = audioEngine.getDestination();
          recorderRef.current = new RecorderModule(destination);
        }
        recorderRef.current.start();
        setIsRecording(true);
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
    }
  }, [isInitialized, isRecording, audioEngine]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audioEngine.destroy();
    };
  }, [audioEngine]);

  return (
    <div className="app-container">
      <div className="app-layout">
        <aside className="sidebar animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <InstrumentDeck />
        </aside>

        <main className="main-content">
          <section className="visualizer-section animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <WaveformVisualizer isInitialized={isInitialized} />
          </section>

          <section className="keyboard-section animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <VirtualKeyboard isInitialized={isInitialized} />
          </section>
        </main>
      </div>

      <footer className="mixer-section animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <MixerControls
          isRecording={isRecording}
          recordingTime={recordingTime}
          onToggleRecording={handleToggleRecording}
        />
      </footer>
    </div>
  );
};

export default App;
