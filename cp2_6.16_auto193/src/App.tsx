import React, { useState, useEffect, useCallback, useRef } from 'react';
import WaveformDisplay from './WaveformDisplay';
import ControlPanel from './ControlPanel';
import RecordingList from './RecordingList';
import { audioEngine, type RecordingItem } from './audioEngine';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [reverb, setReverb] = useState(30);
  const [delayTime, setDelayTime] = useState(0.3);
  const [lowpassFreq, setLowpassFreq] = useState(20000);
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [originalBuffer, setOriginalBuffer] = useState<AudioBuffer | null>(null);
  const [isVisualActive, setIsVisualActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const initAudio = async () => {
      if (initializedRef.current) return;
      try {
        await audioEngine.init();
        initializedRef.current = true;
      } catch (error) {
        console.error('Failed to initialize audio engine:', error);
      }
    };

    const handleFirstInteraction = () => {
      initAudio();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      if (!initializedRef.current) {
        await audioEngine.init();
        initializedRef.current = true;
      }
      await audioEngine.startMicrophone();
      setIsRecording(true);
      setIsVisualActive(true);
      setCurrentPlayingId(null);
      audioEngine.stopPlayback();
      setIsPlaying(false);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法访问麦克风，请确保已授予麦克风权限。');
    }
  }, []);

  const handleStopRecording = useCallback(async () => {
    try {
      const recording = await audioEngine.stopRecording();
      setIsRecording(false);
      setIsVisualActive(false);
      
      if (recording) {
        setRecordings(prev => [recording, ...prev]);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      if (!initializedRef.current) {
        await audioEngine.init();
        initializedRef.current = true;
      }
      
      const buffer = await audioEngine.loadAudioFile(file);
      setOriginalBuffer(buffer);
      setCurrentFileName(file.name);
      setIsVisualActive(true);
      
      audioEngine.playAudio(buffer);
      setIsPlaying(true);
      setCurrentPlayingId(null);
      
      const ctx = audioEngine.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }
    } catch (error) {
      console.error('Failed to load audio file:', error);
      alert('无法加载音频文件，请确保文件格式正确。');
    }
  }, []);

  const handleReverbChange = useCallback((value: number) => {
    setReverb(value);
    audioEngine.setReverb(value);
  }, []);

  const handleDelayChange = useCallback((value: number) => {
    setDelayTime(value);
    audioEngine.setDelayTime(value);
  }, []);

  const handleLowpassChange = useCallback((value: number) => {
    setLowpassFreq(value);
    audioEngine.setLowpassFrequency(value);
  }, []);

  const handlePlay = useCallback(() => {
    const buffer = audioEngine.getCurrentBuffer();
    if (buffer) {
      audioEngine.playAudio(buffer);
      setIsPlaying(true);
      setIsVisualActive(true);
    }
  }, []);

  const handleStop = useCallback(() => {
    audioEngine.stopPlayback();
    setIsPlaying(false);
  }, []);

  const handlePlayRecording = useCallback((id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      audioEngine.playAudio(recording.buffer);
      setCurrentPlayingId(id);
      setIsVisualActive(true);
      setIsPlaying(true);
    }
  }, [recordings]);

  const handleStopPlayback = useCallback(() => {
    audioEngine.stopPlayback();
    setCurrentPlayingId(null);
    setIsPlaying(false);
  }, []);

  const handleDeleteRecording = useCallback((id: string) => {
    if (currentPlayingId === id) {
      audioEngine.stopPlayback();
      setCurrentPlayingId(null);
      setIsPlaying(false);
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
  }, [currentPlayingId]);

  const handleDownload = useCallback(async (recording: RecordingItem) => {
    try {
      const blob = await audioEngine.exportWav(recording.buffer);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${recording.name}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download recording:', error);
    }
  }, []);

  const leftPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
  };

  const rightPanelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    minHeight: 0,
  };

  const containerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : (isTablet ? '60% 40%' : '70% 30%'),
    gridTemplateRows: isMobile ? 'auto auto' : '1fr',
    gap: '20px',
    padding: '20px',
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#0D1117',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 600,
    color: '#E2E8F0',
    margin: 0,
  };

  return (
    <div style={containerStyle}>
      <div style={leftPanelStyle}>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={headerStyle}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <h2 style={titleStyle}>实时频谱</h2>
          </div>
          <div style={{ flex: 1, minHeight: isMobile ? '200px' : 0 }}>
            <WaveformDisplay
              audioEngine={audioEngine}
              showSpectrum={true}
              showWaveform={false}
              isActive={isVisualActive}
              backgroundColor="#0D1117"
            />
          </div>
        </div>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div style={headerStyle}>
            <span style={{ fontSize: '20px' }}>〰️</span>
            <h2 style={titleStyle}>实时波形</h2>
          </div>
          <div style={{ flex: 1, minHeight: isMobile ? '150px' : 0 }}>
            <WaveformDisplay
              audioEngine={audioEngine}
              showSpectrum={false}
              showWaveform={true}
              isActive={isVisualActive}
              waveColor="#00E5FF"
              backgroundColor="#0D1117"
            />
          </div>
        </div>
      </div>

      <div style={rightPanelStyle}>
        <ControlPanel
          isRecording={isRecording}
          isPlaying={isPlaying}
          reverb={reverb}
          delayTime={delayTime}
          lowpassFreq={lowpassFreq}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          onFileUpload={handleFileUpload}
          onReverbChange={handleReverbChange}
          onDelayChange={handleDelayChange}
          onLowpassChange={handleLowpassChange}
          onPlay={handlePlay}
          onStop={handleStop}
          currentFileName={currentFileName}
        />

        <RecordingList
          recordings={recordings}
          currentPlayingId={currentPlayingId}
          originalBuffer={originalBuffer}
          onPlayRecording={handlePlayRecording}
          onStopRecording={handleStopPlayback}
          onDeleteRecording={handleDeleteRecording}
          onDownload={handleDownload}
          audioEngine={audioEngine}
        />
      </div>
    </div>
  );
};

export default App;
