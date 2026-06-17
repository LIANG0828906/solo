import { useMixerStore } from '@/store/useMixerStore';
import GenreCard from './GenreCard';
import TrackLane from './TrackLane';
import WaveformDisplay from './WaveformDisplay';
import RhythmEditor from './RhythmEditor';
import { Download, Volume2 } from 'lucide-react';

export default function MixerPanel() {
  const genres = useMixerStore((s) => s.genres);
  const tracks = useMixerStore((s) => s.tracks);
  const isExporting = useMixerStore((s) => s.isExporting);
  const exportWav = useMixerStore((s) => s.exportWav);
  const initEngine = useMixerStore((s) => s.initEngine);

  const handleExport = async () => {
    initEngine();
    await exportWav();
  };

  const hasAnyGenre = tracks.some((t) => t.genreId);

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0D0D1A' }}>
      <aside
        className="flex flex-col gap-3 p-3 overflow-y-auto shrink-0"
        style={{
          width: 240,
          background: '#1E1E2E',
          borderRadius: 12,
          margin: 8,
          marginRight: 0,
        }}
      >
        <div className="flex items-center gap-2 px-1 pt-1 pb-2">
          <Volume2 size={16} style={{ color: '#4ECDC4' }} />
          <span className="text-sm font-semibold" style={{ color: '#E0E0E0' }}>
            流派素材库
          </span>
        </div>
        {genres.map((genre) => (
          <GenreCard key={genre.id} genreId={genre.id} />
        ))}
      </aside>

      <main className="flex-1 flex flex-col gap-4 p-4 overflow-auto min-w-0">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: '#E0E0E0' }}>
            音乐流派混音器
          </h1>
          <button
            onClick={handleExport}
            disabled={!hasAnyGenre || isExporting}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out"
            style={{
              background: hasAnyGenre && !isExporting ? '#4ECDC4' : '#2D2D44',
              color: hasAnyGenre && !isExporting ? '#0D0D1A' : '#6B7280',
              cursor: hasAnyGenre && !isExporting ? 'pointer' : 'not-allowed',
            }}
          >
            <Download size={16} />
            {isExporting ? '导出中...' : '导出 WAV'}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {tracks.map((track) => (
            <TrackLane key={track.id} trackId={track.id} />
          ))}
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
              波形可视化
            </span>
          </div>
          <WaveformDisplay />
        </div>
      </main>

      <RhythmEditor />
    </div>
  );
}
