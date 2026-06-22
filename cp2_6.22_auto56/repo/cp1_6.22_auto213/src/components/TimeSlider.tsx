import { getMonthName } from '../services/climateDataService';

interface TimeSliderProps {
  selectedMonth: number;
  onMonthChange: (month: number) => void;
}

export default function TimeSlider({ selectedMonth, onMonthChange }: TimeSliderProps) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: 32,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: 16,
    }}>
      <div style={{
        color: '#FFFFFF',
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        fontWeight: 600,
        minWidth: 48,
      }}>
        {getMonthName(selectedMonth)}
      </div>
      <div style={{
        position: 'relative',
        width: 500,
        height: 32,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{
          position: 'absolute',
          width: '100%',
          height: 4,
          background: '#2D3748',
          borderRadius: 2,
          cursor: 'pointer',
        }}>
          <div style={{
            position: 'absolute',
            height: '100%',
            width: `${(selectedMonth / 11) * 100}%`,
            background: 'linear-gradient(to right, #3B82F6, #60A5FA)',
            borderRadius: 2,
            transition: 'width 0.3s ease-in-out',
          }} />
        </div>
        <input
          type="range"
          min={0}
          max={11}
          value={selectedMonth}
          onChange={(e) => onMonthChange(parseInt(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            height: 32,
            margin: 0,
            padding: 0,
            opacity: 0,
            cursor: 'pointer',
          }}
        />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${(i / 11) * 100}%`,
              transform: i === selectedMonth ? 'translateX(-50%) scale(1.2)' : 'translateX(-50%) scale(1)',
              width: i === selectedMonth ? 20 : 8,
              height: i === selectedMonth ? 20 : 8,
              borderRadius: '50%',
              background: i === selectedMonth ? '#3B82F6' : '#4A5568',
              boxShadow: i === selectedMonth ? '0 0 12px #3B82F6' : 'none',
              transition: 'all 0.3s ease-in-out',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
      <div style={{
        color: '#94A3B8',
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
      }}>
        拖动选择月份
      </div>
    </div>
  );
}
