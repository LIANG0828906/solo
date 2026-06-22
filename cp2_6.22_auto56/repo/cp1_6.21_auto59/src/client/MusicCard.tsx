export interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  energy: number;
  valence: number;
  duration: number;
}

const genreColors: Record<string, string> = {
  '电子': '#9C27B0',
  '摇滚': '#F44336',
  '流行': '#2196F3',
  '古典': '#FF9800',
  '民谣': '#4CAF50',
  '轻音乐': '#00BCD4',
  '嘻哈': '#673AB7',
  '环境': '#607D8B',
  '爵士': '#795548',
  '独立': '#3F51B5',
  'R&B': '#E91E63',
};

interface MusicCardProps {
  song: Song;
  isFavorite?: boolean;
  onFavoriteToggle?: (songId: string) => void;
  isDragging?: boolean;
  showFavorite?: boolean;
  index?: number;
}

function getEnergyGradient(energy: number): string {
  const r = Math.round(135 + (255 - 135) * energy);
  const g = Math.round(206 + (99 - 206) * energy);
  const b = Math.round(235 + (71 - 235) * energy);
  return `rgb(${r}, ${g}, ${b})`;
}

function getBpmBars(bpm: number): number[] {
  const normalized = Math.min(Math.max((bpm - 60) / 120, 0), 1);
  const bars: number[] = [];
  for (let i = 0; i < 5; i++) {
    const baseHeight = 20 + normalized * 40;
    const variation = Math.sin(i * 1.5 + normalized * 3) * 15;
    bars.push(Math.max(10, Math.min(60, baseHeight + variation)));
  }
  return bars;
}

export default function MusicCard({ 
  song, 
  isFavorite = false, 
  onFavoriteToggle, 
  isDragging = false,
  showFavorite = true,
  index = 0,
}: MusicCardProps) {
  const bgColor = getEnergyGradient(song.energy);
  const bars = getBpmBars(song.bpm);
  const genreColor = genreColors[song.genre] || '#2196F3';

  return (
    <div
      className={`music-card ${isDragging ? 'dragging' : ''}`}
      style={{
        width: '200px',
        height: '280px',
        borderRadius: '12px',
        background: `linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`,
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'grab',
        transform: isDragging ? 'scale(0.95)' : 'translateY(0)',
        opacity: isDragging ? 0.7 : 1,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div
        style={{
          height: '100px',
          borderRadius: '8px',
          background: `linear-gradient(135deg, ${bgColor}40, ${bgColor}20)`,
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${bgColor}30`,
        }}
      >
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '50px' }}>
          {bars.map((height, i) => (
            <div
              key={i}
              className="bpm-bar"
              style={{
                width: '6px',
                height: `${height}%`,
                background: bgColor,
                borderRadius: '3px',
                transition: 'height 0.3s ease',
                animation: `pulseBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#EAEAEA',
            margin: '0 0 8px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={song.title}
        >
          {song.title}
        </h3>
        <p
          style={{
            fontSize: '14px',
            color: '#666',
            margin: '0 0 12px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={song.artist}
        >
          {song.artist}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fff',
              background: genreColor,
              flexShrink: 0,
            }}
          >
            {song.genre}
          </span>

          {showFavorite && (
            <button
              className="favorite-btn"
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle?.(song.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill={isFavorite ? '#E53935' : 'none'}
                stroke={isFavorite ? '#E53935' : '#666'}
                strokeWidth="2"
                style={{
                  transition: 'all 0.2s ease',
                }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
