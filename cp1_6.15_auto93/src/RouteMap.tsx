import { useState, useRef, useEffect } from 'react';
import type { Venue, TourDate } from './types';

interface Props {
  venues: Venue[];
  tourDates: TourDate[];
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const provinceOutlines: [number, number][][] = [
  [[110, 40], [113, 42], [118, 41], [119, 38], [117, 36], [113, 36], [110, 38]],
  [[115, 32], [118, 34], [122, 33], [122, 31], [121, 30], [118, 30], [116, 31]],
  [[117, 30], [120, 30], [122, 28], [121, 26], [118, 26], [116, 28]],
  [[110, 25], [113, 26], [117, 24], [116, 22], [112, 21], [109, 23]],
  [[103, 31], [107, 32], [110, 30], [111, 28], [107, 27], [103, 28]],
  [[103, 26], [105, 29], [110, 28], [110, 24], [106, 23], [103, 24]],
  [[110, 30], [114, 30], [116, 30], [116, 28], [113, 27], [110, 29]],
  [[108, 35], [112, 37], [115, 35], [114, 33], [110, 33]],
  [[113, 36], [117, 37], [120, 36], [122, 35], [120, 34], [117, 34]],
  [[100, 40], [108, 42], [115, 40], [113, 37], [106, 38], [101, 39]],
  [[88, 45], [92, 48], [98, 47], [97, 43], [91, 42]],
  [[80, 40], [88, 44], [96, 43], [94, 39], [86, 38]],
  [[97, 30], [102, 32], [106, 29], [103, 25], [98, 26]],
  [[104, 23], [108, 23], [110, 21], [106, 20], [103, 22]],
  [[116, 23], [119, 25], [122, 23], [120, 21], [117, 21]],
  [[119, 24], [121, 26], [122, 24], [120, 22]],
  [[121, 23], [122, 25], [122, 22]],
  [[111, 20], [113, 22], [111, 21]]
];

const SEGMENT_DURATION = 500;

export default function RouteMap({ venues, tourDates }: Props) {
  const [selectedVenues, setSelectedVenues] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: number; time: number } | null>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalSegmentsRef = useRef<number>(0);

  const sortedTourVenues = tourDates
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(td => venues.find(v => v.id === td.venueId))
    .filter((v): v is Venue => v !== undefined);

  const currentRouteVenues = selectedVenues.length > 0
    ? selectedVenues.map(id => venues.find(v => v.id === id)).filter((v): v is Venue => v !== undefined)
    : sortedTourVenues;

  const toggleVenue = (venueId: string) => {
    setSelectedVenues(prev =>
      prev.includes(venueId)
        ? prev.filter(id => id !== venueId)
        : [...prev, venueId]
    );
  };

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTimeRef.current;
    const totalDuration = totalSegmentsRef.current * SEGMENT_DURATION;
    const progress = Math.min(elapsed / totalDuration, 1) * totalSegmentsRef.current;

    setAnimProgress(progress);

