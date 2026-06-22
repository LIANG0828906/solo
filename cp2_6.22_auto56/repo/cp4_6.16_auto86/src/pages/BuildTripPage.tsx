import React, { useState, useCallback } from 'react';
import { useTripStore } from '../store';
import type { ActivityType } from '../types';

const ACTIVITY_OPTIONS: { value: ActivityType; icon: string; label: string }[] = [
  { value: '城市漫步', icon: '🏙️', label: '城市漫步' },
  { value: '海滩度假', icon: '🏖️', label: '海滩度假' },
  { value: '徒步登山', icon: '🏔️', label: '徒步登山' },
  { value: '商务出差', icon: '💼', label: '商务出差' },
  { value: '滑雪旅行', icon: '⛷️', label: '滑雪旅行' },
];

const DEST_ICONS: Record<string, string> = {
  default: '📍',
  巴黎: '🗼', 东京: '⛩️', 纽约: '🗽', 伦敦: '🎡', 悉尼: '🦘',
  罗马: '🏛️', 曼谷: '🛕', 首尔: '🎎', 迪拜: '🕌', 马尔代夫: '🏝️',
  拉萨: '🏔️', 成都: '🐼', 北京: '🏯', 上海: '🌆', 广州: '🌺',
  三亚: '🌴', 丽江: '⛰️', 杭州: '🌿', 西安: '🏛️', 厦门: '🌊',
};

function getDestIcon(dest: string): string {
  return DEST_ICONS[dest] || DEST_ICONS.default;
}

