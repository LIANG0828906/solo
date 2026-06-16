import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useWardrobeStore } from '../store';
import { findMatchingOutfit } from '../utils/matching';
import { Season, Occasion, ClothingItem } from '../types';

const SEASONS: { value: Season; label: string }[] = [
  { value: 'spring', label: '春' },
  { value: 'summer', label: '夏' },
  { value: 'autumn', label: '秋' },
  { value: 'winter', label: '冬' },
];

const OCCASIONS: { value: Occasion; label: string }[] = [
  { value: 'daily', label: '日常' },
  { value: 'commute', label: '通勤' },
  { value: 'date', label: '约会' },
  { value: 'sport', label: '运动' },
];

export default function MixAndMatch() {
  const clothes = useWardrobeStore((s) => s.clothes);
  const addOutfit = useWardrobeStore((s) => s.addOutfit);

  const [selectedSeason, setSelectedSeason] = useState<Season>('spring');
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion>('daily');
  const [currentTop, setCurrentTop] = useState<ClothingItem | null>(null);
  const [currentBottom, setCurrentBottom] = useState<ClothingItem | null>(null);
  const [rating, setRating] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [shakeButton, setShakeButton] = useState(false);
  const [topSliding, setTopSliding] = useState(false);
  const [bottomSliding, setBottomSliding] = useState(false);
  const [bouncingStar, setBouncingStar] = useState<number | null>(null);

  const handleGenerate = useCallback(() => {
    const result = findMatchingOutfit(clothes, selectedSeason, selectedOccasion);
    if (result.error) {
      setShakeButton(true);
      setTimeout(() => setShakeButton(false), 500);
      return;
    }
    setCurrentTop(result.top);
    setCurrentBottom(result.bottom);
    setRating(0);
    setShowResult(true);
  }, [clothes, selectedSeason, selectedOccasion]);

  const handleReplaceItem = useCallback(
    (category: 'top' | 'bottom', currentItem: ClothingItem | null) => {
      const sameCategory = clothes.filter((c) => c.category === category);
      if (sameCategory.length <= 1) return;

      const others = sameCategory.filter((c) => c.id !== currentItem?.id);
      const newItem = others[Math.floor(Math.random() * others.length)];

      const setter = category === 'top' ? setCurrentTop : setCurrentBottom;
      const setSliding = category === 'top' ? setTopSliding : setBottomSliding;

      setSliding(true);
      setTimeout(() => {
        setter(newItem);
        setSliding(false);
      }, 300);
    },
    [clothes]
  );

  const handleStarClick = (star: number) => {
    setBouncingStar(star);
    setRating(star);
    setTimeout(() => setBouncingStar(null), 300);
  };

  const handleConfirmOutfit = () => {
    if (!currentTop || !currentBottom) return;
    addOutfit({
      id: uuidv4(),
      topId: currentTop.id,
      bottomId: currentBottom.id,
      season: selectedSeason,
      occasion: selectedOccasion,
      rating,
      createdAt: Date.now(),
    });
    setShowResult(false);
    setCurrentTop(null);
    setCurrentBottom(null);
    setRating(0);
  };

  const selectorBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    borderRadius: 12,
    border: active ? '2px solid #5C3A21' : '1px solid #D0C4B5',
    background: active ? '#5C3A21' : '#fff',
    color: active ? '#fff' : '#5C3A21',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  });

  const resultCardStyle = (sliding: boolean): React.CSSProperties => ({
    flex: 1,
    background: '#fff',
    border: '2px solid #5C3A21',
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    animation: sliding ? 'slideInLeft 0.3s ease forwards' : 'fadeIn 0.3s ease',
  });

  return (
    <div style={{ background: '#F5E6D3', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#5C3A21', marginBottom: 24, textAlign: 'center' }}>
          智能搭配
        </h1>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#5C3A21', marginBottom: 8, fontWeight: 600 }}>季节</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {SEASONS.map((s) => (
              <button key={s.value} style={selectorBtnStyle(selectedSeason === s.value)} onClick={() => setSelectedSeason(s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 14, color: '#5C3A21', marginBottom: 8, fontWeight: 600 }}>场合</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {OCCASIONS.map((o) => (
              <button key={o.value} style={selectorBtnStyle(selectedOccasion === o.value)} onClick={() => setSelectedOccasion(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 0',
            borderRadius: 12,
            border: 'none',
            background: '#5C3A21',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            animation: shakeButton ? 'shake 0.5s ease' : 'none',
            marginBottom: 24,
          }}
        >
          生成搭配
        </button>

        {showResult && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
              <div
                style={resultCardStyle(topSliding)}
                onClick={() => handleReplaceItem('top', currentTop)}
              >
                {currentTop ? (
                  <>
                    <img
                      src={currentTop.image}
                      alt={currentTop.name}
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>{currentTop.name}</p>
                      <p style={{ fontSize: 12, color: '#8D6E63', marginTop: 4 }}>上装 · 点击替换</p>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8D6E63' }}>无匹配上装</div>
                )}
              </div>

              <div
                style={resultCardStyle(bottomSliding)}
                onClick={() => handleReplaceItem('bottom', currentBottom)}
              >
                {currentBottom ? (
                  <>
                    <img
                      src={currentBottom.image}
                      alt={currentBottom.name}
                      style={{ width: '100%', height: 200, objectFit: 'cover' }}
                    />
                    <div style={{ padding: 12, textAlign: 'center' }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#3E2723' }}>{currentBottom.name}</p>
                      <p style={{ fontSize: 12, color: '#8D6E63', marginTop: 4 }}>下装 · 点击替换</p>
                    </div>
                  </>
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8D6E63' }}>无匹配下装</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => handleStarClick(star)}
                  style={{
                    fontSize: 32,
                    cursor: 'pointer',
                    color: star <= rating ? '#FFD700' : '#D0C4B5',
                    transition: 'transform 0.3s ease, color 0.2s ease',
                    animation: bouncingStar === star ? 'bounce 0.3s ease' : 'none',
                    userSelect: 'none',
                  }}
                >
                  ★
                </span>
              ))}
            </div>

            <button
              onClick={handleConfirmOutfit}
              style={{
                display: 'block',
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                border: '2px solid #5C3A21',
                background: '#fff',
                color: '#5C3A21',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              确认搭配
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
