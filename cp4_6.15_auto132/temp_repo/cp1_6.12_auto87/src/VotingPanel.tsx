import React, { useState, useEffect, useMemo } from 'react';

interface TimeSlot { id: string; label: string; votes: number; }
interface Dish { id: string; name: string; description: string; image: string; votes: number; }
interface Song { id: string; title: string; artist: string; votes: number; }

interface EventData {
  id: string;
  code: string;
  name: string;
  dateTime: string;
  location: string;
  welcomeMessage: string;
  backgroundImage: string;
  timeSlots: TimeSlot[];
  dishes: Dish[];
  songs: Song[];
  createdAt: string;
}

interface Props {
  event: EventData;
  onVoted: (e: EventData) => void;
  voteCompleted: boolean;
  onShowResults: () => void;
}

const MACARON_COLORS = ['#A8D8EA', '#F7B8B8', '#D4B8E8', '#B8E8C4', '#FFD9A8', '#F7C5DB', '#C5D9F7', '#E5D4B8'];
const STACK_COLORS = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBE4', '#D4A5A5', '#A5D4D4'];

const VotingPanel: React.FC<Props> = ({ event, onVoted, voteCompleted, onShowResults }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [selectedSongs, setSelectedSongs] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [animStep, setAnimStep] = useState<'in' | 'out'>('in');

  const totalSteps = 3;
  const progress = voteCompleted ? 100 : ((currentStep) / totalSteps) * 100;

  const goNextStep = () => {
    setAnimStep('out');
    setTimeout(() => {
      if (currentStep < totalSteps - 1) {
        setCurrentStep((s) => s + 1);
      }
      setAnimStep('in');
    }, 250);
  };

  const toggleDish = (id: string) => {
    setSelectedDishes((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const toggleSong = (id: string) => {
    setSelectedSongs((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const handleSubmit = async () => {
    if (!selectedTime || selectedDishes.length === 0 || selectedSongs.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/event/${event.code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSlotId: selectedTime,
          dishIds: selectedDishes,
          songIds: selectedSongs,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onVoted(data.event);
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (voteCompleted && currentStep < totalSteps) {
      setCurrentStep(totalSteps);
    }
  }, [voteCompleted, currentStep]);

  const renderTimeBarChart = useMemo(() => {
    const maxVotes = Math.max(...event.timeSlots.map((s) => s.votes), 1);
    const total = event.timeSlots.reduce((s, x) => s + x.votes, 0);
    return (
      <div className="chart-section">
        <h3 className="chart-title">⏰ 时间段投票结果 {total > 0 && <span className="total-votes">（共 {total} 票）</span>}</h3>
        <div className="bar-chart">
          {event.timeSlots.map((slot, i) => (
            <div key={slot.id} className="bar-row">
              <div className="bar-label">{slot.label}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(slot.votes / maxVotes) * 100}%`,
                    backgroundColor: MACARON_COLORS[i % MACARON_COLORS.length],
                  }}
                />
                <span className="bar-count">{slot.votes} 票</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }, [event.timeSlots]);

  const renderDishStacked = useMemo(() => {
    const total = event.dishes.reduce((s, x) => s + x.votes, 0);
    const sorted = [...event.dishes].sort((a, b) => b.votes - a.votes);
    return (
      <div className="chart-section">
        <h3 className="chart-title">🍽️ 菜品投票结果 {total > 0 && <span className="total-votes">（共 {total} 票）</span>}</h3>
        <div className="stacked-container">
          <div className="stacked-legend">
            {event.dishes.map((d, i) => (
              <div key={d.id} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: STACK_COLORS[i % STACK_COLORS.length] }} />
                <span className="legend-name">{d.name}</span>
                <span className="legend-count">{d.votes}票</span>
              </div>
            ))}
          </div>
          <div className="stacked-bar-row">
            {total > 0 && (
              <div className="stacked-bar">
                {sorted.map((d, i) => {
                  const origIdx = event.dishes.findIndex((x) => x.id === d.id);
                  const pct = (d.votes / total) * 100;
                  return pct > 0 ? (
                    <div
                      key={d.id}
                      className="stacked-segment"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: STACK_COLORS[origIdx % STACK_COLORS.length],
                      }}
                      title={`${d.name}: ${d.votes}票`}
                    >
                      {pct > 8 && <span className="stacked-label">{Math.round(pct)}%</span>}
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {total === 0 && <div className="no-votes">暂无投票数据</div>}
          </div>
        </div>
      </div>
    );
  }, [event.dishes]);

  const renderSongStacked = useMemo(() => {
    const total = event.songs.reduce((s, x) => s + x.votes, 0);
    const sorted = [...event.songs].sort((a, b) => b.votes - a.votes);
    return (
      <div className="chart-section">
        <h3 className="chart-title">🎵 歌单投票结果 {total > 0 && <span className="total-votes">（共 {total} 票）</span>}</h3>
        <div className="stacked-container">
          <div className="stacked-legend">
            {event.songs.map((s, i) => (
              <div key={s.id} className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: MACARON_COLORS[i % MACARON_COLORS.length] }} />
                <span className="legend-name">
                  <strong>{s.title}</strong> <span className="artist">- {s.artist}</span>
                </span>
                <span className="legend-count">{s.votes}票</span>
              </div>
            ))}
          </div>
          <div className="stacked-bar-row">
            {total > 0 && (
              <div className="stacked-bar">
                {sorted.map((s, i) => {
                  const origIdx = event.songs.findIndex((x) => x.id === s.id);
                  const pct = (s.votes / total) * 100;
                  return pct > 0 ? (
                    <div
                      key={s.id}
                      className="stacked-segment"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: MACARON_COLORS[origIdx % MACARON_COLORS.length],
                      }}
                      title={`${s.title}: ${s.votes}票`}
                    >
                      {pct > 6 && <span className="stacked-label">{Math.round(pct)}%</span>}
                    </div>
                  ) : null;
                })}
              </div>
            )}
            {total === 0 && <div className="no-votes">暂无投票数据</div>}
          </div>
        </div>
      </div>
    );
  }, [event.songs]);

  if (voteCompleted) {
    return (
      <div className="voting-panel results-panel fade-in">
        {renderTimeBarChart}
        {renderDishStacked}
        {renderSongStacked}
      </div>
    );
  }

  return (
    <div className="voting-panel">
      <div className={`vote-step anim-${animStep}`}>
        {currentStep === 0 && (
          <div className="card question-card fade-in">
            <div className="question-header">
              <span className="question-badge">第 1 / 3 题</span>
              <h2 className="question-title">⏰ 选择你方便的时间段</h2>
              <p className="question-desc">请选择一个你最方便参加的时间段（单选）</p>
            </div>
            <div className="options-list time-options">
              {event.timeSlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`option-card ${selectedTime === slot.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTime(slot.id)}
                >
                  <div className="option-check">
                    <span className="radio-dot" />
                  </div>
                  <div className="option-content">
                    <div className="option-main">{slot.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="step-actions">
              <button
                className="primary-btn"
                onClick={goNextStep}
                disabled={!selectedTime}
              >
                下一题 →
              </button>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="card question-card fade-in">
            <div className="question-header">
              <span className="question-badge">第 2 / 3 题</span>
              <h2 className="question-title">🍽️ 选择你想吃的菜品</h2>
              <p className="question-desc">
                请选择你最想品尝的菜品（最多选 3 道）
                <span className={`selection-count ${selectedDishes.length >= 3 ? 'max' : ''}`}>
                  已选 {selectedDishes.length}/3
                </span>
              </p>
            </div>
            <div className="options-list dish-grid">
              {event.dishes.map((dish) => {
                const isSelected = selectedDishes.includes(dish.id);
                const disabled = !isSelected && selectedDishes.length >= 3;
                return (
                  <div
                    key={dish.id}
                    className={`dish-card option-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && toggleDish(dish.id)}
                  >
                    <div className="dish-image">
                      <img src={dish.image} alt={dish.name} />
                      {isSelected && <div className="dish-check-overlay">✓</div>}
                    </div>
                    <div className="dish-info">
                      <div className="dish-name">{dish.name}</div>
                      <div className="dish-desc">{dish.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="step-actions">
              <button className="secondary-btn" onClick={() => { setAnimStep('out'); setTimeout(() => { setCurrentStep(0); setAnimStep('in'); }, 250); }}>
                ← 上一题
              </button>
              <button
                className="primary-btn"
                onClick={goNextStep}
                disabled={selectedDishes.length === 0}
              >
                下一题 →
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="card question-card fade-in">
            <div className="question-header">
              <span className="question-badge">第 3 / 3 题</span>
              <h2 className="question-title">🎵 选择你想听的歌曲</h2>
              <p className="question-desc">
                请选择酒会时你想听的歌曲（最多选 4 首）
                <span className={`selection-count ${selectedSongs.length >= 4 ? 'max' : ''}`}>
                  已选 {selectedSongs.length}/4
                </span>
              </p>
            </div>
            <div className="options-list song-list">
              {event.songs.map((song, i) => {
                const isSelected = selectedSongs.includes(song.id);
                const disabled = !isSelected && selectedSongs.length >= 4;
                return (
                  <div
                    key={song.id}
                    className={`song-card option-card ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                    onClick={() => !disabled && toggleSong(song.id)}
                  >
                    <div className="song-index" style={{ backgroundColor: MACARON_COLORS[i % MACARON_COLORS.length] }}>
                      {i + 1}
                    </div>
                    <div className="song-info">
                      <div className="song-title">{song.title}</div>
                      <div className="song-artist">{song.artist}</div>
                    </div>
                    <div className="song-check">
                      <span className="check-box">{isSelected ? '✓' : ''}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="step-actions">
              <button className="secondary-btn" onClick={() => { setAnimStep('out'); setTimeout(() => { setCurrentStep(1); setAnimStep('in'); }, 250); }}>
                ← 上一题
              </button>
              <button
                className="primary-btn"
                onClick={handleSubmit}
                disabled={submitting || selectedSongs.length === 0}
              >
                {submitting ? '提交中...' : '🎉 提交投票'}
              </button>
              <button className="skip-btn" onClick={onShowResults}>
                仅查看结果
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-info">
          <span>进度</span>
          <span>{Math.min(currentStep + 1, totalSteps)} / {totalSteps} 题</span>
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VotingPanel;