const BuildTripPage: React.FC = () => {
  const { trips, addTrip, setCurrentTripId, removeTrip } = useTripStore();
  const [destination, setDestination] = useState('');
  const [days, setDays] = useState(3);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(['城市漫步']);
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newTripId, setNewTripId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ destination?: string; activityTypes?: string }>({});

  const toggleActivity = useCallback((type: ActivityType) => {
    setActivityTypes(prev => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== type);
      }
      return [...prev, type];
    });
    setErrors(prev => ({ ...prev, activityTypes: undefined }));
  }, []);

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDestination(e.target.value);
    if (errors.destination) {
      setErrors(prev => ({ ...prev, destination: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!destination.trim()) {
      newErrors.destination = '请输入目的地名称';
    }
    if (activityTypes.length === 0) {
      newErrors.activityTypes = '请至少选择一种活动类型';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    setIsGenerating(true);
    setNewTripId(null);

    await new Promise(resolve => setTimeout(resolve, 1200));

    const id = addTrip(destination.trim(), days, activityTypes);
    setNewTripId(id);
    setIsGenerating(false);

    setTimeout(() => setNewTripId(null), 600);
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 24px' }}>
      <header style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#4A90D9', marginBottom: 4 }}>
          🎒 NomadPack
        </h1>
        <p style={{ color: '#7A7A7A', fontSize: 16 }}>智能旅行打包清单 · 轻装出行</p>
      </header>

      <div style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E8E4DE',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: 32,
        marginBottom: 32,
      }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: '#2D2D2D' }}>
          创建新行程
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <label style={{ display: 'block', fontSize: 14, color: '#7A7A7A', marginBottom: 8 }}>
              目的地名称
            </label>
            <input
              type="text"
              value={destination}
              onChange={handleDestinationChange}
              placeholder="如：东京、巴黎、三亚..."
              className={errors.destination ? 'input-error' : ''}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: errors.destination ? '1px solid #E74C3C' : '1px solid #E8E4DE',
                fontSize: 15,
                outline: 'none',
                transition: '0.2s ease-out',
                background: errors.destination ? '#FFF5F5' : '#FAFAFA',
              }}
              onFocus={e => {
                if (!errors.destination) {
                  e.target.style.borderColor = '#4A90D9';
                  e.target.style.background = '#fff';
                }
              }}
              onBlur={e => {
                if (!errors.destination) {
                  e.target.style.borderColor = '#E8E4DE';
                  e.target.style.background = '#FAFAFA';
                }
              }}
            />
            {errors.destination && (
              <div className="error-text">{errors.destination}</div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 14, color: '#7A7A7A', marginBottom: 8 }}>
              旅行天数
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min={1}
                max={30}
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                style={{ flex: 1, accentColor: '#4A90D9' }}
              />
              <span style={{
                minWidth: 52,
                textAlign: 'center',
                padding: '6px 12px',
                background: '#4A90D9',
                color: '#fff',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
              }}>
                {days}天
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ fontSize: 14, color: '#7A7A7A' }}>
              活动类型 <span style={{ fontSize: 12, color: '#BFBFBF' }}>（可多选）</span>
            </label>
            <span style={{ fontSize: 12, color: '#D4A76A' }}>已选 {activityTypes.length} 种</span>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {ACTIVITY_OPTIONS.map(opt => {
              const isActive = activityTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleActivity(opt.value)}
                  className={`activity-tag ${isActive ? 'active' : ''}`}
                >
                  <span className="activity-tag-icon">{opt.icon}</span>
                  {opt.label}
                  {isActive && <span style={{ fontSize: 11, marginLeft: 2 }}>✓</span>}
                </button>
              );
            })}
          </div>
          {errors.activityTypes && (
            <div className="error-text" style={{ marginTop: 8 }}>{errors.activityTypes}</div>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`btn-generate ${isGenerating ? 'btn-generate-loading' : ''}`}
        >
          {isGenerating ? (
            <>
              <span className="spinner" />
              生成中...
            </>
          ) : (
            <>
              ✨ 生成打包清单
            </>
          )}
        </button>
      </div>

      <div>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 20, color: '#2D2D2D' }}>
          我的行程
        </h2>

        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🧳</div>
            <div className="empty-state-title">还没有行程</div>
            <div className="empty-state-desc">开始规划你的下一次旅行吧！</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {trips.map((trip, index) => {
              const totalItems = trip.items.length;
              const packedItems = trip.items.filter(i => i.packed).length;
              const totalWeight = trip.items.reduce((s, i) => s + i.weight * i.quantity, 0);
              const icon = getDestIcon(trip.destination);
              const isFlipped = flippedCard === trip.id;
              const isNew = newTripId === trip.id;

              return (
                <div
                  key={trip.id}
                  className={`flip-card ${isFlipped ? 'flipped' : ''} ${isNew ? 'slide-in-right' : ''}`}
                  style={{ height: 180 }}
                  onClick={() => {
                    if (!isFlipped) {
                      setFlippedCard(trip.id);
                      setTimeout(() => setFlippedCard(null), 1500);
                    } else {
                      setFlippedCard(null);
                    }
                  }}
                >
                  <div className="flip-card-inner">
                    <div className="flip-card-front" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 28 }}>{icon}</span>
                        <span style={{
                          fontSize: 12,
                          padding: '2px 8px',
                          background: '#D4A76A',
                          color: '#fff',
                          borderRadius: 6,
                          fontWeight: 600,
                        }}>
                          {trip.days}天
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{trip.destination}</div>
                        <div style={{ fontSize: 12, color: '#7A7A7A', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {trip.activityTypes.map((type, i) => (
                            <span key={type}>
                              {type}{i < trip.activityTypes.length - 1 ? '·' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button
                          onClick={e => { e.stopPropagation(); setCurrentTripId(trip.id); }}
                          style={{
                            flex: 1,
                            padding: '6px 0',
                            borderRadius: 8,
                            border: 'none',
                            background: '#4A90D9',
                            color: '#fff',
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: '0.2s ease-out',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#6BA6E3'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#4A90D9'}
                        >
                          查看清单
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); removeTrip(trip.id); }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 8,
                            border: '1px solid #E8E4DE',
                            background: '#fff',
                            color: '#E74C3C',
                            fontSize: 13,
                            cursor: 'pointer',
                            transition: '0.2s ease-out',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="flip-card-back" style={{ justifyContent: 'center', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 14, color: '#7A7A7A', textAlign: 'center' }}>物品统计</div>
                      <div style={{ fontSize: 32, fontWeight: 700, color: '#4A90D9' }}>{totalItems}</div>
                      <div style={{ fontSize: 13, color: '#7A7A7A' }}>件物品</div>
                      <div style={{ fontSize: 14, color: '#D4A76A', fontWeight: 600 }}>
                        {totalWeight.toFixed(1)} kg
                      </div>
                      <div style={{ fontSize: 12, color: '#7A7A7A' }}>
                        已打包 {packedItems}/{totalItems}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BuildTripPage;
