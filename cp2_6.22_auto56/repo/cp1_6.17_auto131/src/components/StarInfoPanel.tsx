import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, X, Sun, Thermometer, Ruler, CircleDot, Sparkles, TrendingUp } from 'lucide-react';
import { useStarStore } from '../store/useStarStore';
import { starCatalog } from '../data/StarCatalog';
import { SPECTRAL_COLORS, EVOLUTION_STAGE_NAMES } from '../types/star';
import type { Star } from '../types/star';
import { EvolutionProgress } from './EvolutionProgress';
import { cn } from '../lib/utils';

export const StarInfoPanel: React.FC = () => {
  const { 
    selectedStarId, 
    isPlaying, 
    togglePlayback, 
    loadEvolutionPath,
    setSelectedStar,
    evolutionPath
  } = useStarStore();

  const [star, setStar] = useState<Star | null>(null);
  const [catalogLoaded, setCatalogLoaded] = useState(false);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        await starCatalog.loadStars();
        setCatalogLoaded(true);
      } catch (error) {
        console.error('Failed to load star catalog:', error);
      }
    };
    loadCatalog();
  }, []);

  useEffect(() => {
    if (!selectedStarId || !catalogLoaded) {
      setStar(null);
      return;
    }
    try {
      const foundStar = starCatalog.getStarById(selectedStarId);
      setStar(foundStar || null);
    } catch (error) {
      console.error('Failed to get star:', error);
      setStar(null);
    }
  }, [selectedStarId, catalogLoaded]);

  const handlePlayEvolution = () => {
    if (selectedStarId) {
      loadEvolutionPath(selectedStarId);
      if (!isPlaying) {
        togglePlayback();
      }
    }
  };

  const InfoRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: React.ReactNode;
  }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 py-2">
      <div className="text-[#95A5A6]">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-[#7F8C8D]">{label}</div>
        <div className="text-[16px] text-[#BDC3C7]">{value}</div>
      </div>
    </div>
  );

  const panelContent = useMemo(() => {
    if (!star) return null;

    const spectralColor = SPECTRAL_COLORS[star.spectralType];

    return (
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-[20px] font-semibold text-[#E0E0E0] m-0">
            {star.name}
          </h2>
          <button
            type="button"
            onClick={() => setSelectedStar(null)}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              'hover:bg-white/10 text-[#95A5A6] hover:text-white'
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1">
          <InfoRow
            icon={<CircleDot className="w-4 h-4" />}
            label="光谱类型"
            value={
              <span
                className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-sm"
                style={{
                  backgroundColor: `${spectralColor}20`,
                  color: spectralColor,
                  border: `1px solid ${spectralColor}40`
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: spectralColor }}
                />
                {star.spectralType}型
              </span>
            }
          />

          <InfoRow
            icon={<Thermometer className="w-4 h-4" />}
            label="温度"
            value={`${star.temperature.toLocaleString()} K`}
          />

          <InfoRow
            icon={<Sun className="w-4 h-4" />}
            label="绝对星等"
            value={star.absoluteMagnitude.toFixed(2)}
          />

          <InfoRow
            icon={<Ruler className="w-4 h-4" />}
            label="半径"
            value={`${star.radius.toFixed(2)} R☉`}
          />

          <InfoRow
            icon={<CircleDot className="w-4 h-4" />}
            label="质量"
            value={`${star.mass.toFixed(2)} M☉`}
          />

          <InfoRow
            icon={<Sparkles className="w-4 h-4" />}
            label="光度"
            value={`${star.luminosity.toFixed(2)} L☉`}
          />

          <InfoRow
            icon={<TrendingUp className="w-4 h-4" />}
            label="演化阶段"
            value={
              <span className="text-[#3498DB]">
                {EVOLUTION_STAGE_NAMES[star.evolutionStage]}
              </span>
            }
          />
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePlayEvolution}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg',
                'text-white font-medium transition-all duration-200',
                'hover:brightness-110 active:scale-98'
              )}
              style={{
                background: 'linear-gradient(135deg, #3498DB, #2980B9)'
              }}
            >
              <Play className="w-4 h-4" />
              播放演化
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              disabled={evolutionPath.length === 0}
              className={cn(
                'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
                'text-white font-medium transition-all duration-200',
                'hover:brightness-110 active:scale-98',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              style={{
                background: isPlaying 
                  ? 'linear-gradient(135deg, #E74C3C, #C0392B)'
                  : 'linear-gradient(135deg, #27AE60, #1E8449)'
              }}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </div>

          {evolutionPath.length > 0 && <EvolutionProgress />}
        </div>
      </div>
    );
  }, [star, isPlaying, evolutionPath.length, setSelectedStar, togglePlayback, handlePlayEvolution]);

  const isVisible = !!star;

  return (
    <>
      <div
        className={cn(
          'hidden md:block fixed left-4 top-1/2 -translate-y-1/2 z-40',
          'transition-transform duration-300 ease-out',
          isVisible ? 'translate-x-0' : '-translate-x-[360px]'
        )}
        style={{
          width: '340px',
          backgroundColor: 'rgba(44, 62, 80, 0.92)',
          border: '1px solid #4A5B6E',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)'
        }}
      >
        {panelContent}
      </div>

      <div
        className={cn(
          'md:hidden fixed bottom-0 left-0 right-0 z-40',
          'transition-transform duration-300 ease-out',
          isVisible ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          backgroundColor: 'rgba(44, 62, 80, 0.92)',
          border: '1px solid #4A5B6E',
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          backdropFilter: 'blur(10px)',
          maxHeight: '70vh',
          overflowY: 'auto'
        }}
      >
        <div className="w-12 h-1 bg-[#4A5B6E] rounded-full mx-auto mt-2" />
        {panelContent}
      </div>
    </>
  );
};
