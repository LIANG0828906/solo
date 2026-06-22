import { useState, useEffect } from 'react';
import { Room, ScoredSong } from '../types';

interface RoomViewProps {
  room: Room;
  onBack: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#4caf50';
  if (score >= 60) return '#cddc39';
  if (score >= 40) return '#ffc107';
  return '#f44336';
}

function CircularProgress({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="circular-progress">
      <svg width="50" height="50">
        <circle
          className="circular-progress-bg"
          cx="25"
          cy="25"
          r={radius}
        />
        <circle
          className="circular-progress-fill"
          cx="25"
          cy="25"
          r={radius}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="circular-progress-text" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}

function LineChart({ data }: { data: number[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number } | null>(null);

  if (data.length === 0) {
    return <div style={{ color: '#616161', textAlign: 'center', padding: '40px 0' }}>生成歌单后显示匹配度趋势</div>;
  }

  const width = 800;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = 100;
  const minValue = 0;

  const points = data.map((value, index) => {
    const x = padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight;
    return { x, y, value };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="svg-chart" preserveAspectRatio="none">
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = padding.top + chartHeight - ((tick - minValue) / (maxValue - minValue)) * chartHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#333"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                fill="#616161"
                fontSize="10"
                textAnchor="end"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {points.map((p, i) => (
          <text
            key={i}
            x={p.x}
            y={height - 10}
            fill="#616161"
            fontSize="10"
            textAnchor="middle"
          >
            {i + 1}
          </text>
        ))}

        <path d={pathD} fill="none" stroke="#bb86fc" strokeWidth="2" />

        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={getScoreColor(p.value)}
            stroke="#121212"
            strokeWidth="2"
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, value: p.value })}
            onMouseLeave={() => setTooltip(null)}
          />
        ))}
      </svg>
      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `${(tooltip.y / height) * 100 - 5}%`,
          }}
        >
          {tooltip.value}%
        </div>
      )}
    </div>
  );
}

export default function RoomView({ room: initialRoom, onBack }: RoomViewProps) {
  const [room, setRoom] = useState<Room>(initialRoom);
  const [playlist, setPlaylist] = useState<ScoredSong[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [simulatedProgress, setSimulatedProgress] = useState(0);

  useEffect(() => {
    if (room.generatedPlaylist) {
      setPlaylist(room.generatedPlaylist as ScoredSong[]);
      setSimulatedProgress(100);
    }
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setSimulatedProgress(0);

    const progressInterval = setInterval(() => {
      setSimulatedProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 100);

    try {
      const res = await fetch('/api/room/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room.id }),
      });
      const data = await res.json();

      clearInterval(progressInterval);
      setSimulatedProgress(100);
      setRoom(data.room);
      setPlaylist(data.playlist);
    } catch (error) {
      console.error('Failed to generate playlist:', error);
      clearInterval(progressInterval);
      setSimulatedProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportText = () => {
    const text = playlist
      .map((item, index) => `${index + 1}. ${item.song.title} - ${item.song.artist}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room.name}_歌单.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const jsonData = {
      roomName: room.name,
      generatedAt: new Date().toISOString(),
      playlist: playlist.map((item, index) => ({
        rank: index + 1,
        title: item.song.title,
        artist: item.song.artist,
        genre: item.song.genre,
        duration: item.song.duration,
        matchScore: item.matchScore,
      })),
    };
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${room.name}_歌单.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const matchScores = playlist.map((item) => item.matchScore);

  return (
    <div>
      <button className="back-btn" onClick={onBack}>
        ← 返回首页
      </button>

      <div className="room-layout">
        <div className="room-sidebar">
          <div className="room-name">{room.name}</div>
          <div className="section-title">参与者 ({room.participants.length})</div>
          <div className="participants-list">
            {room.participants.map((p) => (
              <div key={p.id} className="participant-item">
                <span className="participant-dot" style={{ backgroundColor: p.color }} />
                <span className="participant-name">{p.name}</span>
                <span className="participant-count">{p.playlist.length}首</span>
              </div>
            ))}
          </div>
        </div>

        <div className="room-main">
          <div className="progress-section">
            <div className="progress-label">
              <span>歌单融合进度</span>
              <span>{Math.round(simulatedProgress)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${simulatedProgress}%` }}
              />
            </div>
            <button
              className="generate-btn"
              onClick={handleGenerate}
              disabled={isGenerating || playlist.length > 0}
            >
              {playlist.length > 0
                ? '已生成歌单'
                : isGenerating
                ? '生成中...'
                : '生成聚会歌单'}
            </button>
          </div>

          <div className="chart-section">
            <div className="section-title">匹配度趋势</div>
            <LineChart data={matchScores} />
          </div>

          {playlist.length > 0 && (
            <div className="playlist-section">
              <div className="section-title">推荐歌单 ({playlist.length}首)</div>
              <div className="match-list">
                {playlist.map((item, index) => (
                  <div key={item.song.id} className="match-item">
                    <span style={{ color: '#616161', fontSize: '14px', width: '20px' }}>
                      {index + 1}
                    </span>
                    <img
                      src={item.song.coverUrl}
                      alt={item.song.title}
                      className="match-cover"
                    />
                    <div className="match-info">
                      <div className="match-title">{item.song.title}</div>
                      <div className="match-artist">{item.song.artist}</div>
                    </div>
                    <CircularProgress score={item.matchScore} />
                  </div>
                ))}
              </div>
              <div className="export-buttons">
                <button className="export-btn" onClick={exportText}>
                  导出为 TXT
                </button>
                <button className="export-btn" onClick={exportJSON}>
                  导出为 JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
