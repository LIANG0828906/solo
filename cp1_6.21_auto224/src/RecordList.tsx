import { useEffect, useRef, useState } from 'react';
import { BrewRecord, FlavorRatings, FLAVOR_KEYS, FLAVOR_LABELS } from './types';

interface RecordListProps {
  records: BrewRecord[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

function drawMiniRadar(canvas: HTMLCanvasElement, ratings: FlavorRatings) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 200;
  const center = size / 2;
  const radius = 70;
  const levels = 5;
  const count = FLAVOR_KEYS.length;
  const angleStep = (Math.PI * 2) / count;

  ctx.clearRect(0, 0, size, size);

  ctx.fillStyle = '#0F172A';
  ctx.beginPath();
  ctx.arc(center, center, radius + 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  for (let i = 1; i <= levels; i++) {
    const r = (radius / levels) * i;
    ctx.beginPath();
    for (let j = 0; j < count; j++) {
      const angle = angleStep * j - Math.PI / 2;
      const x = center + Math.cos(angle) * r;
      const y = center + Math.sin(angle) * r;
      if (j === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }

  for (let i = 0; i < count; i++) {
    const angle = angleStep * i - Math.PI / 2;
    const x = center + Math.cos(angle) * radius;
    const y = center + Math.sin(angle) * radius;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  ctx.fillStyle = '#F59E0B';
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 2;
  ctx.beginPath();
  FLAVOR_KEYS.forEach((key, i) => {
    const value = ratings[key] / 10;
    const angle = angleStep * i - Math.PI / 2;
    const r = radius * value;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
  ctx.globalAlpha = 0.3;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();

  FLAVOR_KEYS.forEach((key, i) => {
    const value = ratings[key] / 10;
    const angle = angleStep * i - Math.PI / 2;
    const r = radius * value;
    const x = center + Math.cos(angle) * r;
    const y = center + Math.sin(angle) * r;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = '#94A3B8';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  FLAVOR_KEYS.forEach((key, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelRadius = radius + 22;
    const x = center + Math.cos(angle) * labelRadius;
    const y = center + Math.sin(angle) * labelRadius;
    ctx.fillText(FLAVOR_LABELS[key], x, y);
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

interface RecordCardProps {
  record: BrewRecord;
  isExpanded: boolean;
  onToggle: () => void;
}

function RecordCard({ record, isExpanded, onToggle }: RecordCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isExpanded && canvasRef.current) {
      drawMiniRadar(canvasRef.current, record.ratings);
    }
  }, [isExpanded, record.ratings]);

  const cardStyle: React.CSSProperties = {
    width: '280px',
    minHeight: '160px',
    backgroundColor: '#1F2937',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
    transform: 'translateY(0)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  };

  const cardHoverStyle: React.CSSProperties = {
    ...cardStyle,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px #374151',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px',
  };

  const beanNameStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#F3F4F6',
    margin: 0,
    flex: 1,
    wordBreak: 'break-word',
  };

  const scoreBadgeStyle: React.CSSProperties = {
    backgroundColor: '#F59E0B',
    color: '#1F2937',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    flexShrink: 0,
  };

  const dateStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#9CA3AF',
    margin: 0,
  };

  const detailsStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '4px',
    animation: 'fadeIn 0.2s ease-out',
  };

  const paramsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px',
  };

  const paramItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const paramLabelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#6B7280',
  };

  const paramValueStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#E5E7EB',
  };

  const radarContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    padding: '8px 0',
  };

  const ratingsStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '4px',
  };

  const ratingItemStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  };

  const ratingLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: '#94A3B8',
  };

  const ratingValueStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#F59E0B',
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={isHovered || isExpanded ? cardHoverStyle : cardStyle}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={headerStyle}>
        <h3 style={beanNameStyle}>{record.beanName}</h3>
        <span style={scoreBadgeStyle}>{record.totalScore}</span>
      </div>
      <p style={dateStyle}>{formatDate(record.createdAt)}</p>

      {isExpanded && (
        <div style={detailsStyle}>
          <div style={paramsStyle}>
            <div style={paramItemStyle}>
              <span style={paramLabelStyle}>研磨度</span>
              <span style={paramValueStyle}>{record.grindSize}</span>
            </div>
            <div style={paramItemStyle}>
              <span style={paramLabelStyle}>水温</span>
              <span style={paramValueStyle}>{record.waterTemp}°C</span>
            </div>
            <div style={paramItemStyle}>
              <span style={paramLabelStyle}>注水时间</span>
              <span style={paramValueStyle}>{record.brewTime}s</span>
            </div>
            <div style={paramItemStyle}>
              <span style={paramLabelStyle}>粉水比</span>
              <span style={paramValueStyle}>{record.ratio}</span>
            </div>
          </div>

          <div style={radarContainerStyle}>
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              style={{ display: 'block' }}
            />
          </div>

          <div style={ratingsStyle}>
            {FLAVOR_KEYS.map((key) => (
              <div key={key} style={ratingItemStyle}>
                <span style={ratingLabelStyle}>{FLAVOR_LABELS[key]}</span>
                <span style={ratingValueStyle}>{record.ratings[key]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function RecordList({
  records,
  selectedId,
  onSelect,
  onLoadMore,
  hasMore,
  loading,
}: RecordListProps) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    padding: '16px',
    justifyContent: 'center',
  };

  const loadMoreContainerStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
  };

  const loadMoreBtnStyle: React.CSSProperties = {
    padding: '8px 24px',
    backgroundColor: '#374151',
    color: '#F3F4F6',
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    opacity: loading ? 0.6 : 1,
    transition: 'background-color 0.2s',
  };

  const emptyStyle: React.CSSProperties = {
    width: '100%',
    textAlign: 'center',
    color: '#64748B',
    fontSize: '14px',
    padding: '40px 0',
  };

  const handleCardClick = (id: string) => {
    onSelect(selectedId === id ? null : id);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && onLoadMore) {
      onLoadMore();
    }
  };

  return (
    <div style={containerStyle}>
      {records.length === 0 ? (
        <div style={emptyStyle}>暂无冲煮记录</div>
      ) : (
        <>
          {records.map((record) => (
            <RecordCard
              key={record.id}
              record={record}
              isExpanded={selectedId === record.id}
              onToggle={() => handleCardClick(record.id)}
            />
          ))}

          {hasMore && (
            <div style={loadMoreContainerStyle}>
              <button
                style={loadMoreBtnStyle}
                onClick={handleLoadMore}
                disabled={loading}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = '#4B5563';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                }}
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          div[style*="width: 280px"] {
            width: 90% !important;
          }
        }
      `}</style>
    </div>
  );
}
