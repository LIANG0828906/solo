import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Play, Pause, Volume2, VolumeX, Gauge } from 'lucide-react';

export interface AudioPlayerProps {
  audioUrl: string;
  onTimeChange?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export interface AudioPlayerRef {
  currentTime: number;
  isPlaying: boolean;
  seekTo: (seconds: number) => void;
}

const SPEEDS = [0.75, 1, 1.5, 2];

const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(
  ({ audioUrl, onTimeChange, onPlayStateChange }, ref) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animRef = useRef<number>(0);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.8);
    const [isMuted, setIsMuted] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isDragging, setIsDragging] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useImperativeHandle(ref, () => ({
      currentTime,
      isPlaying,
      seekTo: (seconds: number) => {
        if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
      },
    }));

    useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const initAudioContext = useCallback(() => {
      if (!audioRef.current || audioCtxRef.current) return;
      const Win = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextCtor = Win.AudioContext || Win.webkitAudioContext;
      if (!AudioContextCtor) return;
      const audioContext = new AudioContextCtor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = isMobile ? 64 : 256;
      const source = audioContext.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      audioCtxRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
    }, [isMobile]);

    const getProgressColor = (progress: number): string => {
      const r = Math.round(78 + 30 * progress);
      const g = Math.round(205 - 106 * progress);
      const b = Math.round(196 + 59 * progress);
      return `rgb(${r}, ${g}, ${b})`;
    };

    const drawWaveform = useCallback(() => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const progress = duration > 0 ? currentTime / duration : 0;
      const color = getProgressColor(progress);

      const draw = () => {
        animRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = isMobile ? canvas.width / bufferLength : (canvas.width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, color + '60');
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      };
      draw();
    }, [currentTime, duration, isMobile]);

    useEffect(() => {
      if (isPlaying) drawWaveform();
      else cancelAnimationFrame(animRef.current);
      return () => cancelAnimationFrame(animRef.current);
    }, [isPlaying, drawWaveform]);

    const togglePlay = () => {
      if (!audioRef.current) return;
      if (!audioCtxRef.current) initAudioContext();
      if (audioCtxRef.current?.state === 'suspended') audioCtxRef.current.resume();
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    };

    const handleTimeUpdate = () => {
      if (!audioRef.current || isDragging) return;
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onTimeChange?.(time, duration);
    };

    const setProgress = (clientX: number, target: HTMLElement) => {
      if (!audioRef.current || !duration) return;
      const rect = target.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = percent * duration;
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      setIsDragging(true);
      setProgress(e.clientX, e.currentTarget);
      const handleMove = (e: MouseEvent) => setProgress(e.clientX, e.currentTarget);
      const handleUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setVolume(val);
      if (audioRef.current) audioRef.current.volume = val;
      setIsMuted(val === 0);
    };

    const toggleMute = () => {
      if (!audioRef.current) return;
      const newMuted = !isMuted;
      setIsMuted(newMuted);
      audioRef.current.muted = newMuted;
      if (!newMuted && volume === 0) {
        setVolume(0.5);
        audioRef.current.volume = 0.5;
      }
    };

    const toggleSpeed = () => {
      const nextSpeed = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
      setSpeed(nextSpeed);
      if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
    };

    const formatTime = (time: number): string => {
      if (!isFinite(time)) return '0:00';
      const m = Math.floor(time / 60);
      const s = Math.floor(time % 60);
      return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
    const volPercent = isMuted ? 0 : volume * 100;

    return (
      <div className="bg-background-darker rounded-[10px] p-4 md:p-6" style={{ boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)' }}>
        <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={() => { if (audioRef.current) setDuration(audioRef.current.duration); }} onPlay={() => { setIsPlaying(true); onPlayStateChange?.(true); }} onPause={() => { setIsPlaying(false); onPlayStateChange?.(false); }} preload="metadata" />

        <div className="relative w-full h-20 md:h-28 mb-4 rounded-lg overflow-hidden bg-background-dark">
          <canvas ref={canvasRef} width={800} height={120} className="w-full h-full" />
        </div>

        <div className="relative h-2 bg-background-dark rounded-full cursor-pointer mb-3" onMouseDown={handleMouseDown}>
          <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${progressPercent}%`, background: 'linear-gradient(to right, #4ECDC4, #6C63FF)' }} />
          <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-grab" style={{ left: `calc(${progressPercent}% - 8px)` }} />
        </div>

        <div className="flex justify-between text-sm text-text-light/70 mb-4">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <button onClick={togglePlay} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white hover:opacity-90 transition-opacity flex-shrink-0">
            <div style={{ animation: isPlaying ? 'spin 3s linear infinite' : 'none' }}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </div>
          </button>

          <div className="flex items-center gap-2 flex-1 max-w-[140px]">
            <button onClick={toggleMute} className="text-text-light/70 hover:text-white transition-colors">
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="flex-1 h-1 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #6C63FF 0%, #6C63FF ${volPercent}%, #2a2a3e ${volPercent}%, #2a2a3e 100%)` }} />
          </div>

          <button onClick={toggleSpeed} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-background-dark text-text-light/80 text-sm hover:bg-background-dark/80 transition-colors flex-shrink-0">
            <Gauge size={16} />
            <span className="font-medium">{speed}x</span>
          </button>
        </div>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 12px; height: 12px; border-radius: 50%; background: white; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
          input[type="range"]::-moz-range-thumb { width: 12px; height: 12px; border-radius: 50%; background: white; cursor: pointer; border: none; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
        `}</style>
      </div>
    );
  }
);

AudioPlayer.displayName = 'AudioPlayer';
export default AudioPlayer;
