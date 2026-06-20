import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Circle, Square } from 'lucide-react';
import { useMoleculeStore } from '../store/moleculeStore';
import { PRESET_MOLECULES, VIBRATION_MODES } from '../data/presetMolecules';
import { parseSMILES } from '../utils/moleculeParser';
import { VibrationMode } from '../types/molecule';

declare const GIF: any;

const ControlPanel: React.FC = () => {
  const {
    currentMolecule,
    setCurrentMolecule,
    vibrationMode,
    setVibrationMode,
    vibrationAmplitude,
    setVibrationAmplitude,
    isVibrating,
    setIsVibrating,
    isRecording,
    setIsRecording,
    isPanelCollapsed,
    setIsPanelCollapsed,
    clearSelectedAtoms,
  } = useMoleculeStore();

  const [smilesInput, setSmilesInput] = useState('');
  const [exportFormat, setExportFormat] = useState<'webm' | 'gif'>('webm');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isGifLoaded, setIsGifLoaded] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const gifRef = useRef<any>(null);
  const gifFrameIntervalRef = useRef<number | null>(null);
  const gifCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js';
      script.onload = () => setIsGifLoaded(true);
      document.head.appendChild(script);
    }
  }, []);

  const handleMoleculeSelect = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const moleculeId = e.target.value;
      const molecule = PRESET_MOLECULES.find((m) => m.id === moleculeId);
      if (molecule) {
        setCurrentMolecule(molecule);
        setVibrationMode(null);
        setSmilesInput('');
      }
    },
    [setCurrentMolecule, setVibrationMode]
  );

  const handleSMILESSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (smilesInput.trim()) {
        try {
          const molecule = parseSMILES(smilesInput.trim());
          setCurrentMolecule(molecule);
          setVibrationMode(null);
        } catch (error) {
          console.error('Failed to parse SMILES:', error);
          alert('无法解析SMILES字符串，请检查输入是否正确');
        }
      }
    },
    [smilesInput, setCurrentMolecule, setVibrationMode]
  );

  const handleVibrationModeSelect = useCallback(
    (mode: VibrationMode) => {
      if (vibrationMode?.id === mode.id) {
        setVibrationMode(null);
      } else {
        setVibrationMode(mode);
      }
    },
    [vibrationMode, setVibrationMode]
  );

  const handleToggleVibration = useCallback(() => {
    if (vibrationMode) {
      setIsVibrating(!isVibrating);
    }
  }, [vibrationMode, isVibrating, setIsVibrating]);

  const handleStartRecording = useCallback(async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) {
      alert('无法找到画布元素');
      return;
    }

    try {
      if (exportFormat === 'webm') {
        const stream = canvas.captureStream(60);
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
          }
        }
        const options: MediaRecorderOptions = { mimeType };

        const mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = mediaRecorder;
        recordedChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `molecule-${Date.now()}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          recordedChunksRef.current = [];
        };

        mediaRecorder.start();
        setIsRecording(true);
        setRecordingTime(0);

        recordingTimerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        if (!isGifLoaded || typeof (window as any).GIF === 'undefined') {
          alert('GIF库正在加载中，请稍候再试');
          return;
        }

        gifCanvasRef.current = canvas;

        const gif = new (window as any).GIF({
          workers: 2,
          quality: 10,
          width: canvas.width,
          height: canvas.height,
          workerScript: 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js',
        });

        gifRef.current = gif;
        setIsRecording(true);
        setRecordingTime(0);

        let frameCount = 0;
        const captureFrame = () => {
          if (!gifCanvasRef.current || !gifRef.current) return;
          try {
            gifRef.current.addFrame(gifCanvasRef.current, { delay: 33, copy: true });
            frameCount++;
          } catch (e) {
            console.warn('Frame capture failed:', e);
          }
        };

        recordingTimerRef.current = window.setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);

        gifFrameIntervalRef.current = window.setInterval(captureFrame, 33);

        gif.on('finished', (blob: Blob) => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `molecule-${Date.now()}.gif`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`无法开始录制: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [exportFormat, setIsRecording, isGifLoaded]);

  const handleStopRecording = useCallback(() => {
    if (exportFormat === 'webm') {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        setRecordingTime(0);
      }
    } else {
      if (gifRef.current) {
        if (gifFrameIntervalRef.current) {
          clearInterval(gifFrameIntervalRef.current);
          gifFrameIntervalRef.current = null;
        }

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        setIsRecording(false);
        setRecordingTime(0);

        try {
          gifRef.current.render();
        } catch (e) {
          console.error('GIF render failed:', e);
          alert('GIF渲染失败');
        }
        gifRef.current = null;
      }
    }
  }, [exportFormat, setIsRecording]);

  const handleClearSelection = useCallback(() => {
    clearSelectedAtoms();
  }, [clearSelectedAtoms]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <div
        className={`panel-toggle ${!isPanelCollapsed ? 'panel-open' : ''}`}
        onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
      >
        {isPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </div>

      <div className={`control-panel ${isPanelCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          <h1>分子控制台</h1>
        </div>

        <div className="panel-content">
          <div className="section">
            <h2>选择分子</h2>
            <select
              value={currentMolecule?.id || ''}
              onChange={handleMoleculeSelect}
            >
              <option value="" disabled>
                选择预置分子...
              </option>
              {PRESET_MOLECULES.map((mol) => (
                <option key={mol.id} value={mol.id}>
                  {mol.name} ({mol.formula})
                </option>
              ))}
            </select>

            <form onSubmit={handleSMILESSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="输入SMILES字符串..."
                value={smilesInput}
                onChange={(e) => setSmilesInput(e.target.value)}
              />
              <button type="submit" className="btn" style={{ padding: '10px 16px' }}>
                加载
              </button>
            </form>
          </div>

          <div className="section">
            <h2>振动模式</h2>
            <div className="mode-list">
              {VIBRATION_MODES.map((mode) => (
                <div
                  key={mode.id}
                  className={`mode-item ${vibrationMode?.id === mode.id ? 'active' : ''}`}
                  onClick={() => handleVibrationModeSelect(mode)}
                >
                  <div className="mode-name">{mode.name}</div>
                  <div className="mode-desc">{mode.description}</div>
                </div>
              ))}
            </div>

            {vibrationMode && (
              <>
                <div className="slider-container">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>振动幅度</span>
                    <span className="slider-value">{Math.round(vibrationAmplitude * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={vibrationAmplitude}
                    onChange={(e) => setVibrationAmplitude(parseFloat(e.target.value))}
                  />
                </div>

                <button
                  className={`btn ${isVibrating ? 'secondary' : ''}`}
                  onClick={handleToggleVibration}
                >
                  {isVibrating ? <Pause size={18} /> : <Play size={18} />}
                  {isVibrating ? '暂停振动' : '开始振动'}
                </button>
              </>
            )}
          </div>

          <div className="section">
            <h2>录制导出</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button
                className={`btn ${exportFormat === 'webm' ? '' : 'secondary'}`}
                onClick={() => setExportFormat('webm')}
                style={{ flex: 1 }}
              >
                WebM
              </button>
              <button
                className={`btn ${exportFormat === 'gif' ? '' : 'secondary'}`}
                onClick={() => setExportFormat('gif')}
                style={{ flex: 1 }}
              >
                GIF
              </button>
            </div>

            {!isRecording ? (
              <button
                className="btn recording"
                onClick={handleStartRecording}
                disabled={!currentMolecule || (exportFormat === 'gif' && !isGifLoaded)}
              >
                <Circle size={18} fill="currentColor" />
                {exportFormat === 'gif' && !isGifLoaded ? 'GIF加载中...' : '开始录制'}
              </button>
            ) : (
              <div className="button-group">
                <button className="btn" onClick={handleStopRecording}>
                  <Square size={18} fill="currentColor" />
                  停止 ({formatTime(recordingTime)})
                </button>
              </div>
            )}

            <button className="btn secondary" onClick={handleClearSelection}>
              清除选择
            </button>
          </div>

          <div className="section">
            <h2>操作说明</h2>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8' }}>
              <p>• 拖拽旋转视角</p>
              <p>• 滚轮缩放</p>
              <p>• 点击原子查看详情</p>
              <p>• Shift+拖拽框选多个原子</p>
            </div>
          </div>
        </div>
      </div>

      {isRecording && (
        <div className="recording-indicator">
          <div className="dot" />
          <span>录制中 {formatTime(recordingTime)}</span>
        </div>
      )}
    </>
  );
};

export default ControlPanel;
