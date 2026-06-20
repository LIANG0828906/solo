import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, Upload, Zap } from 'lucide-react';
import { formatTime } from '@/utils/audioUtils';
import type { Annotation } from '@/store';

const ANNOTATION_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

interface AudioPlayerProps {
  audioUrl: string | null;
  audioDuration: number;
  annotations: Annotation[];
  onUpload: (file: File) => void;
  onAddAnnotation: (time: number, text: string, color: string) => void;
  onUpdateAnnotation: (id: string, time: number) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function AudioPlayer({
  audioUrl,
  audioDuration,
  annotations,
  onUpload,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(audioDuration);
  const [volume, setVolume] = useState(1);
  const [showAnnotationInput, setShowAnnotationInput] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [draggingAnnotation, setDraggingAnnotation] = useState<string | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [continuousPauseTime, setContinuousPauseTime] = useState<number | null>(null);
  const continuousInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const submitAnnotation = useCallback((time: number, text: string) => {
    if (!text.trim()) return;
    const color = ANNOTATION_COLORS[Math.floor(Math.random() * ANNOTATION_COLORS.length)];
    onAddAnnotation(time, text.trim(), color);
  }, [onAddAnnotation]);

  const resumePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.play();
      setIsPlaying(true);
    }
  }, []);

  const handleContinuousMark = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;
    audio.pause();
    setIsPlaying(false);
    const time = audio.currentTime;
    setContinuousPauseTime(time);
    setShowAnnotationInput(true);
    setAnnotationText('');
    setTimeout(() => continuousInputRef.current?.focus(), 50);
  }, [audioUrl]);

  const handleContinuousSubmit = useCallback(() => {
    if (!annotationText.trim()) return;
    const time = continuousPauseTime ?? currentTime;
    submitAnnotation(time, annotationText);
    setAnnotationText('');
    setShowAnnotationInput(false);
    setContinuousPauseTime(null);
    if (continuousMode) {
      resumePlayback();
    }
  }, [annotationText, continuousPauseTime, currentTime, submitAnnotation, continuousMode, resumePlayback]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        if (continuousMode) {
          handleContinuousMark();
        } else {
          if (!audioUrl) return;
          setShowAnnotationInput(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [continuousMode, handleContinuousMark, audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (audio && duration) {
      audio.currentTime = ratio * duration;
      setCurrentTime(audio.currentTime);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const handleNormalAddAnnotation = () => {
    if (!audioUrl) return;
    setShowAnnotationInput(true);
    setContinuousPauseTime(currentTime);
  };

  const handleNormalSubmit = () => {
    if (!annotationText.trim()) return;
    const time = continuousPauseTime ?? currentTime;
    submitAnnotation(time, annotationText);
    setAnnotationText('');
    setShowAnnotationInput(false);
    setContinuousPauseTime(null);
  };

  const handleCancelAnnotation = () => {
    setAnnotationText('');
    setShowAnnotationInput(false);
    setContinuousPauseTime(null);
  };

  const handleAnnotationDrag = (e: React.MouseEvent, annotationId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingAnnotation(annotationId);

    const handleMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current || !duration) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (moveEvent.clientX - rect.left) / rect.width));
      const newTime = ratio * duration;
      onUpdateAnnotation(annotationId, newTime);
    };

    const handleUp = () => {
      setDraggingAnnotation(null);
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  if (!audioUrl) {
    return (
      <div className="card-base">
        <label className="flex flex-col items-center gap-3 py-8 cursor-pointer btn-press rounded-lg border-2 border-dashed border-slate-200 hover:border-accent/50">
          <Upload size={32} className="text-slate-300" />
          <span className="text-sm text-slate-400">上传音频文件 (MP3)</span>
          <input
            type="file"
            accept=".mp3,audio/mpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
          />
        </label>
      </div>
    );
  }

  const sortedAnnotations = [...annotations].sort((a, b) => a.time - b.time);
  const activeAnnotationTime = continuousPauseTime ?? currentTime;

  return (
    <div className="card-base space-y-4">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      <div className="relative" ref={timelineRef}>
        {annotations.length > 0 && (
          <div className="relative h-6 mb-1">
            {sortedAnnotations.map((ann) => {
              const left = duration ? (ann.time / duration) * 100 : 0;
              return (
                <div
                  key={ann.id}
                  className="annotation-pin absolute -translate-x-1/2"
                  style={{ left: `${left}%`, top: '2px' }}
                  onMouseDown={(e) => handleAnnotationDrag(e, ann.id)}
                  title={`${formatTime(ann.time)} - ${ann.text}`}
                >
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                    <path d="M8 20L2 10C0.5 7.5 1 3 4 1.5C7 0 10 0.5 12 2.5C14 4.5 14.5 7.5 13 10L8 20Z" fill={ann.color} />
                    <circle cx="8" cy="8" r="3" fill="white" fillOpacity="0.6" />
                  </svg>
                </div>
              );
            })}
          </div>
        )}

        <div className="timeline-track" onClick={handleSeek}>
          <div
            className="timeline-progress"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow border-2 border-accent"
            style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={togglePlay} className="btn-press w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center flex-shrink-0">
          {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </button>

        <span className="text-xs text-slate-400 font-mono min-w-[90px]">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex items-center gap-2">
          <Volume2 size={14} className="text-slate-400" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => setContinuousMode(!continuousMode)}
            className={`btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              continuousMode
                ? 'bg-accent/10 text-accent ring-1 ring-accent/30'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
            title={continuousMode ? '连续标注模式已开启：Ctrl+M 自动暂停标注后恢复播放' : '开启连续标注模式'}
          >
            <Zap size={12} />
            连续标注
          </button>

          {continuousMode ? (
            <button
              onClick={handleContinuousMark}
              className="btn-press px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium"
            >
              标记此处
            </button>
          ) : (
            <button
              onClick={handleNormalAddAnnotation}
              className="btn-press px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200"
            >
              添加标注
            </button>
          )}
        </div>
      </div>

      {continuousMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-accent/5 rounded-lg border border-accent/10">
          <Zap size={12} className="text-accent" />
          <span className="text-xs text-accent/70">连续标注模式：点击「标记此处」或按 Ctrl+M 暂停并添加标注，回车保存后自动继续播放</span>
        </div>
      )}

      {showAnnotationInput && (
        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg animate-fade-in">
          <span className="text-xs text-accent font-mono font-medium">{formatTime(activeAnnotationTime)}</span>
          <input
            ref={continuousInputRef}
            type="text"
            value={annotationText}
            onChange={(e) => setAnnotationText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (continuousMode) {
                  handleContinuousSubmit();
                } else {
                  handleNormalSubmit();
                }
              }
              if (e.key === 'Escape') handleCancelAnnotation();
            }}
            placeholder={continuousMode ? '输入标注，回车保存并继续播放...' : '输入标注内容...'}
            className="flex-1 px-3 py-1.5 rounded-md border border-slate-200 text-sm focus:outline-none focus:border-accent"
            autoFocus
          />
          <button
            onClick={continuousMode ? handleContinuousSubmit : handleNormalSubmit}
            className="btn-press px-3 py-1.5 rounded-md bg-accent text-white text-xs font-medium"
          >
            {continuousMode ? '保存并播放' : '确认'}
          </button>
          <button
            onClick={handleCancelAnnotation}
            className="btn-press px-3 py-1.5 rounded-md bg-slate-200 text-slate-500 text-xs font-medium"
          >
            取消
          </button>
        </div>
      )}

      {sortedAnnotations.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {sortedAnnotations.map((ann) => (
            <div
              key={ann.id}
              className={`flex items-center gap-3 p-2 rounded-lg bg-slate-50 text-sm ${
                draggingAnnotation === ann.id ? 'ring-2 ring-accent' : ''
              }`}
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: ann.color }}
              />
              <span className="text-xs font-mono text-slate-400">{formatTime(ann.time)}</span>
              <span className="flex-1 text-slate-600">{ann.text}</span>
              <button
                onClick={() => onDeleteAnnotation(ann.id)}
                className="btn-press text-slate-300 hover:text-red-400 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
