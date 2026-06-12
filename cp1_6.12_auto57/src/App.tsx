import React, { useState, useEffect, useCallback, useRef } from 'react';
import InstrumentBoard from './instrumentBoard';
import { recorder, type Recording } from './recorder';
import { playerApi } from './playerApi';
import { audioEngine } from './audioEngine';
import './App.css';

type TimeSignature = '4/4' | '3/4' | '6/8';

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [sharedRecordings, setSharedRecordings] = useState<Recording[]>([]);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showRhythmPanel, setShowRhythmPanel] = useState(false);
  const [timeSignature, setTimeSignature] = useState<TimeSignature>('4/4');
  const [bpm, setBpm] = useState(120);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const metronomeIntervalRef = useRef<number | null>(null);
  const beatRef = useRef(0);

  useEffect(() => {
    audioEngine.init();
  }, []);

  useEffect(() => {
    const unsubscribe = playerApi.subscribe((state) => {
      setApiLoading(state.loading);
      setApiError(state.error);
    });
    return unsubscribe;
  }, []);

  const getBeatsPerMeasure = (sig: TimeSignature): number => {
    switch (sig) {
      case '4/4': return 4;
      case '3/4': return 3;
      case '6/8': return 6;
    }
  };

  const getStrongBeats = (sig: TimeSignature): number[] => {
    switch (sig) {
      case '4/4': return [0];
      case '3/4': return [0];
      case '6/8': return [0, 3];
    }
  };

  const playMetronomeClick = useCallback((isStrong: boolean) => {
    const ctx = audioEngine.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = isStrong ? 1000 : 800;
    osc.type = 'sine';

    gain.gain.setValueAtTime(isStrong ? 0.3 : 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }, []);

  useEffect(() => {
    if (metronomeOn) {
      const beatDuration = 60000 / bpm;
      const beatsPerMeasure = getBeatsPerMeasure(timeSignature);
      const strongBeats = getStrongBeats(timeSignature);

      beatRef.current = 0;

      const tick = () => {
        const beat = beatRef.current % beatsPerMeasure;
        const isStrong = strongBeats.includes(beat);
        setCurrentBeat(beat);
        playMetronomeClick(isStrong);
        beatRef.current++;
      };

      tick();
      metronomeIntervalRef.current = window.setInterval(tick, beatDuration);
    } else {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
        metronomeIntervalRef.current = null;
      }
      setCurrentBeat(0);
    }

    return () => {
      if (metronomeIntervalRef.current) {
        clearInterval(metronomeIntervalRef.current);
      }
    };
  }, [metronomeOn, bpm, timeSignature, playMetronomeClick]);

  const handleRecordToggle = () => {
    audioEngine.resume();
    if (isRecording) {
      const recording = recorder.stopRecording();
      setIsRecording(false);
      if (recording) {
        setRecordings(prev => [recording, ...prev]);
      }
    } else {
      recorder.startRecording();
      setIsRecording(true);
    }
  };

  const handlePlayRecording = async (recording: Recording) => {
    if (isPlaying) {
      recorder.stopPlayback();
      setIsPlaying(false);
      setPlayingId(null);
      return;
    }

    setIsPlaying(true);
    setPlayingId(recording.id);

    await recorder.playRecording(recording, playbackSpeed);

    setIsPlaying(false);
    setPlayingId(null);
  };

  const handleStopPlayback = () => {
    recorder.stopPlayback();
    setIsPlaying(false);
    setPlayingId(null);
  };

  const handleTagChange = (id: string, tag: string) => {
    if (tag.length > 10) return;
    setRecordings(prev => prev.map(r =>
      r.id === id ? { ...r, tag } : r
    ));
  };

  const handleShare = async (recording: Recording) => {
    const result = await playerApi.saveRecord(recording);
    if (result.success) {
      alert('分享成功！');
      loadSharedRecordings();
    }
  };

  const loadSharedRecordings = async () => {
    const result = await playerApi.listRecords();
    if (result.success && result.recordings) {
      setSharedRecordings(result.recordings);
    }
  };

  useEffect(() => {
    if (showSharePanel) {
      loadSharedRecordings();
    }
  }, [showSharePanel]);

  const beatsPerMeasure = getBeatsPerMeasure(timeSignature);

  return (
    <div className="app">
      {metronomeOn && (
        <div className="metronome-indicator">
          <div className="time-signature">{timeSignature}</div>
          <div className="beat-dots">
            {Array.from({ length: beatsPerMeasure }).map((_, i) => (
              <div
                key={i}
                className={`beat-dot ${i === currentBeat ? 'active' : ''} ${getStrongBeats(timeSignature).includes(i) ? 'strong' : ''}`}
              />
            ))}
          </div>
          <div className="bpm-display">{bpm} BPM</div>
        </div>
      )}

      <header className="app-header">
        <h1>🎵 虚拟乐器演奏板</h1>
        <div className="header-buttons">
          <button
            className={`header-btn record-btn ${isRecording ? 'recording' : ''}`}
            onClick={handleRecordToggle}
          >
            <span className="btn-icon">●</span>
            {isRecording ? '停止录音' : '录音'}
          </button>

          <button
            className="header-btn"
            onClick={() => setShowRhythmPanel(!showRhythmPanel)}
          >
            <span className="btn-icon">🥁</span>
            节奏设置
          </button>

          <button
            className="header-btn"
            onClick={() => setShowSharePanel(!showSharePanel)}
          >
            <span className="btn-icon">📋</span>
            分享列表
          </button>
        </div>
      </header>

      <div className="main-content">
        <div className="instruments-area">
          <InstrumentBoard />

          <div className="recordings-section">
            <h3>🎙️ 我的录音</h3>
            {recordings.length === 0 ? (
              <p className="empty-hint">还没有录音，点击上方录音按钮开始创作吧！</p>
            ) : (
              <div className="recording-list">
                {recordings.map((rec) => (
                  <div key={rec.id} className="recording-card">
                    <div className="recording-info">
                      <span className="recording-name">{rec.name}</span>
                      <span className="recording-duration">
                        {rec.duration.toFixed(1)}s
                      </span>
                    </div>
                    <div className="recording-tag">
                      <input
                        type="text"
                        placeholder="添加标签..."
                        value={rec.tag}
                        onChange={(e) => handleTagChange(rec.id, e.target.value)}
                        maxLength={10}
                        className="tag-input"
                      />
                    </div>
                    <div className="recording-actions">
                      <button
                        className={`action-btn play-btn ${playingId === rec.id ? 'playing' : ''}`}
                        onClick={() => handlePlayRecording(rec)}
                      >
                        {playingId === rec.id ? '⏹' : '▶'}
                      </button>
                      <button
                        className="action-btn share-btn"
                        onClick={() => handleShare(rec)}
                      >
                        分享
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recordings.length > 0 && (
              <div className="speed-control">
                <label>回放速度: {playbackSpeed.toFixed(1)}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                  className="speed-slider"
                />
              </div>
            )}

            {isPlaying && (
              <button className="stop-btn" onClick={handleStopPlayback}>
                停止播放
              </button>
            )}
          </div>
        </div>

        {showRhythmPanel && (
          <div className="side-panel rhythm-panel">
            <h3>🎼 节奏设置</h3>
            <div className="rhythm-options">
              {(['4/4', '3/4', '6/8'] as TimeSignature[]).map((sig) => (
                <button
                  key={sig}
                  className={`rhythm-btn ${timeSignature === sig ? 'active' : ''}`}
                  onClick={() => setTimeSignature(sig)}
                >
                  {sig} 拍
                </button>
              ))}
            </div>

            <div className="bpm-control">
              <label>速度 (BPM): {bpm}</label>
              <input
                type="range"
                min="60"
                max="180"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="bpm-slider"
              />
              <div className="bpm-presets">
                <button onClick={() => setBpm(60)}>60</button>
                <button onClick={() => setBpm(90)}>90</button>
                <button onClick={() => setBpm(120)}>120</button>
                <button onClick={() => setBpm(150)}>150</button>
                <button onClick={() => setBpm(180)}>180</button>
              </div>
            </div>

            <button
              className={`metronome-toggle ${metronomeOn ? 'on' : ''}`}
              onClick={() => setMetronomeOn(!metronomeOn)}
            >
              {metronomeOn ? '关闭节拍器' : '开启节拍器'}
            </button>
          </div>
        )}

        {showSharePanel && (
          <div className="side-panel share-panel">
            <h3>🌐 分享列表</h3>
            {apiLoading && <p className="loading">加载中...</p>}
            {apiError && <p className="error">{apiError}</p>}
            {!apiLoading && sharedRecordings.length === 0 && (
              <p className="empty-hint">暂无分享的录音</p>
            )}
            <div className="shared-list">
              {sharedRecordings.map((rec) => (
                <div key={rec.id} className="shared-card">
                  <div className="shared-info">
                    <span className="shared-name">{rec.name}</span>
                    {rec.tag && <span className="shared-tag">{rec.tag}</span>}
                  </div>
                  <span className="shared-duration">{rec.duration.toFixed(1)}s</span>
                  <button
                    className="action-btn play-btn"
                    onClick={() => handlePlayRecording(rec)}
                  >
                    ▶ 播放
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {apiError && (
        <div className="error-toast" onClick={() => setApiError(null)}>
          {apiError}
        </div>
      )}
    </div>
  );
};

export default App;
