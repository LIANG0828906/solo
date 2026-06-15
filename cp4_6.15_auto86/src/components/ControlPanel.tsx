import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Download, Circle, Square } from 'lucide-react';
import { useMoleculeStore } from '../store/moleculeStore';
import { PRESET_MOLECULES, VIBRATION_MODES } from '../data/presetMolecules';
import { parseSMILES } from '../utils/moleculeParser';
import { VibrationMode } from '../types/molecule';

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('无法找到画布元素');
      return;
    }
    canvasRef.current = canvas;

    try {
      const stream = canvas.captureStream(60);
      const options: MediaRecorderOptions = {
        mimeType: exportFormat === 'webm' ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp9',
      };

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: exportFormat === 'webm' ? 'video/webm' : 'video/webm',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `molecule-${Date.now()}.${exportFormat}`;
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
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('无法开始录制，请确保浏览器支持屏幕录制功能');
    }
  }, [exportFormat, setIsRecording]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingTime(0);
    }
  }, [setIsRecording]);

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
                disabled={!currentMolecule}
              >
                <Circle size={18} fill="currentColor" />
                开始录制
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
