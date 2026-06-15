import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useRecorder } from './hooks/useRecorder';
import { useAnnotator } from './hooks/useAnnotator';
import { useSubtitles } from './hooks/useSubtitles';
import { ControlPanel } from './components/ControlPanel';
import { PreviewPlayer } from './components/PreviewPlayer';
import { SubtitleEditor } from './components/SubtitleEditor';
import { RecordingState, AnnotationTool, AnnotationColor, Annotation, SubtitleEntry } from './types';

interface AppContextType {
  recordingState: RecordingState;
  duration: number;
  videoUrl: string | null;
  audioBlob: Blob | null;
  annotations: Annotation[];
  subtitles: SubtitleEntry[];
  currentTool: AnnotationTool;
  currentColor: AnnotationColor;
  showSubtitles: boolean;
  showAnnotations: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

const App: React.FC = () => {
  const recorder = useRecorder();
  const annotator = useAnnotator();
  const subtitles = useSubtitles();

  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [textAnnotationPosition, setTextAnnotationPosition] = useState<{ x: number; y: number } | null>(null);

  const recordingCanvasRef = useRef<HTMLCanvasElement>(null);
  const countdownIntervalRef = useRef<number | null>(null);

  const handleStartRecording = useCallback(async () => {
    setCountdownNumber(3);
    let count = 3;

    countdownIntervalRef.current = window.setInterval(() => {
      count--;
      if (count > 0) {
        setCountdownNumber(count);
      } else {
        setCountdownNumber(null);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
      }
    }, 1000);

    try {
      await recorder.startRecording();
      annotator.clearAnnotations();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setCountdownNumber(null);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [recorder, annotator]);

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
    if (recordingCanvasRef.current) {
      annotator.setCanvasRef(null);
    }
  }, [recorder, annotator]);

  const handleResetRecording = useCallback(() => {
    recorder.resetRecording();
    annotator.clearAnnotations();
    subtitles.setSubtitles([]);
  }, [recorder, annotator, subtitles]);

  const handleGenerateSubtitles = useCallback(() => {
    subtitles.generateSubtitles(recorder.audioBlob, recorder.duration);
  }, [subtitles, recorder.audioBlob, recorder.duration]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (recorder.state !== RecordingState.RECORDING || annotator.currentTool === AnnotationTool.NONE) return;

    const canvas = recordingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (annotator.currentTool === AnnotationTool.TEXT) {
      setTextAnnotationPosition({ x, y });
    } else {
      annotator.startDrawing(x, y);
    }
  }, [recorder.state, annotator]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (recorder.state !== RecordingState.RECORDING || !annotator.isDrawing) return;

    const canvas = recordingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    annotator.draw(x, y);
  }, [recorder.state, annotator]);

  const handleCanvasMouseUp = useCallback(() => {
    if (recorder.state !== RecordingState.RECORDING) return;
    annotator.endDrawing(recorder.duration * 1000);
  }, [recorder.state, recorder.duration, annotator]);

  const handleAddTextAnnotation = useCallback((text: string) => {
    if (!textAnnotationPosition) return;
    annotator.addTextAnnotation(
      textAnnotationPosition.x,
      textAnnotationPosition.y,
      text,
      recorder.duration * 1000
    );
    setTextAnnotationPosition(null);
  }, [textAnnotationPosition, annotator, recorder.duration]);

  useEffect(() => {
    const handleAddText = (e: CustomEvent) => {
      handleAddTextAnnotation(e.detail.text);
    };

    window.addEventListener('addTextAnnotation', handleAddText as EventListener);
    return () => window.removeEventListener('addTextAnnotation', handleAddText as EventListener);
  }, [handleAddTextAnnotation]);

  useEffect(() => {
    if (recorder.state === RecordingState.RECORDING || recorder.state === RecordingState.PAUSED) {
      const timer = setTimeout(() => {
        if (recordingCanvasRef.current) {
          annotator.setCanvasRef(recordingCanvasRef.current);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [recorder.state, annotator]);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const contextValue: AppContextType = {
    recordingState: recorder.state,
    duration: recorder.duration,
    videoUrl: recorder.videoUrl,
    audioBlob: recorder.audioBlob,
    annotations: annotator.annotations,
    subtitles: subtitles.subtitles,
    currentTool: annotator.currentTool,
    currentColor: annotator.currentColor,
    showSubtitles,
    showAnnotations,
  };

  const isRecordingActive = recorder.state === RecordingState.RECORDING || recorder.state === RecordingState.PAUSED;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        {(recorder.state === RecordingState.RECORDING || recorder.state === RecordingState.COUNTDOWN) && (
          <canvas
            ref={recordingCanvasRef}
            className="fixed inset-0 z-30 pointer-events-auto"
            style={{
              width: '100vw',
              height: '100vh',
              cursor: annotator.currentTool !== AnnotationTool.NONE ? 'crosshair' : 'default',
            }}
            width={window.innerWidth}
            height={window.innerHeight}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
        )}

        <ControlPanel
          recordingState={recorder.state}
          duration={recorder.duration}
          currentTool={annotator.currentTool}
          currentColor={annotator.currentColor}
          onStartRecording={handleStartRecording}
          onPauseRecording={recorder.pauseRecording}
          onResumeRecording={recorder.resumeRecording}
          onStopRecording={handleStopRecording}
          onSetTool={annotator.setTool}
          onSetColor={annotator.setColor}
          onUndoAnnotation={annotator.undoAnnotation}
          onClearAnnotations={annotator.clearAnnotations}
          countdownNumber={countdownNumber}
        />

        {!isRecordingActive && (
          <div className="main-layout">
            <div className="control-section h-full flex flex-col">
              <div className="glass-panel rounded-2xl p-6 flex-1 flex flex-col">
                <div className="section-header">
                  <h1 className="section-title">录制控制</h1>
                  <p className="section-subtitle">选择区域并开始录制</p>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white text-[13px] font-medium mb-3">录制区域</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleStartRecording}
                        disabled={isRecordingActive}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-[11px] transition-colors disabled:opacity-50"
                      >
                        全屏
                      </button>
                      <button
                        onClick={handleStartRecording}
                        disabled={isRecordingActive}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-[11px] transition-colors disabled:opacity-50"
                      >
                        窗口
                      </button>
                      <button
                        onClick={handleStartRecording}
                        disabled={isRecordingActive}
                        className="py-2.5 px-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-[11px] transition-colors disabled:opacity-50"
                      >
                        区域
                      </button>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <h3 className="text-white text-[13px] font-medium mb-3">快捷键说明</h3>
                    <div className="space-y-2 text-[11px]">
                      <div className="flex justify-between text-gray-400">
                        <span>P</span>
                        <span>画笔工具</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>H</span>
                        <span>高亮工具</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>T</span>
                        <span>文字工具</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Ctrl+Z</span>
                        <span>撤销注释</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>ESC</span>
                        <span>取消工具</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-neon-blue/20 to-electric-purple/20 rounded-xl p-4 border border-electric-purple/30">
                    <h3 className="text-white text-[13px] font-medium mb-2">录制提示</h3>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      点击开始录制后，系统会进行3秒倒计时，然后开始录制屏幕内容。录制过程中可以随时添加注释和标记。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="preview-section h-full min-h-[400px]">
              <PreviewPlayer
                videoUrl={recorder.videoUrl}
                duration={recorder.duration}
                subtitles={subtitles.subtitles}
                annotations={annotator.annotations}
                getCurrentSubtitle={subtitles.getCurrentSubtitle}
                renderAnnotationsAtTime={annotator.renderAnnotationsAtTime}
                setCanvasRef={annotator.setCanvasRef}
                showSubtitles={showSubtitles}
                showAnnotations={showAnnotations}
              />
            </div>

            <div className="subtitle-section h-full">
              <SubtitleEditor
                subtitles={subtitles.subtitles}
                isGenerating={subtitles.isGenerating}
                videoUrl={recorder.videoUrl}
                duration={recorder.duration}
                onUpdateSubtitle={subtitles.updateSubtitle}
                onAdjustOffset={subtitles.adjustOffset}
                onDeleteSubtitle={subtitles.deleteSubtitle}
                onAddSubtitle={subtitles.addSubtitle}
                onExportSRT={subtitles.exportSRT}
                onExportVTT={subtitles.exportVTT}
                onGenerateSubtitles={handleGenerateSubtitles}
                showSubtitles={showSubtitles}
                onToggleSubtitles={() => setShowSubtitles(!showSubtitles)}
                showAnnotations={showAnnotations}
                onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
                onResetRecording={handleResetRecording}
              />
            </div>
          </div>
        )}

        {isRecordingActive && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-4 pointer-events-auto">
              <div
                className={`w-3 h-3 rounded-full ${
                  recorder.state === RecordingState.RECORDING
                    ? 'bg-red-500 animate-pulse'
                    : 'bg-yellow-500'
                }`}
              />
              <span className="text-white font-mono text-sm">
                {recorder.state === RecordingState.RECORDING ? '录制中' : '已暂停'}
              </span>
              <span className="text-gray-500">|</span>
              <span className="text-gray-400 text-sm">点击悬浮面板控制录制</span>
            </div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
