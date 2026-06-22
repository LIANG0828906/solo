import { useState, useRef, useCallback } from 'react';
import { Settings, Maximize, Upload, Music, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import useVisualizerStore from '@/store/useVisualizerStore';
import { cn } from '@/lib/utils';
import Timeline from './Timeline';
import ThemeSelector from './ThemeSelector';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  unit?: string;
  gradient?: string;
}

function Slider({ label, value, min, max, step, onChange, unit = '', gradient = 'from-cyan-500 to-purple-500' }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">{label}</span>
        <span className="text-xs text-white/80 font-mono">
          {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
          {unit}
        </span>
      </div>
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('absolute top-0 left-0 h-full bg-gradient-to-r rounded-full', gradient)}
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (color: string) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/60">{label}</span>
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white/20 bg-transparent"
        />
      </div>
    </div>
  );
}

export default function ControlPanel() {
  const {
    audioFile,
    spectrumData,
    isUploading,
    uploadProgress,
    particleCount,
    particleSize,
    particleColorStart,
    particleColorEnd,
    rotationSpeed,
    clusteringAmount,
    setAudioFile,
    setSpectrumData,
    setParticleCount,
    setParticleSize,
    setParticleColorStart,
    setParticleColorEnd,
    setRotationSpeed,
    setClusteringAmount,
    setUploading,
    setUploadProgress,
  } = useVisualizerStore();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setAudioFile(file);
      setUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/audio/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('上传失败');
        }

        const data = await response.json();
        setSpectrumData(data.data);
        setUploadProgress(100);
      } catch (error) {
        console.error('上传失败:', error);
      } finally {
        setUploading(false);
      }
    },
    [setAudioFile, setSpectrumData, setUploading, setUploadProgress]
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const duration = spectrumData?.duration || 0;

  return (
    <>
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-80 flex flex-col backdrop-blur-xl bg-white/5 border-l border-white/10 z-50 transition-all duration-300',
          'md:relative md:w-80 md:h-screen',
          'max-md:fixed max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:top-auto max-md:w-full max-md:border-l-0 max-md:border-t max-md:h-auto',
          isCollapsed && 'max-md:h-16'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h1 className="text-lg font-bold text-white">音乐幻视</h1>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Settings size={18} />
            </button>
            <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
              <Maximize size={18} />
            </button>
          </div>
        </div>

        <div
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4',
            'max-md:hidden',
            !isCollapsed && 'max-md:block max-md:max-h-96'
          )}
        >
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h3 className="text-sm font-medium text-white/80">上传音频</h3>

            <input
              ref={fileInputRef}
              type="file"
              accept=".wav,.mp3,audio/wav,audio/mp3,audio/mpeg"
              onChange={handleFileSelect}
              className="hidden"
            />

            {!audioFile && !isUploading && (
              <button
                onClick={handleUploadClick}
                className="w-full py-6 rounded-lg border-2 border-dashed border-white/20 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all flex flex-col items-center gap-2 group"
              >
                <Upload size={24} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  点击上传 WAV / MP3
                </span>
              </button>
            )}

            {isUploading && (
              <div className="flex items-center gap-3 py-2">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={`${uploadProgress} 100`}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-white/60">{Math.round(uploadProgress)}%</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{audioFile?.name}</p>
                  <p className="text-xs text-white/40">上传中...</p>
                </div>
              </div>
            )}

            {audioFile && !isUploading && (
              <div className="flex items-center gap-3 py-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
                  <Music size={18} className="text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/80 truncate">{audioFile.name}</p>
                  {spectrumData && (
                    <div className="flex items-center gap-1 text-xs text-white/40">
                      <Clock size={12} />
                      <span>{formatTime(duration)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
            <h3 className="text-sm font-medium text-white/80">参数设置</h3>

            <Slider
              label="粒子数量"
              value={particleCount}
              min={500}
              max={5000}
              step={100}
              onChange={setParticleCount}
              gradient="from-cyan-500 to-cyan-300"
            />

            <Slider
              label="粒子大小"
              value={particleSize}
              min={0.5}
              max={3.0}
              step={0.1}
              onChange={setParticleSize}
              gradient="from-purple-500 to-pink-400"
            />

            <div className="space-y-2 pt-2">
              <span className="text-xs text-white/60">颜色渐变</span>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <ColorPicker label="起始色" value={particleColorStart} onChange={setParticleColorStart} />
                </div>
                <div className="w-8 h-0.5 bg-gradient-to-r from-white/20 to-white/20" />
                <div className="flex-1">
                  <ColorPicker label="结束色" value={particleColorEnd} onChange={setParticleColorEnd} />
                </div>
              </div>
            </div>

            <Slider
              label="旋转速度"
              value={rotationSpeed}
              min={0}
              max={3}
              step={0.1}
              onChange={setRotationSpeed}
              gradient="from-emerald-500 to-teal-400"
            />

            <Slider
              label="聚集程度"
              value={clusteringAmount}
              min={0}
              max={1}
              step={0.05}
              onChange={setClusteringAmount}
              gradient="from-amber-500 to-orange-400"
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
            <h3 className="text-sm font-medium text-white/80">预设风格</h3>
            <ThemeSelector />
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <Timeline />
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden max-md:flex items-center justify-center w-full py-2 border-t border-white/10 text-white/60 hover:text-white/80 transition-colors"
        >
          {isCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <div
        className={cn(
          'md:hidden fixed bottom-16 left-0 right-0 h-12 z-40 pointer-events-none',
          isCollapsed && 'bottom-0'
        )}
      />
    </>
  );
}
