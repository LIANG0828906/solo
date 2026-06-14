import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TransportMode, TripRecord, TRANSPORT_OPTIONS } from './Types';
import {
  generateId,
  calculateEmission,
  calculateCarbonSaved,
  getToday,
  saveTrips,
} from './utils';

interface TripTrackerProps {
  trips: TripRecord[];
  onTripsChange: (trips: TripRecord[]) => void;
}

const highlightText = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark
        key={index}
        style={{
          backgroundColor: '#FFF59D',
          color: '#2E7D32',
          fontWeight: 600,
          padding: '0 2px',
          borderRadius: 2,
        }}
      >
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
};

const fuzzyMatch = (text: string, query: string): boolean => {
  if (!query.trim()) return true;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase().trim();

  if (lowerText.includes(lowerQuery)) return true;

  let queryIndex = 0;
  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      queryIndex++;
    }
  }

  return queryIndex === lowerQuery.length;
};

export const TripTracker: React.FC<TripTrackerProps> = ({ trips, onTripsChange }) => {
  const [selectedMode, setSelectedMode] = useState<TransportMode | ''>('');
  const [distance, setDistance] = useState<string>('');
  const [date, setDate] = useState<string>(getToday());
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<{ mode?: string; distance?: string; date?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = TRANSPORT_OPTIONS.filter(
    (opt) =>
      fuzzyMatch(opt.label, searchQuery) ||
      fuzzyMatch(opt.mode, searchQuery) ||
      fuzzyMatch(opt.label, searchQuery)
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!selectedMode) newErrors.mode = '请选择出行方式';
    const distNum = parseFloat(distance);
    if (!distance || isNaN(distNum) || distNum <= 0) {
      newErrors.distance = '请输入有效的距离（正数）';
    }
    if (!date) newErrors.date = '请选择日期';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const distNum = parseFloat(distance);
    const newTrip: TripRecord = {
      id: generateId(),
      mode: selectedMode as TransportMode,
      distance: distNum,
      date,
      carbonEmission: calculateEmission(selectedMode as TransportMode, distNum),
      carbonSaved: calculateCarbonSaved(selectedMode as TransportMode, distNum),
      createdAt: Date.now(),
    };

    const updatedTrips = [newTrip, ...trips];
    onTripsChange(updatedTrips);
    saveTrips(updatedTrips);

    setSelectedMode('');
    setDistance('');
    setDate(getToday());
    setSearchQuery('');
    setErrors({});
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleSelectMode = useCallback((mode: TransportMode) => {
    const opt = TRANSPORT_OPTIONS.find((o) => o.mode === mode);
    setSelectedMode(mode);
    setSearchQuery(opt ? opt.label : '');
    setDropdownOpen(false);
    inputRef.current?.blur();
  }, []);

  const handleInputClick = () => {
    setDropdownOpen(true);
    inputRef.current?.focus();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setDropdownOpen(true);

    if (value.trim()) {
      const exactMatch = TRANSPORT_OPTIONS.find(
        (opt) => opt.label === value || opt.mode === value.toLowerCase()
      );
      if (exactMatch) {
        setSelectedMode(exactMatch.mode);
      }
    } else {
      setSelectedMode('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredOptions.length > 0 && !selectedMode) {
      e.preventDefault();
      handleSelectMode(filteredOptions[0].mode);
    }
  };

  const handleDeleteTrip = (id: string) => {
    const updatedTrips = trips.filter((t) => t.id !== id);
    onTripsChange(updatedTrips);
    saveTrips(updatedTrips);
  };

  const selectedOption = TRANSPORT_OPTIONS.find((o) => o.mode === selectedMode);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>✏️ 记录出行</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div ref={dropdownRef} style={styles.formGroup}>
          <label style={styles.label}>出行方式</label>
          <div style={styles.dropdownContainer}>
            <div
              style={{
                ...styles.input,
                ...styles.selectInput,
                borderColor: errors.mode ? '#e74c3c' : dropdownOpen ? 'var(--primary-green)' : 'var(--border-light)',
                boxShadow: dropdownOpen ? '0 0 0 3px rgba(46, 125, 50, 0.1)' : 'none',
              }}
              onClick={handleInputClick}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索出行方式（如：步行、公交、地铁）..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                style={styles.searchInput}
                autoComplete="off"
              />
              <span
                style={{
                  ...styles.dropdownArrow,
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                ▼
              </span>
            </div>
            <div
              style={{
                ...styles.dropdown,
                maxHeight: dropdownOpen ? '320px' : '0px',
                opacity: dropdownOpen ? 1 : 0,
                pointerEvents: dropdownOpen ? 'auto' : 'none',
                overflow: dropdownOpen ? 'auto' : 'hidden',
              }}
            >
              {searchQuery.trim() !== '' && filteredOptions.length === 0 ? (
                <div style={styles.noResults}>
                  <span style={{ fontSize: 24, marginBottom: 8 }}>🔍</span>
                  <div>未找到匹配的出行方式</div>
                  <div style={{ fontSize: 12, color: 'var(--text-gray)', marginTop: 4 }}>
                    试试其他关键词，如：{TRANSPORT_OPTIONS.map((o) => o.label).join('、')}
                  </div>
                </div>
              ) : (
                filteredOptions.map((opt, index) => (
                  <div
                    key={opt.mode}
                    style={{
                      ...styles.dropdownItem,
                      opacity: 0,
                      animation: dropdownOpen ? `slideDown 0.3s ease ${index * 0.04}s forwards` : 'none',
                      backgroundColor: selectedMode === opt.mode ? 'rgba(46, 125, 50, 0.12)' : 'transparent',
                    }}
                    onClick={() => handleSelectMode(opt.mode)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        selectedMode === opt.mode ? 'rgba(46, 125, 50, 0.12)' : 'rgba(46, 125, 50, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        selectedMode === opt.mode ? 'rgba(46, 125, 50, 0.12)' : 'transparent';
                    }}
                  >
                    <span style={styles.dropdownIcon}>{opt.icon}</span>
                    <span style={styles.dropdownLabel}>
                      {highlightText(opt.label, searchQuery)}
                    </span>
                    <span style={{
                      ...styles.emissionTag,
                      backgroundColor: opt.isGreen ? 'rgba(46, 125, 50, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                      color: opt.isGreen ? 'var(--primary-green)' : '#e74c3c',
                    }}>
                      {opt.emissionFactor === 0 ? '零排放 ✓' : `${opt.emissionFactor} g CO₂/km`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          {errors.mode && <span style={styles.error}>⚠️ {errors.mode}</span>}
        </div>

        <div style={styles.divider} />

        <div style={styles.formGroup}>
          <label style={styles.label}>距离（公里）</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="请输入出行距离，如：2.5"
            style={{
              ...styles.input,
              borderColor: errors.distance ? '#e74c3c' : 'var(--border-light)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-green)';
              e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.distance ? '#e74c3c' : 'var(--border-light)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {errors.distance && <span style={styles.error}>⚠️ {errors.distance}</span>}
        </div>

        <div style={styles.divider} />

        <div style={styles.formGroup}>
          <label style={styles.label}>日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={getToday()}
            style={{
              ...styles.input,
              borderColor: errors.date ? '#e74c3c' : 'var(--border-light)',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-green)';
              e.target.style.boxShadow = '0 0 0 3px rgba(46, 125, 50, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = errors.date ? '#e74c3c' : 'var(--border-light)';
              e.target.style.boxShadow = 'none';
            }}
          />
          {errors.date && <span style={styles.error}>⚠️ {errors.date}</span>}
        </div>

        {selectedMode && distance && !isNaN(parseFloat(distance)) && parseFloat(distance) > 0 && (
          <div style={styles.preview}>
            <div style={styles.previewTitle}>
              {selectedOption?.icon} {selectedOption?.label} · {distance} 公里
            </div>
            <div style={styles.previewItem}>
              <span style={styles.previewLabel}>💨 预计碳排放：</span>
              <span style={{ ...styles.previewValue, color: '#e74c3c' }}>
                {calculateEmission(selectedMode, parseFloat(distance)).toFixed(2)} g CO₂
              </span>
            </div>
            <div style={styles.previewItem}>
              <span style={styles.previewLabel}>🌱 减少碳排放：</span>
              <span style={{ ...styles.previewValue, color: 'var(--primary-green)', fontWeight: 700 }}>
                {calculateCarbonSaved(selectedMode, parseFloat(distance)).toFixed(2)} g CO₂
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          style={styles.submitButton}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(46, 125, 50, 0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(46, 125, 50, 0.3)';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(0.98)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
          }}
        >
          提交记录 🌱
        </button>

        {showSuccess && <div style={styles.successMessage}>✅ 记录成功！为地球减碳贡献了一份力量！</div>}
      </form>

      {trips.length > 0 && (
        <div style={styles.tripList}>
          <h3 style={styles.listTitle}>📋 最近记录</h3>
          <div style={styles.listContainer}>
            {trips.slice(0, 5).map((trip, index) => {
              const opt = TRANSPORT_OPTIONS.find((o) => o.mode === trip.mode);
              return (
                <div
                  key={trip.id}
                  style={{
                    ...styles.tripItem,
                    animation: `fadeInUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.05}s both`,
                  }}
                >
                  <div style={styles.tripIcon}>{opt?.icon}</div>
                  <div style={styles.tripInfo}>
                    <div style={styles.tripMode}>{opt?.label}</div>
                    <div style={styles.tripMeta}>
                      {trip.distance}km · {trip.date}
                    </div>
                  </div>
                  <div style={styles.tripStats}>
                    <div style={{ ...styles.tripStat, color: '#e74c3c' }}>
                      💨 {trip.carbonEmission.toFixed(1)}g
                    </div>
                    <div style={{ ...styles.tripStat, color: 'var(--primary-green)' }}>
                      🌱 -{trip.carbonSaved.toFixed(1)}g
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    style={styles.deleteButton}
                    title="删除记录"
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = '#e74c3c';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.2)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-gray)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    boxShadow: 'var(--shadow-sm)',
    transition: 'var(--transition)',
    position: 'relative',
    animation: 'fadeIn 0.5s ease',
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginBottom: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formGroup: {
    position: 'relative',
  },
  divider: {
    height: 1,
    background: 'linear-gradient(90deg, transparent 0%, rgba(46, 125, 50, 0.15) 50%, transparent 100%)',
    margin: '4px 0',
  },
  label: {
    display: 'block',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-dark)',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: 15,
    border: '1.5px solid var(--border-light)',
    borderRadius: 10,
    outline: 'none',
    backgroundColor: '#fff',
    transition: 'var(--transition)',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  },
  selectInput: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    padding: '0 16px',
    cursor: 'text',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    flex: 1,
    fontSize: 15,
    backgroundColor: 'transparent',
    fontFamily: 'inherit',
    padding: '12px 0',
    width: '100%',
  },
  dropdownArrow: {
    color: 'var(--text-gray)',
    fontSize: 12,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 6,
    backgroundColor: '#fff',
    border: '1.5px solid var(--border-light)',
    borderRadius: 12,
    boxShadow: 'var(--shadow-lg)',
    zIndex: 1000,
    transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
    fontSize: 15,
  },
  dropdownIcon: {
    fontSize: 22,
    marginRight: 12,
    flexShrink: 0,
  },
  dropdownLabel: {
    flex: 1,
  },
  noResults: {
    padding: 24,
    textAlign: 'center',
    color: 'var(--text-gray)',
    fontSize: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emissionTag: {
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 8,
    whiteSpace: 'nowrap',
    fontWeight: 500,
  },
  error: {
    display: 'block',
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 6,
    fontWeight: 500,
  },
  preview: {
    background: 'linear-gradient(135deg, #F1F8E9 0%, #E8F5E9 100%)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    border: '1px solid rgba(46, 125, 50, 0.2)',
    animation: 'fadeIn 0.3s ease',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--primary-green)',
    marginBottom: 4,
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 13,
    color: 'var(--text-gray)',
  },
  previewValue: {
    fontSize: 14,
    fontWeight: 600,
  },
  submitButton: {
    width: '100%',
    padding: '14px 24px',
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    background: 'linear-gradient(135deg, #81C784 0%, #2E7D32 100%)',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
    fontFamily: 'inherit',
  },
  successMessage: {
    position: 'absolute',
    top: -60,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'var(--primary-green)',
    color: '#fff',
    padding: '10px 20px',
    borderRadius: 25,
    fontSize: 14,
    fontWeight: 500,
    animation: 'slideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'var(--shadow-md)',
    whiteSpace: 'nowrap',
    zIndex: 10,
  },
  tripList: {
    marginTop: 32,
    paddingTop: 24,
    borderTop: '1px solid var(--border-light)',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-dark)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  tripItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: 'var(--bg-gray)',
    borderRadius: 12,
    position: 'relative',
    transition: 'var(--transition)',
    opacity: 0,
  },
  tripIcon: {
    fontSize: 28,
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: 'var(--shadow-sm)',
  },
  tripInfo: {
    flex: 1,
  },
  tripMode: {
    fontSize: 15,
    fontWeight: 500,
    color: 'var(--text-dark)',
  },
  tripMeta: {
    fontSize: 13,
    color: 'var(--text-gray)',
    marginTop: 2,
  },
  tripStats: {
    textAlign: 'right',
    marginRight: 8,
  },
  tripStat: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.6,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 8,
    background: 'none',
    border: 'none',
    fontSize: 22,
    color: 'var(--text-gray)',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'all 0.2s ease',
    lineHeight: 1,
    fontWeight: 300,
  },
};

export default TripTracker;
