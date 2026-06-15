import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Square, Pencil, Highlighter, Type, Undo2, Trash2, Monitor, Maximize, Square as SquareIcon } from 'lucide-react';
import { RecordingState, AnnotationTool, AnnotationColor, COLOR_MAP } from '../types';

interface ControlPanelProps {
  recordingState: RecordingState;
  duration: number;
  currentTool: AnnotationTool;
  currentColor: AnnotationColor;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onSetTool: (tool: AnnotationTool) => void;
  onSetColor: (color: AnnotationColor) => void;
  onUndoAnnotation: () => void;
  onClearAnnotations: () => void;
  countdownNumber: number | null;
}

const COLORS: AnnotationColor[] = ['red', 'yellow', 'blue', 'green', 'white'];

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  recordingState,
  duration,
  currentTool,
  currentColor,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onSetTool,
  onSetColor,
  onUndoAnnotation,
  onClearAnnotations,
  countdownNumber,
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y)),
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (recordingState !== RecordingState.RECORDING && recordingState !== RecordingState.PAUSED) return;
      
      switch (e.key.toLowerCase()) {
        case 'p':
          onSetTool(AnnotationTool.PEN);
          break;
        case 'h':
          onSetTool(AnnotationTool.HIGHLIGHT);
          break;
        case 't':
          onSetTool(AnnotationTool.TEXT);
          setShowTextInput(true);
          setTimeout(() => textInputRef.current?.focus(), 100);
          break;
        case 'escape':
          onSetTool(AnnotationTool.NONE);
          setShowTextInput(false);
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onUndoAnnotation();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingState, onSetTool, onUndoAnnotation]);

  const handleToolClick = (tool: AnnotationTool) => {
    if (tool === AnnotationTool.TEXT) {
      setShowTextInput(true);
      setTimeout(() => textInputRef.current?.focus(), 100);
    } else {
      setShowTextInput(false);
    }
    onSetTool(currentTool === tool ? AnnotationTool.NONE : tool);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textInput.trim()) {
      const event = new CustomEvent('addTextAnnotation', { detail: { text: textInput } });
      window.dispatchEvent(event);
      setTextInput('');
      setShowTextInput(false);
      onSetTool(AnnotationTool.NONE);
    }
  };

  const isRecordingActive = recordingState === RecordingState.RECORDING || recordingState === RecordingState.PAUSED;

  return (
    <>
      {countdownNumber !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <span
            key={countdownNumber}
            className="text-[120px] font-bold text-white animate-countdown"
            style={{
              textShadow: '0 0 40px rgba(15, 52, 96, 0.8), 0 0 80px rgba(83, 52, 131, 0.6)',
            }}
          >
            {countdownNumber}
          </span>
        </div>
      )}

      <div
        ref={panelRef}
        className="fixed z-40 select-none animate-fadeIn"
        style={{
          left: position.x,
          top: position.y,
          width: '300px',
          animationDelay: '100ms',
        }}
      >
        <div
          className="glass-panel rounded-2xl overflow-hidden"
          onMouseDown={handleMouseDown}
        >
          <div className="drag-handle flex items-center justify-between px-4 py-3 cursor-move border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-electric-purple flex items-center justify-center">
                <Monitor className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold text-[14px]">ScreenCap Studio</span>
            </div>
            <div className="w-12 h-1.5 rounded-full bg-white/20" />
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-black/30 rounded-xl">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    recordingState === RecordingState.RECORDING
                      ? 'bg-red-500 animate-pulse'
                      : recordingState === RecordingState.PAUSED
                      ? 'bg-yellow-500'
                      : 'bg-gray-500'
                  }`}
                />
                <span className="text-white font-mono text-lg font-medium">
                  {formatDuration(duration)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3">
              {recordingState === RecordingState.IDLE || recordingState === RecordingState.STOPPED ? (
                <button
                  onClick={onStartRecording}
                  className="btn-gradient flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium text-[14px] transition-all duration-200 hover:btn-hover"
                >
                  <Play className="w-4 h-4" />
                  开始录制
                </button>
              ) : (
                <>
                  {recordingState === RecordingState.RECORDING ? (
                    <button
                      onClick={onPauseRecording}
                      className="btn-gradient flex items-center justify-center w-12 h-12 rounded-xl text-white transition-all duration-200 hover:btn-hover"
                    >
                      <Pause className="w-5 h-5" />
                    </button>
                  ) : recordingState === RecordingState.PAUSED ? (
                    <button
                      onClick={onResumeRecording}
                      className="btn-gradient flex items-center justify-center w-12 h-12 rounded-xl text-white transition-all duration-200 hover:btn-hover"
                    >
                      <Play className="w-5 h-5" />
                    </button>
                  ) : null}

                  <button
                    onClick={onStopRecording}
                    className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/90 text-white transition-all duration-200 hover:bg-red-500 hover:scale-105 hover:shadow-lg hover:shadow-red-500/30"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {isRecordingActive && (
              <>
                <div className="h-px bg-white/10" />

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleToolClick(AnnotationTool.PEN)}
                    className={`tool-btn ${
                      currentTool === AnnotationTool.PEN ? 'tool-btn-active' : ''
                    }`}
                    title="画笔 (P)"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToolClick(AnnotationTool.HIGHLIGHT)}
                    className={`tool-btn ${
                      currentTool === AnnotationTool.HIGHLIGHT ? 'tool-btn-active' : ''
                    }`}
                    title="高亮 (H)"
                  >
                    <Highlighter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToolClick(AnnotationTool.TEXT)}
                    className={`tool-btn ${
                      currentTool === AnnotationTool.TEXT ? 'tool-btn-active' : ''
                    }`}
                    title="文字 (T)"
                  >
                    <Type className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-white/20 mx-1" />
                  <button
                    onClick={onUndoAnnotation}
                    className="tool-btn"
                    title="撤销 (Ctrl+Z)"
                  >
                    <Undo2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClearAnnotations}
                    className="tool-btn text-red-400 hover:text-red-300"
                    title="清空"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {currentTool !== AnnotationTool.NONE && (
                  <div className="flex items-center justify-center gap-2">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => onSetColor(color)}
                        className={`w-7 h-7 rounded-full transition-all duration-200 ${
                          currentColor === color
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: COLOR_MAP[color] }}
                      />
                    ))}
                  </div>
                )}

                {showTextInput && (
                  <form onSubmit={handleTextSubmit} className="flex gap-2">
                    <input
                      ref={textInputRef}
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="输入注释文字..."
                      className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white text-[13px] placeholder-gray-500 focus:outline-none focus:border-electric-purple/50"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="btn-gradient px-4 py-2 rounded-lg text-white text-[13px] font-medium"
                    >
                      添加
                    </button>
                  </form>
                )}
              </>
            )}

            {recordingState === RecordingState.PROCESSING && (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-[13px]">
                <div className="w-4 h-4 border-2 border-electric-purple/50 border-t-electric-purple rounded-full animate-spin" />
                处理中...
              </div>
            )}
          </div>

          {isRecordingActive && (
            <div className="px-4 py-2 border-t border-white/10 text-center">
              <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500">
                <span>P 画笔</span>
                <span>H 高亮</span>
                <span>T 文字</span>
                <span>ESC 取消</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
