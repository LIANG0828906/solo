import { useRef, useEffect, useState, useMemo } from 'react';
import { Contract } from '../types';
import {
  calculateSongAllocations,
  formatCurrency,
  formatNumber,
} from '../utils/revenueCalculator';

interface SongAllocationProps {
  contract: Contract;
  playCountWeight: number;
  durationWeight: number;
  onWeightChange: (playCountWeight: number) => void;
}

function getGradientColor(index: number, total: number): string {
  const startColor = { r: 255, g: 107, b: 107 };
  const endColor = { r: 78, g: 205, b: 196 };

  const ratio = total <= 1 ? 0 : index / (total - 1);
  const r = Math.round(startColor.r + (endColor.r - startColor.r) * ratio);
  const g = Math.round(startColor.g + (endColor.g - startColor.g) * ratio);
  const b = Math.round(startColor.b + (endColor.b - startColor.b) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

interface HoverInfo {
  x: number;
  y: number;
  songName: string;
  revenue: number;
  percentage: number;
  color: string;
}

function SongAllocation({
  contract,
  playCountWeight,
  durationWeight,
  onWeightChange,
}: SongAllocationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const allocations = useMemo(() => {
    return calculateSongAllocations(contract, playCountWeight, durationWeight);
  }, [contract, playCountWeight, durationWeight]);

  const netRevenue = contract.fee * (contract.splitRatio / 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || allocations.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.clearRect(0, 0, width, height);

    ctx.shadowColor = 'rgba(108, 99, 255, 0.2)';
    ctx.shadowBlur = 20;

    let startAngle = -Math.PI / 2;
    allocations.forEach((alloc, index) => {
      const sliceAngle = (alloc.percentage / 100) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;
      const isHovered = index === hoveredIndex;
      const currentRadius = isHovered ? radius + 8 : radius;
      const offset = isHovered ? 6 : 0;
      const midAngle = startAngle + sliceAngle / 2;
      const offsetX = Math.cos(midAngle) * offset;
      const offsetY = Math.sin(midAngle) * offset;

      ctx.beginPath();
      ctx.moveTo(centerX + offsetX, centerY + offsetY);
      ctx.arc(
        centerX + offsetX,
        centerY + offsetY,
        currentRadius,
        startAngle,
        endAngle
      );
      ctx.closePath();

      const color = getGradientColor(index, allocations.length);
      ctx.fillStyle = color;
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#1E1E2E';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (alloc.percentage >= 5 && !isHovered) {
        const labelRadius = radius * 0.65;
        const labelX = centerX + Math.cos(midAngle) * labelRadius;
        const labelY = centerY + Math.sin(midAngle) * labelRadius;

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${alloc.percentage.toFixed(1)}%`, labelX, labelY);
        ctx.restore();
      }

      startAngle = endAngle;
    });

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#1E1E2E';
    ctx.fill();
    ctx.strokeStyle = '#3A3A50';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#808098';
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('版税总额', centerX, centerY - 4);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText(formatCurrency(netRevenue), centerX, centerY + 2);
  }, [allocations, hoveredIndex, netRevenue]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || allocations.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(rect.width, rect.height) / 2 - 20;

    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius * 0.45 || distance > radius + 12) {
      setHoverInfo(null);
      setHoveredIndex(-1);
      return;
    }

    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += Math.PI * 2;

    let cumulativeAngle = 0;
    for (let i = 0; i < allocations.length; i++) {
      const sliceAngle = (allocations[i].percentage / 100) * Math.PI * 2;
      if (angle >= cumulativeAngle && angle < cumulativeAngle + sliceAngle) {
        const color = getGradientColor(i, allocations.length);
        setHoveredIndex(i);
        setHoverInfo({
          x: e.clientX,
          y: e.clientY,
          songName: allocations[i].song.name,
          revenue: allocations[i].revenue,
          percentage: allocations[i].percentage,
          color,
        });
        return;
      }
      cumulativeAngle += sliceAngle;
    }

    setHoverInfo(null);
    setHoveredIndex(-1);
  };

  const handleMouseLeave = () => {
    setHoverInfo(null);
    setHoveredIndex(-1);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 8,
          }}
        >
          曲目分配: {contract.venue}
        </h1>
        <div style={{ display: 'flex', gap: 24, fontSize: 14, color: '#808098' }}>
          <span>演出日期: {contract.date}</span>
          <span>
            演出费:{' '}
            <span style={{ color: '#FFFFFF', fontWeight: 500 }}>
              {formatCurrency(contract.fee)}
            </span>
          </span>
          <span>
            分成比例:{' '}
            <span style={{ color: '#4ECDC4', fontWeight: 500 }}>
              {contract.splitRatio}%
            </span>
          </span>
          <span>
            可分配版税:{' '}
            <span style={{ color: '#6C63FF', fontWeight: 600 }}>
              {formatCurrency(netRevenue)}
            </span>
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 28,
          marginBottom: 28,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(145deg, #1E1E2E 0%, #2B2B3D 100%)',
            borderRadius: 16,
            border: '1px solid #3A3A50',
            padding: 20,
            maxHeight: 520,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: '#FFFFFF',
              }}
            >
              曲目列表 ({allocations.length} 首)
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {allocations.map((alloc, index) => {
              const color = getGradientColor(index, allocations.length);
              const isHovered = index === hoveredIndex;
              return (
                <div
                  key={alloc.song.id}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    backgroundColor: isHovered
                      ? 'rgba(108, 99, 255, 0.12)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: isHovered
                      ? `1px solid ${color}40`
                      : '1px solid rgba(255, 255, 255, 0.04)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 28,
                        borderRadius: 3,
                        backgroundColor: color,
                        flexShrink: 0,
                        boxShadow: `0 0 8px ${color}60`,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#FFFFFF',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {alloc.song.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#808098',
                          display: 'flex',
                          gap: 16,
                        }}
                      >
                        <span>播放: {formatNumber(alloc.song.playCount)}</span>
                        <span>时长: {alloc.song.duration}s</span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: 12, color: '#808098' }}>
                      占比 {alloc.percentage.toFixed(2)}%
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color,
                      }}
                    >
                      {formatCurrency(alloc.revenue)}
                    </span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      height: 4,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${alloc.percentage}%`,
                        backgroundColor: color,
                        borderRadius: 2,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(145deg, #1E1E2E 0%, #2B2B3D 100%)',
            borderRadius: 16,
            border: '1px solid #3A3A50',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#FFFFFF',
              marginBottom: 16,
            }}
          >
            收入占比图
          </h2>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <canvas
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                width: '100%',
                maxWidth: 380,
                height: 380,
                cursor: 'pointer',
              }}
            />
          </div>

          {hoverInfo && (
            <div
              style={{
                position: 'fixed',
                left: hoverInfo.x + 12,
                top: hoverInfo.y + 12,
                zIndex: 1000,
                pointerEvents: 'none',
                backgroundColor: '#0D0D1A',
                border: `1px solid ${hoverInfo.color}60`,
                borderRadius: 10,
                padding: '10px 14px',
                boxShadow: `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 20px ${hoverInfo.color}20`,
                minWidth: 180,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#FFFFFF',
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: hoverInfo.color,
                  }}
                />
                {hoverInfo.songName}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  gap: 16,
                }}
              >
                <span style={{ color: '#808098' }}>占比</span>
                <span style={{ color: hoverInfo.color, fontWeight: 500 }}>
                  {hoverInfo.percentage.toFixed(2)}%
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  marginTop: 4,
                  gap: 16,
                }}
              >
                <span style={{ color: '#808098' }}>版税</span>
                <span
                  style={{
                    color: '#FFFFFF',
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {formatCurrency(hoverInfo.revenue)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          background: 'linear-gradient(145deg, #1E1E2E 0%, #2B2B3D 100%)',
          borderRadius: 16,
          border: '1px solid #3A3A50',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            权重调节
          </h2>
          <div style={{ display: 'flex', gap: 20, fontSize: 13 }}>
            <span style={{ color: '#FF6B6B', fontWeight: 500 }}>
              播放次数权重: {(playCountWeight * 100).toFixed(0)}%
            </span>
            <span style={{ color: '#4ECDC4', fontWeight: 500 }}>
              时长权重: {(durationWeight * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div
          style={{
            width: '80%',
            margin: '0 auto',
          }}
        >
          <input
            type="range"
            min="0"
            max="100"
            value={playCountWeight * 100}
            onChange={(e) => onWeightChange(Number(e.target.value) / 100)}
            style={{
              width: '100%',
              height: 6,
              WebkitAppearance: 'none',
              appearance: 'none',
              background: `linear-gradient(to right, #FF6B6B 0%, #FF6B6B ${playCountWeight * 100}%, #2D2D44 ${playCountWeight * 100}%, #2D2D44 100%)`,
              borderRadius: 3,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 12,
              fontSize: 12,
              color: '#808098',
            }}
          >
            <span style={{ color: '#4ECDC4' }}>← 仅按时长</span>
            <span>平衡模式</span>
            <span style={{ color: '#FF6B6B' }}>仅按播放 →</span>
          </div>
        </div>
      </div>

      <style>{`
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6C63FF;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(108, 99, 255, 0.6);
          border: 3px solid #FFFFFF;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(108, 99, 255, 0.8);
        }
        input[type='range']::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #6C63FF;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(108, 99, 255, 0.6);
          border: 3px solid #FFFFFF;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        input[type='range']::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 16px rgba(108, 99, 255, 0.8);
        }
      `}</style>
    </div>
  );
}

export default SongAllocation;
