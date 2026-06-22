import React, { useState, useMemo } from 'react';

export interface DiaryEntry {
  date: string;
  text: string;
  keywords: string[];
  moodValue: number;
}

interface Props {
  entries: Record<string, DiaryEntry>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSubmit: (text: string) => void;
}

const WEEK_HEADERS = ['日', '一', '二', '三', '四', '五', '六'];

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: { date: string; day: number; isCurrentMonth: boolean }[] = [];

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const date = new Date(year, month - 1, d);
    days.push({ date: formatDate(date), day: d, isCurrentMonth: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    days.push({ date: formatDate(date), day: d, isCurrentMonth: true });
  }

  const rows = Math.ceil(days.length / 7);
  const totalCells = rows * 7;
  const remaining = totalCells - days.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    days.push({ date: formatDate(date), day: d, isCurrentMonth: false });
  }

  return days;
}

const MoodDiary: React.FC<Props> = ({
  entries,
  selectedDate,
  onSelectDate,
  onSubmit,
}) => {
  const [text, setText] = useState('');
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth.year, currentMonth.month),
    [currentMonth],
  );

  const monthLabel = `${currentMonth.year}年${currentMonth.month + 1}月`;

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: m };
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: m };
    });
  };

  const handleSubmit = () => {
    if (text.length < 50 || text.length > 200) return;
    onSubmit(text);
    setText('');
  };

  const charCount = text.length;
  const isLengthValid = charCount >= 50 && charCount <= 200;
  const selectedEntry = entries[selectedDate];

  return (
    <div style={styles.container}>
      <div style={styles.calendarSection}>
        <div style={styles.calendarHeader}>
          <button style={styles.navBtn} onClick={handlePrevMonth}>
            ‹
          </button>
          <span style={styles.monthLabel}>{monthLabel}</span>
          <button style={styles.navBtn} onClick={handleNextMonth}>
            ›
          </button>
        </div>
        <div style={styles.weekHeader}>
          {WEEK_HEADERS.map((h) => (
            <div key={h} style={styles.weekCell}>
              {h}
            </div>
          ))}
        </div>
        <div style={styles.calendarGrid}>
          {calendarDays.map((dayInfo) => {
            const hasEntry = !!entries[dayInfo.date];
            const isSelected = dayInfo.date === selectedDate;
            return (
              <div
                key={dayInfo.date}
                className={[
                  'calendar-cell',
                  hasEntry ? 'has-entry' : '',
                  isSelected ? 'selected' : '',
                  !dayInfo.isCurrentMonth ? 'other-month' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectDate(dayInfo.date)}
              >
                {dayInfo.day}
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.entrySection}>
        {selectedEntry ? (
          <div style={styles.entryDisplay}>
            <div style={styles.entryDate}>{selectedDate}</div>
            <p style={styles.entryText}>{selectedEntry.text}</p>
            {selectedEntry.keywords.length > 0 && (
              <div style={styles.keywordList}>
                {selectedEntry.keywords.map((kw) => (
                  <span key={kw} style={styles.keywordTag}>
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.emptyHint}>该日暂无日记记录，写下此刻的心情吧 ✨</div>
        )}
      </div>

      <div style={styles.inputSection}>
        <textarea
          className="mood-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="写下你现在的心情吧…（50-200字）"
          maxLength={200}
        />
        <div style={styles.inputFooter}>
          <span
            style={{
              ...styles.charCount,
              color: isLengthValid ? '#999' : '#FF6B6B',
            }}
          >
            {charCount}/200
          </span>
          <button
            style={{
              ...styles.submitBtn,
              opacity: isLengthValid ? 1 : 0.5,
              cursor: isLengthValid ? 'pointer' : 'not-allowed',
            }}
            disabled={!isLengthValid}
            onClick={handleSubmit}
          >
            记录心情
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  calendarSection: {
    marginBottom: '4px',
  },
  calendarHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '12px',
  },
  navBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #E0E0E0',
    background: '#fff',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'background 0.2s',
  },
  monthLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#333',
    minWidth: '120px',
    textAlign: 'center',
  },
  weekHeader: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 72px)',
    gap: '0',
    marginBottom: '4px',
  },
  weekCell: {
    width: '72px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    color: '#999',
    fontWeight: 500,
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 72px)',
    gap: '0',
  },
  entrySection: {
    minHeight: '80px',
  },
  entryDisplay: {
    background: '#FAFAFA',
    borderRadius: '12px',
    padding: '16px',
  },
  entryDate: {
    fontSize: '13px',
    color: '#999',
    marginBottom: '8px',
  },
  entryText: {
    fontSize: '15px',
    lineHeight: 1.7,
    color: '#444',
    marginBottom: '10px',
  },
  keywordList: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  keywordTag: {
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    background: '#E0F7E9',
    color: '#2E7D32',
  },
  emptyHint: {
    textAlign: 'center',
    color: '#bbb',
    fontSize: '14px',
    padding: '20px 0',
  },
  inputSection: {
    marginTop: '4px',
  },
  inputFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
  },
  charCount: {
    fontSize: '13px',
  },
  submitBtn: {
    padding: '10px 28px',
    borderRadius: '12px',
    border: 'none',
    background: '#7FDBDA',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    transition: 'opacity 0.2s',
  },
};

export default MoodDiary;
