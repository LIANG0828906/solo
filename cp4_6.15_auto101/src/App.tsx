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
  const subtitlesHook = useSubtitles();

  const [showSubtitles, setShowSubtitles] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [pendingTextPosition, setPendingTextPosition] = useState<{ x: number; y: number } | null>(null);

  const recordingCanvasRef = useRef<HTMLCanvasElement>(null);

  const handleStartRecording = useCallback(async () => {
    try {
      annotator.clearAnnotations();
      await recorder.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [recorder, annotator]);

  const handleStopRecording = useCallback(() => {
    recorder.stopRecording();
    annotator.setCanvasRef(null);
  }, [recorder, annotator]);

  const handleResetRecording = useCallback(() => {
    recorder.resetRecording();
    annotator.clearAnnotations();
    subtitlesHook.setSubtitles([]);
  }, [recorder, annotator, subtitlesHook]);

  const handleGenerateSubtitles = useCallback(() => {
    subtitlesHook.generateSubtitles(recorder.audioBlob, recorder.duration);
  }, [subtitlesHook, recorder.audioBlob, recorder.duration]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (recorder.state !== RecordingState.RECORDING || annotator.currentTool === AnnotationTool.NONE) return;

    const canvas = recordingCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (annotator.currentTool === AnnotationTool.TEXT) {
      setPendingTextPosition({ x, y });
      setTimeout(() => {
        const text = window.prompt('请输入注释文字:');
        if (text && text.trim()) {
          annotator.addTextAnnotation(x, y, text, recorder.duration * 1000);
        }
        setPendingTextPosition(null);
      }, 50);
    } else {
      annotator.startDrawing(x, y);
    }
  }, [recorder.state, recorder.duration, annotator]);

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

  useEffect(() => {
    if (recorder.state === RecordingState.RECORDING || recorder.state === RecordingState.PAUSED || recorder.state === RecordingState.COUNTDOWN) {
      requestAnimationFrame(() => {
        if (recordingCanvasRef.current) {
          const canvas = recordingCanvasRef.current;
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          annotator.setCanvasRef(canvas);
        }
      });
    }
  }, [recorder.state, annotator]);

  const handleExportVideo = useCallback(() => {
    if (!recorder.videoUrl) return;
    const a = document.createElement('a');
    a.href = recorder.videoUrl;
    a.download = `tutorial_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [recorder.videoUrl]);

  const handleExportSRT = useCallback(() => {
    const srtContent = subtitlesHook.exportSRT();
    if (!srtContent.trim()) return;
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${Date.now()}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [subtitlesHook]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (recorder.state !== RecordingState.RECORDING && recorder.state !== RecordingState.PAUSED) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key.toLowerCase()) {
        case 'p':
          e.preventDefault();
          annotator.setTool(AnnotationTool.PEN);
          break;
        case 'h':
          e.preventDefault();
          annotator.setTool(AnnotationTool.HIGHLIGHT);
          break;
        case 't':
          e.preventDefault();
          annotator.setTool(AnnotationTool.TEXT);
          break;
        case 'escape':
          e.preventDefault();
          annotator.setTool(AnnotationTool.NONE);
          break;
        case 'z':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            annotator.undoAnnotation();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recorder.state, annotator]);

  const contextValue: AppContextType = {
    recordingState: recorder.state,
    duration: recorder.duration,
    videoUrl: recorder.videoUrl,
    audioBlob: recorder.audioBlob,
    annotations: annotator.annotations,
    subtitles: subtitlesHook.subtitles,
    currentTool: annotator.currentTool,
    currentColor: annotator.currentColor,
    showSubtitles,
    showAnnotations,
  };

  const isRecordingActive = recorder.state === RecordingState.RECORDING
    || recorder.state === RecordingState.PAUSED
    || recorder.state === RecordingState.COUNTDOWN;

  return (
    <AppContext.Provider value={contextValue}>
      <div className="app-container">
        {isRecordingActive && (
          <canvas
            ref={recordingCanvasRef}
            className="fixed inset-0 z-30 pointer-events-auto"
            style={{
              width: '100vw',
              height: '100vh',
              cursor: annotator.currentTool !== AnnotationTool.NONE ? 'crosshair' : 'default',
            }}
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
          countdownNumber={recorder.countdownNumber}
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
                        <span className="font-mono px-1.5 py-0.5 bg-white/10 rounded">P</span>
                        <span>画笔工具</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span className="font-mono px-1.5 py-0.5 bg-white/10 rounded">H</span>
                        <span>高亮工具</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span className="font-mono px-1.5 py-0.5 bg-white/10 rounded">T</span>
                        <span>文字工具</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span className="font-mono px-1.5 py-0.5 bg-white/10 rounded">Ctrl+Z</span>
                        <span>撤销注释</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span className="font-mono px-1.5 py-0.5 bg-white/10 rounded">ESC</span>
                        <span>取消工具</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-neon-blue/20 to-electric-purple/20 rounded-xl p-4 border border-electric-purple/30">
                    <h3 className="text-white text-[13px] font-medium mb-2">录制提示</h3>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      点击开始录制后，系统会进行3秒倒计时，数字从屏幕中心弹出并缩放消失，然后开始录制。录制过程中可以使用快捷键随时添加注释。
                    </p>
                  </div>

                  {recorder.videoUrl && (
                    <div className="space-y-2">
                      <button
                        onClick={handleExportVideo}
                        className="w-full btn-gradient py-3 px-4 rounded-xl text-white text-[13px] font-medium transition-all duration-200 hover:btn-hover flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        导出视频
                      </button>
                      <button
                        onClick={handleExportSRT}
                        disabled={subtitlesHook.subtitles.length === 0}
                        className="w-full py-2.5 px-4 bg-white/5 border border-white/10 rounded-xl text-white text-[12px] font-medium hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        导出 SRT 字幕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="preview-section h-full min-h-[400px]">
              <PreviewPlayer
                videoUrl={recorder.videoUrl}
                duration={recorder.duration}
                subtitles={subtitlesHook.subtitles}
                annotations={annotator.annotations}
                getCurrentSubtitle={subtitlesHook.getCurrentSubtitle}
                renderAnnotationsAtTime={annotator.renderAnnotationsAtTime}
                setCanvasRef={annotator.setCanvasRef}
                showSubtitles={showSubtitles}
                showAnnotations={showAnnotations}
              />
            </div>

            <div className="subtitle-section h-full">
              <SubtitleEditor
                subtitles={subtitlesHook.subtitles}
                isGenerating={subtitlesHook.isGenerating}
                videoUrl={recorder.videoUrl}
                duration={recorder.duration}
                onUpdateSubtitle={subtitlesHook.updateSubtitle}
                onAdjustOffset={subtitlesHook.adjustOffset}
                onDeleteSubtitle={subtitlesHook.deleteSubtitle}
                onAddSubtitle={subtitlesHook.addSubtitle}
                onExportSRT={subtitlesHook.exportSRT}
                onExportVTT={subtitlesHook.exportVTT}
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
                    : recorder.state === RecordingState.COUNTDOWN
                    ? 'bg-yellow-500 animate-pulse'
                    : 'bg-yellow-500'
                }`}
              />
              <span className="text-white font-mono text-sm">
                {recorder.state === RecordingState.RECORDING
                  ? '录制中'
                  : recorder.state === RecordingState.COUNTDOWN
                  ? '准备录制...'
                  : '已暂停'}
              </span>
              {annotator.currentTool !== AnnotationTool.NONE && (
                <>
                  <span className="text-gray-500">|</span>
                  <span className="text-electric-purple text-sm">
                    {annotator.currentTool === AnnotationTool.PEN && '画笔模式'}
                    {annotator.currentTool === AnnotationTool.HIGHLIGHT && '高亮模式'}
                    {annotator.currentTool === AnnotationTool.TEXT && '文字模式'}
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {pendingTextPosition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="text-white text-sm animate-pulse">点击屏幕输入文字...</div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
};

export default App;
