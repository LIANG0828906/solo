import { useState, useEffect, useCallback } from 'react';
import { usePixelGrid, PALETTE, GRID_SIZE, DEFAULT_COLOR } from './modules/pixelGrid';
import { useCalendar, format, getCalendarDays, isSameDay } from './modules/calendar';
import type { MoodSnapshot } from './modules/calendar';
import type { PixelGrid } from './modules/pixelGrid';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function PixelGridEditor() {
  const { grid, selectedColor, setPixel, clearPixel, setSelectedColor, resetGrid } = usePixelGrid();
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const handleCellClick = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (e.button === 0) {
      setPixel(row, col, selectedColor);
    }
  }, [selectedColor, setPixel]);

  const handleCellContextMenu = useCallback((row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    clearPixel(row, col);
  }, [clearPixel]);

  return (
    <div style={styles.editorContainer}>
      <div style={styles.gridWrapper}>
        <div
          style={styles.grid}
          onContextMenu={(e) => e.preventDefault()}
        >
          {grid.map((row, r) =>
            row.map((color, c) => (
              <div
                key={`${r}-${c}`}
                style={{
                  ...styles.cell,
                  backgroundColor: color === DEFAULT_COLOR ? '#000' : color,
                }}
                onMouseDown={(e) => {
                  if (e.button === 0) handleCellClick(r, c, e);
                }}
                onContextMenu={(e) => handleCellContextMenu(r, c, e)}
              />
            ))
          )}
        </div>
      </div>
      <div style={styles.paletteBar}>
        {PALETTE.map((color) => (
          <div
            key={color}
            style={{
              ...styles.paletteSwatch,
              backgroundColor: color,
              border: color === selectedColor ? '3px solid #FFFFFF' : '3px solid transparent',
            }}
            onClick={() => setSelectedColor(color)}
          />
        ))}
      </div>
      <div style={styles.buttonRow}>
        <button style={styles.saveButton} onClick={() => setShowSaveDialog(true)}>保存表情</button>
        <button style={styles.clearButton} onClick={resetGrid}>清空画布</button>
      </div>
      {showSaveDialog && (
        <SaveDialog grid={grid} onClose={() => setShowSaveDialog(false)} />
      )}
    </div>
  );
}