    if (progress < totalSegmentsRef.current) {
      rafRef.current = requestAnimationFrame(animate);
    } else {
      rafRef.current = null;
    }
  };

  const generateRoute = () => {
    const selected = [...currentRouteVenues];

    if (selected.length < 2) {
      alert('请至少选择 2 个场地');
      return;
    }

    let totalDist = 0;
    for (let i = 0; i < selected.length - 1; i++) {
      totalDist += haversineDistance(
        selected[i].lat, selected[i].lng,
        selected[i + 1].lat, selected[i + 1].lng
      );
    }
    setRouteInfo({
      distance: Math.round(totalDist),
      time: Math.round(totalDist / 80 * 10) / 10
    });

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    setShowMap(true);
    setAnimProgress(0);
    totalSegmentsRef.current = Math.max(selected.length - 1, 1);
    startTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!showMap || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    ctx.clearRect(0, 0, W, H);

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, 'rgba(30, 30, 58, 0.5)');
    bgGrad.addColorStop(1, 'rgba(22, 22, 42, 0.5)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const lngMin = 75, lngMax = 130, latMin = 18, latMax = 50;
    const toX = (lng: number) => ((lng - lngMin) / (lngMax - lngMin)) * W;
    const toY = (lat: number) => H - ((lat - latMin) / (latMax - latMin)) * H;

    ctx.save();
    provinceOutlines.forEach(outline => {
      ctx.beginPath();
      outline.forEach((pt, i) => {
        const x = toX(pt[0]);
        const y = toY(pt[1]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(102, 126, 234, 0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(102, 126, 234, 0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.restore();

    const routeVenues = currentRouteVenues;

    const points = routeVenues.map(v => ({
      x: toX(v.lng),
      y: toY(v.lat),
      city: v.city,
      name: v.name
    }));

    const fullSegments = Math.floor(animProgress);
    const partialProgress = animProgress - fullSegments;

    for (let i = 0; i < points.length - 1; i++) {
      let segmentProgress: number;
      if (i < fullSegments) {
        segmentProgress = 1;
      } else if (i === fullSegments) {
        segmentProgress = Math.max(0, Math.min(1, partialProgress));
      } else {
        continue;
      }

      if (segmentProgress <= 0) continue;

      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const easeOut = 1 - Math.pow(1 - segmentProgress, 3);
      const totalSteps = Math.max(2, Math.ceil(40 * easeOut));

      ctx.beginPath();
      for (let s = 0; s <= totalSteps; s++) {
        const t = (s / totalSteps) * easeOut;
        const x = p1.x + dx * t + Math.sin(t * Math.PI) * (-20);
        const y = p1.y + dy * t;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#ffbf66';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(255, 191, 102, 0.6)';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (segmentProgress >= 1) {
        const arrowAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowSize = 8;
        ctx.beginPath();
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
          p2.x - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
          p2.y - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
        );
        ctx.moveTo(p2.x, p2.y);
        ctx.lineTo(
          p2.x - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
          p2.y - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
        );
        ctx.strokeStyle = '#ffbf66';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    points.forEach((p, i) => {
      if (i <= fullSegments || (i === fullSegments + 1 && partialProgress > 0.8)) {
        const nodeProgress = i < fullSegments ? 1 :
          i === fullSegments && fullSegments < points.length - 1 ? 1 :
          Math.min(1, Math.max(0, (partialProgress - 0.8) * 5));

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 18);
        grad.addColorStop(0, `rgba(255, 191, 102, ${0.5 * nodeProgress})`);
        grad.addColorStop(1, 'rgba(255, 191, 102, 0)');
        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 7 * nodeProgress, 0, Math.PI * 2);
        ctx.fillStyle = '#ffbf66';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        if (nodeProgress > 0.5) {
          const alpha = Math.min(1, (nodeProgress - 0.5) * 2);
          ctx.globalAlpha = alpha;
          ctx.font = 'bold 11px system-ui, -apple-system';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.fillText(p.city, p.x, p.y - 14);
          ctx.shadowBlur = 0;

          ctx.font = 'bold 9px system-ui';
          ctx.fillStyle = 'rgba(255, 191, 102, 0.9)';
          ctx.fillText(`${i + 1}`, p.x, p.y + 3);
          ctx.globalAlpha = 1;
        }
      }
    });
  }, [showMap, animProgress, currentRouteVenues]);

  return (
    <div style={{ padding: 28, minHeight: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          color: '#fff',
          fontSize: 26,
          fontWeight: 700,
          marginBottom: 6,
          letterSpacing: 0.5
        }}>
          路线规划
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>
          选择场地并生成最佳巡演路线
        </p>
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: 18,
        padding: 24,
        border: '1px solid rgba(255,255,255,0.05)',
        marginBottom: 24
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18
        }}>
          <h2 style={{
            color: '#fff',
            fontSize: 15,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              width: 4, height: 16,
              background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
              borderRadius: 2
            }} />
            选择巡演场地
            <span style={{
              fontSize: 12,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.4)',
              marginLeft: 8
            }}>
              {selectedVenues.length > 0 ? `已选 ${selectedVenues.length} 个` : '默认按巡演日期顺序'}
            </span>
          </h2>
          <button
            onClick={generateRoute}
            style={{
              padding: '10px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
              color: '#1a1a2e',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(255,191,102,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,191,102,0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,191,102,0.25)';
            }}
          >
            🚀 生成路线
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12
        }}>
          {venues.map((venue, idx) => {
            const isSelected = selectedVenues.includes(venue.id);
            const tourOrder = sortedTourVenues.findIndex(v => v.id === venue.id);
            return (
              <div
                key={venue.id}
                onClick={() => toggleVenue(venue.id)}
                style={{
                  padding: 14,
                  background: isSelected
                    ? 'linear-gradient(135deg, rgba(255,191,102,0.15), rgba(255,154,60,0.08))'
                    : 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: isSelected
                    ? '1px solid rgba(255,191,102,0.4)'
                    : '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  animation: `venueIn 0.4s ease ${idx * 0.05}s both`,
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{
                  width: 38, height: 38,
                  borderRadius: 10,
                  background: isSelected
                    ? 'linear-gradient(135deg, #ffbf66, #ff9a3c)'
                    : 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#1a1a2e' : 'rgba(255,255,255,0.6)',
                  fontSize: 16,
                  flexShrink: 0,
                  transition: 'all 0.25s'
                }}>
                  📍
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: isSelected ? 600 : 500,
                    color: isSelected ? '#ffbf66' : '#fff',
                    marginBottom: 2,
                    transition: 'all 0.25s',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {venue.name}
                  </div>
                  <div style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.45)'
                  }}>
                    {venue.city}
                    {tourOrder >= 0 && ` · 第${tourOrder + 1}站`}
                  </div>
                </div>
                <div style={{
                  width: 22, height: 22,
                  borderRadius: 6,
                  border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.15)',
                  background: isSelected
                    ? 'linear-gradient(135deg, #ffbf66, #ff9a3c)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1a1a2e',
                  fontSize: 13,
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  {isSelected ? '✓' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {routeInfo && showMap && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16,
          marginBottom: 20,
          animation: 'fadeInUp 0.5s ease'
        }}>
          <div style={{
            padding: 18,
            background: 'linear-gradient(135deg, rgba(255,191,102,0.1), rgba(255,154,60,0.05))',
            borderRadius: 14,
            border: '1px solid rgba(255,191,102,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ffbf66, #ff9a3c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              🛣️
            </div>
            <div>
              <div style={{
                fontSize: 11,
                color: 'rgba(255,191,102,0.7)',
                marginBottom: 4,
                letterSpacing: 0.3
              }}>
                总行驶距离
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#ffbf66',
                lineHeight: 1
              }}>
                {routeInfo.distance.toLocaleString()}
                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, marginLeft: 4 }}>km</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: 18,
            background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.05))',
            borderRadius: 14,
            border: '1px solid rgba(102,126,234,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              ⏱️
            </div>
            <div>
              <div style={{
                fontSize: 11,
                color: 'rgba(102,126,234,0.7)',
                marginBottom: 4,
                letterSpacing: 0.3
              }}>
                预估行驶时间
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#667eea',
                lineHeight: 1
              }}>
                {routeInfo.time}
                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, marginLeft: 4 }}>小时</span>
              </div>
            </div>
          </div>

          <div style={{
            padding: 18,
            background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.05))',
            borderRadius: 14,
            border: '1px solid rgba(74,222,128,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #4ade80, #22c55e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              🎯
            </div>
            <div>
              <div style={{
                fontSize: 11,
                color: 'rgba(74,222,128,0.7)',
                marginBottom: 4,
                letterSpacing: 0.3
              }}>
                途经场地数
              </div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: '#4ade80',
                lineHeight: 1
              }}>
                {(selectedVenues.length > 0 ? selectedVenues.length : sortedTourVenues.length)}
                <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7, marginLeft: 4 }}>站</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMap && (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 18,
          padding: 24,
          border: '1px solid rgba(255,255,255,0.05)',
          animation: 'fadeInUp 0.5s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <h3 style={{
              color: '#fff',
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <span style={{
                width: 4, height: 16,
                background: 'linear-gradient(180deg, #ffbf66, #ff9a3c)',
                borderRadius: 2
              }} />
              路线地图预览
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 12,
              color: 'rgba(255,255,255,0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: '#ffbf66'
                }} />
                途经城市
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 16, height: 3,
                  background: '#ffbf66',
                  borderRadius: 2
                }} />
                行驶路线
              </div>
            </div>
          </div>
          <div style={{
            borderRadius: 14,
            overflow: 'hidden',
            background: '#0f0f20',
            border: '1px solid rgba(255,255,255,0.04)'
          }}>
            <canvas
              ref={canvasRef}
              width={900}
              height={480}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
                transform: 'translateZ(0)',
                willChange: 'transform'
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateZ(0) translateY(16px); }
          to { opacity: 1; transform: translateZ(0) translateY(0); }
        }
        @keyframes venueIn {
          from { opacity: 0; transform: translateZ(0) translateX(-8px); }
          to { opacity: 1; transform: translateZ(0) translateX(0); }
        }
        .venue-item, .map-container, canvas {
          will-change: transform;
          backface-visibility: hidden;
        }
      `}</style>
    </div>
  );
}
