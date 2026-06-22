import { useState, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWardrobeStore } from '../store';
import { Weather } from '../types';

const WEATHER_OPTIONS: { value: Weather; label: string }[] = [
  { value: 'sunny', label: '晴☀️' },
  { value: 'cloudy', label: '阴☁️' },
  { value: 'rainy', label: '雨🌧️' },
  { value: 'snowy', label: '雪❄️' },
];

const WEATHER_ICONS: Record<Weather, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  snowy: '❄️',
};

export default function DailyLog() {
  const dailyLogs = useWardrobeStore((s) => s.dailyLogs);
  const outfits = useWardrobeStore((s) => s.outfits);
  const clothes = useWardrobeStore((s) => s.clothes);
  const addDailyLog = useWardrobeStore((s) => s.addDailyLog);

  const [showForm, setShowForm] = useState(false);
  const [selectedOutfitId, setSelectedOutfitId] = useState('');
  const [photo, setPhoto] = useState('');
  const [note, setNote] = useState('');
  const [selectedWeather, setSelectedWeather] = useState<Weather>('sunny');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedLogs = [...dailyLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedOutfitId) return;
    addDailyLog({
      id: uuidv4(),
      outfitId: selectedOutfitId,
      photo,
      note,
      weather: selectedWeather,
      date: new Date().toISOString().slice(0, 10),
      createdAt: Date.now(),
    });
    setShowForm(false);
    setSelectedOutfitId('');
    setPhoto('');
    setNote('');
    setSelectedWeather('sunny');
  };

  const getOutfitLabel = (outfitId: string) => {
    const outfit = outfits.find((o) => o.id === outfitId);
    if (!outfit) return '未知搭配';
    const top = clothes.find((c) => c.id === outfit.topId);
    const bottom = clothes.find((c) => c.id === outfit.bottomId);
    return `${top?.name ?? '上装'} + ${bottom?.name ?? '下装'}`;
  };

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #D0C4B5',
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    width: '100%',
  };

  return (
    <div style={{ background: '#F5E6D3', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#5C3A21', marginBottom: 24, textAlign: 'center' }}>
          每日穿搭记录
        </h1>

        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              display: 'block',
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: '#5C3A21',
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: 32,
            }}
          >
            记录今日穿搭
          </button>
        ) : (
          <div
            style={{
              background: '#fff',
              border: '2px solid #5C3A21',
              borderRadius: 16,
              padding: 24,
              marginBottom: 32,
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5C3A21', marginBottom: 6 }}>
                选择搭配
              </label>
              <select
                value={selectedOutfitId}
                onChange={(e) => setSelectedOutfitId(e.target.value)}
                style={inputStyle}
              >
                <option value="">请选择搭配</option>
                {outfits.map((o) => (
                  <option key={o.id} value={o.id}>
                    {getOutfitLabel(o.id)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5C3A21', marginBottom: 6 }}>
                上传照片
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  ...inputStyle,
                  height: photo ? 'auto' : 80,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#8D6E63',
                  flexDirection: 'column',
                  gap: 4,
                  minHeight: 80,
                }}
              >
                {photo ? (
                  <img src={photo} alt="preview" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} />
                ) : (
                  <>
                    <span style={{ fontSize: 24 }}>📷</span>
                    <span style={{ fontSize: 13 }}>点击上传照片</span>
                  </>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5C3A21', marginBottom: 6 }}>
                穿搭心得（50字以内）
              </label>
              <textarea
                value={note}
                onChange={(e) => {
                  if (e.target.value.length <= 50) setNote(e.target.value);
                }}
                placeholder="写下今天的穿搭感受..."
                style={{ ...inputStyle, height: 80, resize: 'none' }}
              />
              <span style={{ fontSize: 12, color: '#8D6E63' }}>{note.length}/50</span>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 14, fontWeight: 600, color: '#5C3A21', marginBottom: 6 }}>
                天气
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {WEATHER_OPTIONS.map((w) => (
                  <button
                    key={w.value}
                    onClick={() => setSelectedWeather(w.value)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      border: selectedWeather === w.value ? '2px solid #5C3A21' : '1px solid #D0C4B5',
                      background: selectedWeather === w.value ? '#5C3A21' : '#fff',
                      color: selectedWeather === w.value ? '#fff' : '#5C3A21',
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleSubmit}
                disabled={!selectedOutfitId}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 12,
                  border: 'none',
                  background: selectedOutfitId ? '#5C3A21' : '#D0C4B5',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: selectedOutfitId ? 'pointer' : 'not-allowed',
                }}
              >
                提交记录
              </button>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 12,
                  border: '2px solid #5C3A21',
                  background: '#fff',
                  color: '#5C3A21',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        {sortedLogs.length > 0 && (
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div
              style={{
                position: 'absolute',
                left: 7,
                top: 0,
                bottom: 0,
                width: 1,
                background: '#D0C4B5',
              }}
            />
            {sortedLogs.map((log, index) => (
              <div
                key={log.id}
                style={{
                  position: 'relative',
                  marginBottom: index < sortedLogs.length - 1 ? 20 : 0,
                  animation: 'fadeIn 0.3s ease',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: -21,
                    top: 16,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: '#5C3A21',
                    border: '2px solid #F5E6D3',
                  }}
                />
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #E0D5C8',
                    borderRadius: 12,
                    padding: 16,
                    display: 'flex',
                    gap: 16,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: 28 }}>{WEATHER_ICONS[log.weather]}</div>
                    <div style={{ fontSize: 12, color: '#8D6E63', marginTop: 4 }}>{log.date}</div>
                  </div>
                  {log.photo && (
                    <img
                      src={log.photo}
                      alt="outfit"
                      style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, color: '#3E2723', marginBottom: 4, fontWeight: 600 }}>
                      {getOutfitLabel(log.outfitId)}
                    </p>
                    {log.note && (
                      <p style={{ fontSize: 13, color: '#8D6E63', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {sortedLogs.length === 0 && (
          <p style={{ textAlign: 'center', color: '#8D6E63', fontSize: 14, padding: '40px 0' }}>
            暂无穿搭记录，点击上方按钮开始记录吧
          </p>
        )}
      </div>
    </div>
  );
}