function SaveDialog({ grid, onClose }: { grid: PixelGrid; onClose: () => void }) {
  const [text, setText] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const addSnapshot = useCalendar((s) => s.addSnapshot);

  const handleSave = () => {
    addSnapshot(date, grid, text || '');
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div style={styles.dialogHeader}>
          <div style={styles.dialogPreview}>
            <MiniGrid grid={grid} size={80} />
          </div>
          <div style={styles.dialogTitle}>保存心情</div>
        </div>
        <input
          style={styles.textInput}
          type="text"
          placeholder="今天的心情是..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={100}
        />
        <input
          style={styles.dateInput}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div style={styles.dialogActions}>
          <button style={styles.dialogConfirm} onClick={handleSave}>确认保存</button>
          <button style={styles.dialogCancel} onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}

function MiniGrid({ grid, size }: { grid: PixelGrid; size: number }) {
  const cellSize = size / GRID_SIZE;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_SIZE}, ${cellSize}px)`, gap: '0px', width: size, height: size, background: '#222', padding: 0 }}>
      {grid.flat().map((color, i) => (
        <div
          key={i}
          style={{
            width: cellSize,
            height: cellSize,
            backgroundColor: color === DEFAULT_COLOR ? '#000' : color,
          }}
        />
      ))}
    </div>
  );
}

function CalendarView() {
  const { currentMonth, selectedDate, snapshots, setSelectedDate, navigateMonth, searchDate } = useCalendar();
  const [searchText, setSearchText] = useState('');
  const [highlightDate, setHighlightDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = getCalendarDays(year, month);

  const handleSearch = () => {
    if (searchText.trim()) {
      const found = searchDate(searchText.trim());
      if (found) {
        setHighlightDate(searchText.trim());
        setTimeout(() => setHighlightDate(null), 3000);
      }
    }
  };

  const selectedKey = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedSnapshots: MoodSnapshot[] = selectedKey ? (snapshots[selectedKey] || []) : [];

  return (
    <div style={styles.calendarContainer}>
      <div style={styles.calendarHeader}>
        <button style={styles.arrowButton} onClick={() => navigateMonth(-1)}>◀</button>
        <span style={styles.monthLabel}>{format(currentMonth, 'yyyy年MM月')}</span>
        <button style={styles.arrowButton} onClick={() => navigateMonth(1)}>▶</button>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="搜索 yyyy-MM-dd"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
        />
      </div>
      <div style={styles.weekdayRow}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={styles.weekdayCell}>{d}</div>
        ))}
      </div>
      <div style={styles.calendarGrid}>
        {days.map((day, i) => {
          if (!day) {
            return <div key={`empty-${i}`} style={styles.emptyCalCell}><span style={styles.placeholder}>-</span></div>;
          }
          const dateKey = format(day, 'yyyy-MM-dd');
          const hasData = snapshots[dateKey] && snapshots[dateKey].length > 0;
          const isHighlighted = highlightDate === dateKey;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <div
              key={dateKey}
              style={{
                ...styles.calCell,
                backgroundColor: hasData ? '#E8D5FF' : '#2A2A2A',
                border: isHighlighted ? '3px solid #FF44AA' : isSelected ? '2px solid #7C4DFF' : '1px solid #333',
              }}
              onClick={() => setSelectedDate(day)}
            >
              <span style={{ ...styles.calDate, color: hasData ? '#333' : '#888' }}>{format(day, 'd')}</span>
              {hasData && (
                <MiniGrid grid={snapshots[dateKey][0].grid} size={24} />
              )}
              {!hasData && <span style={styles.placeholder}>-</span>}
            </div>
          );
        })}
      </div>
      {selectedDate && (
        <DetailPanel date={selectedKey!} snapshots={selectedSnapshots} />
      )}
    </div>
  );
}

function DetailPanel({ date, snapshots }: { date: string; snapshots: MoodSnapshot[] }) {
  return (
    <div style={styles.detailPanel}>
      <div style={styles.detailAccent} />
      <div style={styles.detailContent}>
        <div style={styles.detailDate}>{date}</div>
        {snapshots.length === 0 ? (
          <div style={styles.emptyDetail}>今天还没有记录哦</div>
        ) : (
          snapshots.map((s) => (
            <div key={s.id} style={styles.detailItem}>
              <MiniGrid grid={s.grid} size={120} />
              <div style={styles.detailText}>{s.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function TopBar() {
  const [time, setTime] = useState(format(new Date(), 'HH:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(format(new Date(), 'HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.topBar}>
      <div style={styles.appTitle}>像素情绪日志</div>
      <div style={styles.clock}>{time}</div>
    </div>
  );
}

export default function App() {
  const initFromStorage = useCalendar((s) => s.initFromStorage);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <div style={styles.root}>
      <TopBar />
      <div style={styles.main} className="main-layout">
        <div style={styles.leftPanel} className="left-panel">
          <PixelGridEditor />
        </div>
        <div style={styles.rightPanel} className="right-panel">
          <CalendarView />
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: '#1A1A2E',
    color: '#E0E0E0',
    fontFamily: 'sans-serif',
    fontSize: '14px',
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  topBar: {
    height: '60px',
    backgroundColor: '#16213E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
  },
  appTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#7C4DFF',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
  },
  clock: {
    fontSize: '18px',
    color: '#A0A0A0',
    fontVariantNumeric: 'tabular-nums',
  },
  main: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  leftPanel: {
    width: '380px',
    flexShrink: 0,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRight: '1px solid #333',
  },
  rightPanel: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },
  editorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  gridWrapper: {
    background: '#222',
    padding: '2px',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_SIZE}, 40px)`,
    gridTemplateRows: `repeat(${GRID_SIZE}, 40px)`,
    gap: '2px',
    background: '#333',
  },
  cell: {
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  paletteBar: {
    display: 'flex',
    gap: '8px',
    padding: '8px 0',
  },
  paletteSwatch: {
    width: '30px',
    height: '30px',
    cursor: 'pointer',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  },
  buttonRow: {
    display: 'flex',
    gap: '12px',
  },
  saveButton: {
    padding: '10px 28px',
    backgroundColor: '#7C4DFF',
    color: '#FFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  clearButton: {
    padding: '10px 28px',
    backgroundColor: '#444',
    color: '#EEE',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    backgroundColor: '#2A2A2A',
    borderRadius: '12px',
    padding: '24px',
    width: '340px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  dialogPreview: {
    flexShrink: 0,
  },
  dialogTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#EEE',
  },
  textInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#333',
    color: '#EEE',
    border: '1px solid #555',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
  },
  dateInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#333',
    color: '#EEE',
    border: '1px solid #555',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    boxSizing: 'border-box',
    colorScheme: 'dark',
  },
  dialogActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  dialogConfirm: {
    padding: '8px 20px',
    backgroundColor: '#7C4DFF',
    color: '#FFF',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    transition: 'all 0.2s ease',
  },
  dialogCancel: {
    padding: '8px 20px',
    backgroundColor: '#555',
    color: '#EEE',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  calendarContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },
  arrowButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#7C4DFF',
    color: '#FFF',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    transition: 'all 0.2s ease',
    flexShrink: 0,
  },
  monthLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#EEE',
    minWidth: '100px',
    textAlign: 'center',
  },
  searchInput: {
    width: '200px',
    padding: '6px 10px',
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: '6px',
    color: '#EEE',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    marginLeft: 'auto',
  },
  weekdayRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  weekdayCell: {
    textAlign: 'center',
    padding: '6px 0',
    color: '#888',
    fontSize: '12px',
    fontWeight: 600,
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '2px',
  },
  calCell: {
    height: '80px',
    padding: '4px',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
  },
  emptyCalCell: {
    height: '80px',
    padding: '4px',
    borderRadius: '4px',
    backgroundColor: '#1A1A2E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDate: {
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1,
  },
  placeholder: {
    color: '#444',
    fontSize: '14px',
  },
  detailPanel: {
    display: 'flex',
    backgroundColor: '#2A2A2A',
    borderRadius: '8px',
    marginTop: '12px',
    minHeight: '200px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
  },
  detailAccent: {
    width: '2px',
    backgroundColor: '#7C4DFF',
    flexShrink: 0,
  },
  detailContent: {
    padding: '16px',
    flex: 1,
    overflowY: 'auto',
  },
  detailDate: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#7C4DFF',
    marginBottom: '12px',
  },
  emptyDetail: {
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
    padding: '32px 0',
  },
  detailItem: {
    marginBottom: '20px',
  },
  detailText: {
    color: '#CCC',
    fontSize: '14px',
    marginTop: '8px',
    lineHeight: '20px',
  },
};
