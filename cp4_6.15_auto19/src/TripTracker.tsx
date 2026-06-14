import React, { useState, useRef, useEffect } from 'react';
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
      opt.label.includes(searchQuery) ||
      opt.mode.includes(searchQuery.toLowerCase()) ||
      searchQuery === ''
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

  const handleSelectMode = (mode: TransportMode) => {
    const opt = TRANSPORT_OPTIONS.find((o) => o.mode === mode);
    setSelectedMode(mode);
    setSearchQuery(opt ? opt.label : '');
    setDropdownOpen(false);
  };

  const handleInputClick = () => {
    setDropdownOpen(true);
    if (!selectedMode) {
      inputRef.current?.focus();
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setDropdownOpen(true);
    const matched = TRANSPORT_OPTIONS.find(
      (opt) => opt.label === value || opt.mode === value.toLowerCase()
    );
    if (matched) {
      setSelectedMode(matched.mode);
    } else {
      setSelectedMode('');
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
                borderColor: errors.mode ? '#e74c3c' : 'var(--border-light)',
              }}
              onClick={handleInputClick}
            >
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索出行方式（如：步行、公交）..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setDropdownOpen(true)}
                style={styles.searchInput}
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
                maxHeight: dropdownOpen ? '300px' : '0px',
                opacity: dropdownOpen ? 1 : 0,
                pointerEvents: dropdownOpen ? 'auto' : 'none',
              }}
            >
              {filteredOptions.length === 0 ? (
                <div style={styles.noResults}>未找到匹配的出行方式</div>
              ) : (
                filteredOptions.map((opt, index) => (
                  <div
                    key={opt.mode}
                    style={{
                      ...styles.dropdownItem,
                      animation: dropdownOpen ? `slideDown 0.3s ease ${index * 0.03}s both` : 'none',
                      backgroundColor: selectedMode === opt.mode ? 'rgba(46, 125, 50, 0.1)' : 'transparent',
                    }}
                    onClick={() => handleSelectMode(opt.mode)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(46, 125, 50, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor =
                        selectedMode === opt.mode ? 'rgba(46, 125, 50, 0.1)' : 'transparent';
                    }}
                  >
                    <span style={{ fontSize: 20, marginRight: 12 }}>{opt.icon}</span>
                    <span style={{ flex: 1 }}>{opt.label}</span>
                    <span style={styles.emissionTag}>
                      {opt.emissionFactor === 0 ? '零排放' : `${opt.emissionFactor} g CO₂/km`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          {errors.mode && <span style={styles.error}>{errors.mode}</span>}
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
            placeholder="请输入出行距离"
            style={{
              ...styles.input,
              borderColor: errors.distance ? '#e74c3c' : 'var(--border-light)',
            }}
          />
          {errors.distance && <span style={styles.error}>{errors.distance}</span>}
        </div>

        <div style={styles.divider} />

        <div style={styles.formGroup}>
          <label style={styles.label}>日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              ...styles.input,
              borderColor: errors.date ? '#e74c3c' : 'var(--border-light)',
            }}
          />
          {errors.date && <span style={styles.error}>{errors.date}</span>}
        </div>

        {selectedMode && distance && !isNaN(parseFloat(distance)) && parseFloat(distance) > 0 && (
          <div style={styles.preview}>
            <div style={styles.previewItem}>
              <span style={styles.previewLabel}>预计碳排放：</span>
              <span style={{ ...styles.previewValue, color: '#e74c3c' }}>
                {calculateEmission(selectedMode, parseFloat(distance)).toFixed(2)} g CO₂
              </span>
            </div>
            <div style={styles.previewItem}>
              <span style={styles.previewLabel}>减碳量：</span>
              <span style={{ ...styles.previewValue, color: 'var(--primary-green)' }}>
                {calculateCarbonSaved(selectedMode, parseFloat(distance)).toFixed(2)} g CO₂
              </span>
            </div>
          </div>
        )}

        <button type="submit" style={styles.submitButton}>
          提交记录 🌱
        </button>

        {showSuccess && <div style={styles.successMessage}>记录成功！🌱</div>}
      </form>

      {trips.length > 0 && (
        <div style={styles.tripList}>
          <h3 style={styles.listTitle}>最近记录</h3>
          <div style={styles.listContainer}>
            {trips.slice(0, 5).map((trip, index) => {
              const opt = TRANSPORT_OPTIONS.find((o) => o.mode === trip.mode);
              return (
                <div
                  key={trip.id}
                  style={{
                    ...styles.tripItem,
                    animation: `fadeInUp 0.4s ease ${index * 0.05}s both`,
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
                      {trip.carbonEmission.toFixed(1)}g
                    </div>
                    <div style={{ ...styles.tripStat, color: 'var(--primary-green)' }}>
                      -{trip.carbonSaved.toFixed(1)}g
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteTrip(trip.id)}
                    style={styles.deleteButton}
                    title="删除记录"
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
    background: 'linear-gradient(90deg, transparent 0%, rgba(46, 125, 50, 0.1) 50%, transparent 100%)',
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
    transition: 'transform 0.3s ease',
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
    marginTop: 4,
    backgroundColor: '#fff',
    border: '1.5px solid var(--border-light)',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
    zIndex: 100,
    transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
    borderBottom: '1px solid var(--border-light)',
    fontSize: 15,
    opacity: 0,
  },
  noResults: {
    padding: 16,
    textAlign: 'center',
    color: 'var(--text-gray)',
    fontSize: 14,
  },
  emissionTag: {
    fontSize: 12,
    color: 'var(--text-gray)',
    backgroundColor: 'var(--bg-gray)',
    padding: '4px 8px',
    borderRadius: 6,
    whiteSpace: 'nowrap',
  },
  error: {
    display: 'block',
    color: '#e74c3c',
    fontSize: 12,
    marginTop: 4,
  },
  preview: {
    backgroundColor: 'var(--bg-gray)',
    borderRadius: 10,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 14,
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
    transition: 'var(--transition)',
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
    animation: 'fadeIn 0.3s ease',
    boxShadow: 'var(--shadow-md)',
    whiteSpace: 'nowrap',
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
    borderRadius: 10,
    position: 'relative',
  },
  tripIcon: {
    fontSize: 28,
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
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
    lineHeight: 1.4,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 8,
    background: 'none',
    border: 'none',
    fontSize: 20,
    color: 'var(--text-gray)',
    cursor: 'pointer',
    padding: '4px 8px',
    transition: 'color 0.2s ease',
    lineHeight: 1,
  },
};

export default TripTracker;
