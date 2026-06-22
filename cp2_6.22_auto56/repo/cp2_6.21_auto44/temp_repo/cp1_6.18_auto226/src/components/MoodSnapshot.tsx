import React, { useMemo } from 'react';
import { useStore } from '../store';
import { getColor, getMoodLabel } from '../hooks/useColorSpectrum';

const MoodSnapshot: React.FC = React.memo(() => {
  const weekData = useStore((s) => s.weekData);
  const selectedDayIndex = useStore((s) => s.selectedDayIndex);
  const panelOpen = useStore((s) => s.panelOpen);

  const selectedDay = useMemo(() => {
    if (selectedDayIndex === null) return null;
    return weekData[selectedDayIndex];
  }, [selectedDayIndex, weekData]);

  if (!selectedDay || !panelOpen) return null;

  const dominantColor = getColor(selectedDay.dominantMood);

  return (
    <div className={`snapshot-panel ${panelOpen ? 'open' : ''}`}>
      <div className="snapshot-header">
        <h3 className="snapshot-date">{selectedDay.date} {selectedDay.dayLabel}</h3>
      </div>
      <div className="snapshot-color-orb">
        <div
          className="orb-outer"
          style={{
            background: `radial-gradient(circle, ${dominantColor.primary}33 0%, transparent 70%)`,
          }}
        />
        <div
          className="orb-inner"
          style={{
            background: `radial-gradient(circle, ${dominantColor.primary}B3 0%, ${dominantColor.primary}4D 100%)`,
          }}
        />
        <div
          className="orb-core"
          style={{ background: dominantColor.primary }}
        />
        <span className="orb-label">{getMoodLabel(selectedDay.dominantMood)}</span>
      </div>
      <div className="snapshot-records">
        {selectedDay.records.map((record) => {
          const recColor = getColor(record.mood);
          return (
            <div key={record.id} className="snapshot-record">
              <div
                className="record-dot"
                style={{ background: recColor.primary }}
              />
              <span className="record-time">{record.time}</span>
              <span className="record-mood-label">{getMoodLabel(record.mood)}</span>
              <span className="record-content">{record.content.slice(0, 30)}{record.content.length > 30 ? '...' : ''}</span>
            </div>
          );
        })}
      </div>
      <style>{`
        .snapshot-panel {
          width: 320px;
          min-width: 320px;
          background: #1E1E2E;
          border-radius: 16px;
          padding: 24px 20px;
          color: #E0E0E0;
          flex-shrink: 0;
          transform: translateX(100%);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
          overflow-y: auto;
          max-height: calc(100vh - 200px);
        }
        .snapshot-panel.open {
          transform: translateX(0);
          opacity: 1;
        }
        .snapshot-header {
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .snapshot-date {
          font-size: 1.1rem;
          font-weight: 500;
          color: #FFF;
        }
        .snapshot-color-orb {
          position: relative;
          width: 100px;
          height: 100px;
          margin: 0 auto 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .orb-outer {
          position: absolute;
          inset: -30px;
          border-radius: 50%;
          opacity: 0.3;
        }
        .orb-inner {
          position: absolute;
          inset: -15px;
          border-radius: 50%;
          opacity: 0.7;
        }
        .orb-core {
          position: relative;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          z-index: 1;
        }
        .orb-label {
          position: absolute;
          bottom: -28px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          white-space: nowrap;
          z-index: 2;
        }
        .snapshot-records {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .snapshot-record {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          font-size: 0.8rem;
        }
        .record-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .record-time {
          color: #888;
          font-size: 0.75rem;
          min-width: 42px;
        }
        .record-mood-label {
          color: rgba(255,255,255,0.6);
          font-size: 0.7rem;
          min-width: 32px;
        }
        .record-content {
          color: rgba(255,255,255,0.5);
          font-size: 0.75rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }
        @media (max-width: 768px) {
          .snapshot-panel {
            width: 100%;
            min-width: unset;
            max-height: 50vh;
            transform: translateY(100%);
          }
          .snapshot-panel.open {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

MoodSnapshot.displayName = 'MoodSnapshot';
export default MoodSnapshot;
