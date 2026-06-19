import React, { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import CanvasBoard from './canvas/CanvasBoard';
import ColorPicker from './canvas/ColorPicker';
import TrackList from './track/TrackList';
import { generatePoster, POSTER_WIDTH, POSTER_HEIGHT } from './canvas/PosterGenerator';
import { useCanvasStore } from './canvas/store';
import { useTrackStore } from './track/store';
import { albumDatabase, type Album } from './data/albumDatabase';
import { pickTextColor } from './utils/colorAnalysis';

const VinylIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="7.5" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </svg>
);

const AlbumCard: React.FC<{
  album: Album;
  onClick: () => void;
}> = ({ album, onClick }) => {
  const [c1, c2, c3] = album.coverColors;
  const textColor = pickTextColor(c1);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('albumId', album.id);
    e.dataTransfer.setData('albumData', JSON.stringify(album));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      className="album-card"
      draggable
      onClick={onClick}
      onDragStart={handleDragStart}
      style={{ color: textColor }}
    >
      <div
        className="album-cover"
        style={{ background: `linear-gradient(135deg, ${c1}, ${c2}, ${c3})` }}
      >
        <div className="mini-vinyl">
          <div className="mini-vinyl-holes" />
        </div>
      </div>
      <div className="album-meta">
        <div className="album-title">{album.title}</div>
        <div className="album-artist">{album.artist}</div>
      </div>
    </div>
  );
};

const PosterModal: React.FC<{
  dataUrl: string;
  onClose: () => void;
}> = ({ dataUrl, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(dataUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = dataUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    const byteChars = atob(dataUrl.split(',')[1]);
    const bytes = new Uint8Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/png' });
    saveAs(blob, 'vinyl-collage-poster.png');
  };

  return (
    <div className="poster-modal-backdrop" onClick={onClose}>
      <div className="poster-modal" onClick={(e) => e.stopPropagation()}>
        <button className="poster-close" onClick={onClose}>×</button>
        <div className="poster-preview">
          <img src={dataUrl} alt="Generated Poster" />
        </div>
        <div className="poster-actions">
          <button className="btn-secondary" onClick={handleCopyLink}>
            {copied ? '✓ 已复制' : '复制链接 (DataURL)'}
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            下载图片
          </button>
        </div>
        <div className="poster-dims">尺寸: {POSTER_WIDTH} × {POSTER_HEIGHT} px · PNG</div>
      </div>
    </div>
  );
};

const LibraryPanel: React.FC = () => {
  const addCover = useCanvasStore(s => s.addCover);
  const covers = useCanvasStore(s => s.covers);
  const maxReached = covers.length >= 12;
  const addedIds = new Set(covers.map(c => c.album.id));

  return (
    <aside className="library-panel">
      <div className="panel-header">
        <VinylIcon size={20} />
        <span>唱片库</span>
        <span className="panel-count">{albumDatabase.length}</span>
      </div>
      {maxReached && <div className="panel-warning">已达到 12 张上限</div>}
      <div className="album-grid">
        {albumDatabase.map(album => (
          <AlbumCard
            key={album.id}
            album={album}
            onClick={() => !addedIds.has(album.id) && !maxReached && addCover(album)}
          />
        ))}
      </div>
    </aside>
  );
};

const App: React.FC = () => {
  const covers = useCanvasStore(s => s.covers);
  const backgroundColor = useCanvasStore(s => s.backgroundColor);
  const tracks = useTrackStore(s => s.tracks);
  const clearCanvas = useCanvasStore(s => s.clearCanvas);

  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleGeneratePoster = useCallback(() => {
    if (covers.length === 0) return;
    setGenerating(true);
    setTimeout(() => {
      try {
        const dataUrl = generatePoster({ covers, backgroundColor, tracks });
        setPosterDataUrl(dataUrl);
      } finally {
        setGenerating(false);
      }
    }, 30);
  }, [covers, backgroundColor, tracks]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">
            <VinylIcon size={32} />
          </span>
          <h1 className="header-title">黑胶拼贴海报工坊</h1>
          <span className="header-sub">Vinyl Collage Studio</span>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={clearCanvas}
            disabled={covers.length === 0}
          >
            清空画布
          </button>
          <button
            className="btn-primary"
            onClick={handleGeneratePoster}
            disabled={covers.length === 0 || generating}
          >
            {generating ? '生成中…' : '生成海报'}
          </button>
        </div>
      </header>

      <main className="workspace">
        <LibraryPanel />

        <section className="center-col">
          <CanvasBoard />
          <ColorPicker />
        </section>

        <aside className="right-col">
          <TrackList />
        </aside>
      </main>

      {posterDataUrl && (
        <PosterModal
          dataUrl={posterDataUrl}
          onClose={() => setPosterDataUrl(null)}
        />
      )}
    </div>
  );
};

export default App;
