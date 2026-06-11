import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PianoRollEngine, Note, PX_PER_BEAT, LABEL_WIDTH, ROLL_CANVAS_WIDTH } from './pianoRoll';
import { AudioEngine } from './audio/audioEngine';
import { encodeMIDI, uint8ToBase64, downloadMIDI } from './midi/midiEncoder';
import { startNoteRain, createRipple } from './utils/animation';

const MIN_BPM = 60;
const MAX_BPM = 180;
const DEFAULT_BPM = 120;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [bpm, setBpm] = useState<number>(DEFAULT_BPM);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showRollAnimation, setShowRollAnimation] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rollWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pianoRollRef = useRef<PianoRollEngine | null>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const lastAutoScrollRef = useRef<number>(0);

  useEffect(() => {
    if (canvasRef.current && !pianoRollRef.current) {
      const engine = new PianoRollEngine(canvasRef.current);
      engine.setCallbacks({
        onAddNote: (note) => {
          setNotes(prev => [...prev, note]);
        },
        onUpdateNote: (updatedNote) => {
          setNotes(prev => prev.map(n => n.id === updatedNote.id ? { ...n, ...updatedNote } : n));
        },
        onDeleteNote: (id) => {
          setNotes(prev => prev.filter(n => n.id !== id));
        },
        onSelectionChange: (_ids) => {}
      });
      pianoRollRef.current = engine;
      canvasRef.current.width = ROLL_CANVAS_WIDTH;
      engine.render();
    }

    if (!audioEngineRef.current) {
      const audio = new AudioEngine();
      audio.setCallbacks({
        onProgress: (time) => {
          setCurrentTime(time);
          if (pianoRollRef.current && rollWrapperRef.current) {
            const playX = LABEL_WIDTH + time * PX_PER_BEAT - pianoRollRef.current.getScrollX();
            const wrapperWidth = rollWrapperRef.current.clientWidth;
            if (playX > wrapperWidth * 0.7 || playX < LABEL_WIDTH + 50) {
              const now = performance.now();
              if (now - lastAutoScrollRef.current > 100) {
                lastAutoScrollRef.current = now;
                const targetScroll = Math.max(0, time * PX_PER_BEAT - wrapperWidth * 0.4);
                pianoRollRef.current.setScrollX(targetScroll);
                rollWrapperRef.current.scrollLeft = targetScroll;
              }
            }
            pianoRollRef.current.setCurrentTime(time);
          }
        },
        onNotePlay: (noteId, playing) => {
          setNotes(prev => prev.map(n => n.id === noteId ? { ...n, playing } : n));
        },
        onStop: () => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (pianoRollRef.current) {
            pianoRollRef.current.setCurrentTime(0);
          }
        }
      });
      audioEngineRef.current = audio;
    }

    return () => {
      pianoRollRef.current?.destroy();
      audioEngineRef.current?.destroy();
    };
  }, []);

  useEffect(() => {
    if (pianoRollRef.current) {
      pianoRollRef.current.setNotes(notes);
    }
    if (audioEngineRef.current) {
      audioEngineRef.current.setNotes(notes);
    }
  }, [notes]);

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setBPM(bpm);
    }
  }, [bpm]);

  const showStatus = useCallback((type: 'success' | 'error' | 'info', text: string, duration: number = 3000) => {
    setStatusMessage({ type, text });
    if (duration > 0) {
      setTimeout(() => setStatusMessage(null), duration);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      showStatus('error', '不支持的文件格式，请上传 PDF、PNG 或 JPG 文件');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showStatus('error', '文件大小超过限制（最大5MB）');
      return false;
    }
    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    setUploadedFile(file);
    setIsProcessing(true);
    setUploadProgress(10);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(30);
      showStatus('info', '正在识别乐谱，请稍候...', 0);

      await new Promise(resolve => setTimeout(resolve, 300));
      setUploadProgress(50);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      setUploadProgress(80);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || '识别失败');
      }

      setNotes(result.notes);
      setUploadProgress(100);
      setShowRollAnimation(true);
      setTimeout(() => setShowRollAnimation(false), 500);

      const confidencePercent = (result.confidence * 100).toFixed(1);
      showStatus('success', `识别完成！共识别 ${result.notes.length} 个音符，置信度 ${confidencePercent}%`);

    } catch (error) {
      showStatus('error', error instanceof Error ? error.message : '上传识别失败');
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handlePlayPause = (e: React.MouseEvent) => {
    createRipple(e);
    if (!audioEngineRef.current) return;
    audioEngineRef.current.init();

    if (isPlaying) {
      audioEngineRef.current.pause();
      setIsPlaying(false);
    } else {
      audioEngineRef.current.setNotes(notes);
      audioEngineRef.current.play(currentTime);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioEngineRef.current) {
      audioEngineRef.current.stop();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    if (pianoRollRef.current) {
      pianoRollRef.current.setCurrentTime(0);
      pianoRollRef.current.setScrollX(0);
    }
    if (rollWrapperRef.current) {
      rollWrapperRef.current.scrollLeft = 0;
    }
  };

  const handleExportMIDI = async (e: React.MouseEvent) => {
    createRipple(e);
    if (notes.length === 0) {
      showStatus('error', '没有可导出的音符数据');
      return;
    }

    setIsExporting(true);
    try {
      const midiData = encodeMIDI(notes, bpm);
      const base64Data = uint8ToBase64(midiData);
      const filename = `sheet-music-${Date.now()}.mid`;
      downloadMIDI(base64Data, filename);

      startNoteRain(document.body, 2000);
      showStatus('success', `MIDI文件已导出！共 ${notes.length} 个音符`);
    } catch (error) {
      console.error('Export error:', error);
      showStatus('error', 'MIDI导出失败');
    } finally {
      setIsExporting(false);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    createRipple(e);
    fileInputRef.current?.click();
  };

  const canvasHeight = pianoRollRef.current?.getCanvasHeight() || 400;
  const totalWidth = Math.max(ROLL_CANVAS_WIDTH, LABEL_WIDTH + Math.max(...notes.map(n => n.start + n.duration), 8) * PX_PER_BEAT + 100);

  return (
    <div className="app-container">
      <div className="toolbar">
        <div className="toolbar-title">
          🎵 乐谱<span>智能识别</span>编辑器
        </div>

        <button
          className="btn btn-primary"
          onClick={triggerUpload}
          disabled={isProcessing}
        >
          📁 上传乐谱
        </button>

        <button
          className="btn"
          onClick={handlePlayPause}
          disabled={notes.length === 0}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>

        <button
          className="btn"
          onClick={handleStop}
          disabled={!isPlaying && currentTime === 0}
        >
          ⏹ 停止
        </button>

        <div className="bpm-control">
          <span className="bpm-label">BPM</span>
          <input
            type="range"
            className="bpm-slider"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            disabled={isPlaying}
          />
          <span className="bpm-value">{bpm}</span>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleExportMIDI}
          disabled={notes.length === 0 || isExporting}
        >
          {isExporting ? '导出中...' : '💾 导出MIDI'}
        </button>
      </div>

      <div className="main-content">
        <div className="upload-panel">
          <div className="panel-title">乐谱上传</div>

          <div
            className={`drop-zone ${isDragOver ? 'dragover' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="drop-zone-icon">🎼</div>
            <div className="drop-zone-text">
              <strong>点击</strong> 或 <strong>拖拽</strong> 文件到此处
              <br />
              支持 PDF、PNG、JPG 格式
              <br />
              单文件不超过 5MB
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden-input"
            accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
            onChange={handleFileSelect}
          />

          {uploadedFile && (
            <div className="file-info">
              <div className="file-info-name">{uploadedFile.name}</div>
              <div className="file-info-size">{formatFileSize(uploadedFile.size)}</div>
            </div>
          )}

          {isProcessing && (
            <div className="progress-container">
              <div className="progress-label">
                <span>识别进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {statusMessage && (
            <div className={`status-message ${statusMessage.type}`}>
              {statusMessage.text}
            </div>
          )}

          <div className="panel-title" style={{ marginTop: '10px' }}>操作说明</div>
          <div className="hint-text" style={{ lineHeight: 1.8 }}>
            • 点击空白处添加音符<br />
            • 拖拽音符移动位置<br />
            • 拖拽右边缘调整时值<br />
            • 右键点击删除音符<br />
            • Ctrl+拖拽 框选多个音符
          </div>
        </div>

        <div className="piano-roll-container">
          <div className="piano-roll-header">
            <div className="note-count">
              当前音符数：<strong>{notes.length}</strong>
              {notes.length > 0 && ` | 播放位置：${currentTime.toFixed(2)} 拍`}
            </div>
            <div className="hint-text">
              音高范围：C4-C5（13个半音）
            </div>
          </div>
          <div className="piano-roll-wrapper" ref={rollWrapperRef}>
            <div
              className={showRollAnimation ? 'roll-enter' : ''}
              style={{ width: totalWidth }}
            >
              <canvas
                ref={canvasRef}
                className="piano-roll-canvas"
                width={totalWidth}
                height={canvasHeight}
                style={{ width: totalWidth, height: canvasHeight }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
