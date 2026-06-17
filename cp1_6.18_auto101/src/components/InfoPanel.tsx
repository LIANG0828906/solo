import React, { useMemo } from 'react';
import { Wind, Zap, VolumeX, Info } from 'lucide-react';
import { useSeatStore } from '../stores/seatStore';
import type { SeatZone } from '../types';

const ZONE_LABELS: Record<SeatZone, string> = {
  A: 'A区',
  B: 'B区',
  C: 'C区',
};

const ZONE_TOTALS: Record<SeatZone, number> = { A: 30, B: 30, C: 20 };

export const InfoPanel: React.FC = () => {
  const seats = useSeatStore((s) => s.seats);
  const filter = useSeatStore((s) => s.filter);
  const setFilter = useSeatStore((s) => s.setFilter);

  const zoneStats = useMemo(() => {
  const stats = {} as Record<
    SeatZone,
    { total: number; available: number; occupied: number; maintenance: number }
  >;
  const zones: SeatZone[] = ['A', 'B', 'C'];
  for (const zone of zones) {
  const zoneSeats = seats.filter((s) => s.zone === zone);
  stats[zone] = {
    total: ZONE_TOTALS[zone],
    available: zoneSeats.filter((s) => s.status === 'available').length,
    occupied: zoneSeats.filter((s) => s.status === 'occupied').length,
    maintenance: zoneSeats.filter((s) => s.status === 'maintenance').length,
  };
  }
  return stats;
}, [seats]);

  const totalSeats = useMemo(
    () => Object.values(zoneStats).reduce((sum, z) => sum + z.total, 0),
    [zoneStats]
  );
  const totalAvailable = useMemo(
    () => Object.values(zoneStats).reduce((sum, z) => sum + z.available, 0),
    [zoneStats]
  );

  const filterButtons: { key: keyof typeof filter; label: string; icon: React.ReactNode; value: unknown }[] = [
    { key: 'windowView', label: '窗口位', icon: <Wind size={14} />, value: filter.windowView },
    { key: 'powerOutlet', label: '电源位', icon: <Zap size={14} />, value: filter.powerOutlet },
    { key: 'quietZone', label: '安静区', icon: <VolumeX size={14} />, value: filter.quietZone },
  ];

  const zoneOptions: Array<{ value: SeatZone | 'all'; label: string }> = [
    { value: 'all', label: '全部' },
    { value: 'A', label: 'A区' },
    { value: 'B', label: 'B区' },
    { value: 'C', label: 'C区' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      <div
        style={{
          backgroundColor: '#2D2D44',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Info size={16} color="#4ECDC4" />
          <span style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0' }}>实时空位</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 40, fontWeight: 700, color: '#4ECDC4', lineHeight: 1 }}>
            {totalAvailable}
          </span>
          <span style={{ fontSize: 14, color: '#A0A0B0' }}>/ {totalSeats} 个座位</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(Object.keys(zoneStats) as SeatZone[]).map((zone) => {
            const stats = zoneStats[zone];
            const pct = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;
            return (
              <div key={zone}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, color: '#A0A0B0' }}>{ZONE_LABELS[zone]}</span>
                  <span style={{ fontSize: 13, color: '#E0E0E0', fontWeight: 600 }}>
                    {stats.available} / {stats.total}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(99, 110, 114, 0.3)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%',
                      backgroundColor: '#4ECDC4',
                      borderRadius: 3,
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
          backgroundColor: '#2D2D44',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0', marginBottom: 16 }}>
          区域筛选
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 8,
          }}
        >
          {zoneOptions.map((opt) => (
            <button
              key={opt.value}
              className="btn-hover"
              onClick={() => setFilter({ zone: opt.value })}
              style={{
                height: 36,
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: filter.zone === opt.value ? '#4ECDC4' : 'rgba(99, 110, 114, 0.25)',
                color: filter.zone === opt.value ? '#1A1A2E' : '#E0E0E0',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#2D2D44',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0', marginBottom: 16 }}>
          座位属性
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filterButtons.map(({ key, label, icon, value }) => (
            <button
              key={key}
              className="btn-hover"
              onClick={() => setFilter({ [key]: !value } as Partial<typeof filter>)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 40,
                padding: '0 14px',
                borderRadius: 8,
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                backgroundColor: value ? 'rgba(78, 205, 196, 0.15)' : 'rgba(99, 110, 114, 0.15)',
                color: value ? '#4ECDC4' : '#A0A0B0',
              }}
            >
              {icon}
              <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
              <span
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: value ? '#4ECDC4' : 'rgba(99, 110, 114, 0.4)',
                  position: 'relative',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: value ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: '#fff',
                    transition: 'left 0.2s ease',
                  }}
                />
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#2D2D44',
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0', marginBottom: 16 }}>
          图例说明
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { color: '#4ECDC4', label: '空闲可预约' },
            { color: '#636E72', label: '已占用' },
            { color: '#FF6B6B', label: '维修中' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: item.color,
                }}
              />
              <span style={{ fontSize: 13, color: '#E0E0E0' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
