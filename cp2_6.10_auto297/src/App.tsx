import React, { useState, useCallback } from 'react';
import Canvas from './components/Canvas';
import ControlPanel from './components/ControlPanel';
import type { InstrumentType, RecordedPulse } from './types';
import { INSTRUMENT_CONFIGS } from './types';

const MAX_RECORDED_PULSES = 10;

const App: React.FC = () => {
  const [instrument, setInstrument] = useState<InstrumentType>('piano');
  const [bpm, setBpm] = useState<number>(120);
  const [currentPitch, setCurrentPitch] = useState<string>('—');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedPulses, setRecordedPulses] = useState<RecordedPulse[]>([]);
  const [playbackPulses, setPlaybackPulses] = useState<RecordedPulse[] | null>(null);
  const [resetKey, setResetKey] = useState<number>(0);

  const handlePitchChange = useCallback((pitch: string) => {
    setCurrentPitch(pitch);
  }, []);

  const handleRecordPulse = useCallback((pulse: RecordedPulse) => {
    setRecordedPulses(prev => {
      const updated = [...prev, pulse];
      if (updated.length > MAX_RECORDED_PULSES) {
        return updated.slice(updated.length - MAX_RECORDED_PULSES);
      }
      return updated;
    });
  }, []);

  const handleReset = useCallback(() => {
    setCurrentPitch('—');
    setPlaybackPulses(null);
    setResetKey(prev => prev + 1);
  }, []);

  const handleToggleRecording = useCallback(() => {
    if (!isRecording) {
      setRecordedPulses([]);
    }
    setIsRecording(prev => !prev);
  }, [isRecording]);

  const handlePlayback = useCallback(() => {
    if (recordedPulses.length > 0) {
      setPlaybackPulses(null);
      requestAnimationFrame(() => {
        setPlaybackPulses([...recordedPulses]);
      });
    }
  }, [recordedPulses]);

  const handleInstrumentChange = useCallback((newInstrument: InstrumentType) => {
    setInstrument(newInstrument);
  }, []);

  const config = INSTRUMENT_CONFIGS[instrument];

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]});
          cursor: pointer;
          box-shadow: 0 0 10px ${config.gradient[0]}80;
          transition: transform 0.2s ease;
        }
        
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]});
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px ${config.gradient[0]}80;
        }
        
        select option {
          background: #1a1a2e;
          color: white;
        }
      `}</style>

      <Canvas
        key={resetKey}
        instrument={instrument}
        bpm={bpm}
        isRecording={isRecording}
        recordedPulses={recordedPulses}
        onPitchChange={handlePitchChange}
        onRecordPulse={handleRecordPulse}
        onReset={handleReset}
        playbackPulses={playbackPulses}
      />

      <div style={{
        position: 'fixed',
        top: '24px',
        left: '24px',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            boxShadow: `0 0 20px ${config.gradient[0]}60`
          }}>
            {instrument === 'piano' ? '🎹' : instrument === 'guitar' ? '🎸' : '🥁'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{
              color: 'rgba(255,255,255,0.5)',
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              音高
            </div>
            <div style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
              background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {currentPitch}
            </div>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          padding: '12px 20px'
        }}>
          <div style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            律动回声
          </div>
          <div style={{
            color: 'white',
            fontSize: '14px',
            fontWeight: 600
          }}>
            Rhythm Echo
          </div>
        </div>
      </div>

      <ControlPanel
        instrument={instrument}
        bpm={bpm}
        isRecording={isRecording}
        recordedCount={recordedPulses.length}
        onInstrumentChange={handleInstrumentChange}
        onBpmChange={setBpm}
        onReset={handleReset}
        onToggleRecording={handleToggleRecording}
        onPlayback={handlePlayback}
      />
    </div>
  );
};

export default App;
