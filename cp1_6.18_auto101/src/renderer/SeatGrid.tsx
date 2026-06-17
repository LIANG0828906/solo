import React, { useCallback, useMemo } from 'react';
import type { Seat, SeatZone } from '../types';
import { SeatCell } from '../components/SeatCell';
import { useSeatStore } from '../stores/seatStore';

interface ZoneGroup {
  zone: SeatZone;
  name: string;
  seats: Seat[];
}

const ZONE_CONFIG: Array<{ zone: SeatZone; name: string }> = [
  { zone: 'A', name: 'A区 · 开放阅读区' },
  { zone: 'B', name: 'B区 · 学习讨论区' },
  { zone: 'C', name: 'C区 · 安静自习区' },
];

interface SeatGridProps {
  onSeatClick: (seatId: string) => void;
}

const TOTAL_COLS = 10;

export const SeatGrid: React.FC<SeatGridProps> = ({ onSeatClick }) => {
  const seats = useSeatStore((state) => state.seats);
  const selectedSeatId = useSeatStore((state) => state.selectedSeatId);
  const filter = useSeatStore((state) => state.filter);

  const handleSeatClick = useCallback(
    (seatId: string) => {
      onSeatClick(seatId);
    },
    [onSeatClick]
  );

  const filteredSeatIds = useMemo(() => {
    if (
      filter.zone === 'all' &&
      !filter.windowView &&
      !filter.powerOutlet &&
      !filter.quietZone
    ) {
      return null;
    }
    const ids = new Set<string>();
    for (const seat of seats) {
      if (filter.zone !== 'all' && seat.zone !== filter.zone) continue;
      if (filter.windowView && !seat.tags.windowView) continue;
      if (filter.powerOutlet && !seat.tags.powerOutlet) continue;
      if (filter.quietZone && !seat.tags.quietZone) continue;
      ids.add(seat.id);
    }
    return ids;
  }, [seats, filter]);

  const zoneGroups = useMemo<ZoneGroup[]>(() => {
    return ZONE_CONFIG.map((cfg) => ({
      ...cfg,
      seats: seats
        .filter((s) => s.zone === cfg.zone)
        .sort((a, b) => {
          if (a.row !== b.row) return a.row - b.row;
          return a.col - b.col;
        }),
    }));
  }, [seats]);

  return (
    <div
      style={{
        backgroundColor: '#2D2D44',
        borderRadius: 12,
        padding: 24,
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {zoneGroups.map((group) => {
          const rows = group.seats.reduce<Record<number, Seat[]>>((acc, seat) => {
            if (!acc[seat.row]) acc[seat.row] = [];
            acc[seat.row].push(seat);
            return acc;
          }, {});
          const rowKeys = Object.keys(rows)
            .map(Number)
            .sort((a, b) => a - b);

          return (
            <div
              key={group.zone}
              style={{
                padding: 12,
                paddingTop: 8,
                border: '1px dashed rgba(99, 110, 114, 0.6)',
                borderRadius: 8,
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -10,
                  left: 12,
                  backgroundColor: '#2D2D44',
                  padding: '0 8px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#A0A0B0',
                  letterSpacing: 0.5,
                }}
              >
                {group.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginTop: 8,
                }}
              >
                {rowKeys.map((rowKey) => (
                  <div
                    key={rowKey}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${TOTAL_COLS}, 50px)`,
                      gap: 12,
                      justifyContent: 'center',
                    }}
                  >
                    {Array.from({ length: TOTAL_COLS }, (_, colIdx) => {
                      const seat = rows[rowKey].find((s) => s.col === colIdx);
                      if (!seat) {
                        return <div key={colIdx} style={{ width: 50, height: 50 }} />;
                      }
                      return (
                        <SeatCell
                          key={seat.id}
                          seat={seat}
                          isSelected={selectedSeatId === seat.id}
                          isFiltered={filteredSeatIds ? filteredSeatIds.has(seat.id) : true}
                          onClick={handleSeatClick}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
