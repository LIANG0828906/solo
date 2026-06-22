import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { X } from 'lucide-react';
import { useScentStore } from '../store';
import { EMOTION_COLORS, EMOTION_LABELS, CATEGORY_LABELS } from '../types';
import type { ScentCategory, EmotionTag, ScentMarker, ColorTexture } from '../types';
import {
  findScentEntry,
  getLastKeyword,
  getRandomPoem,
  getRandomSceneImage,
  getRandomColorTexture,
  getDefaultCategory,
  getDefaultEmotion,
} from '../data/scentPalette';

const getTodayDate = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

const ScentCard = () => {
  const isCardOpen = useScentStore((s) => s.isCardOpen);
  const setCardOpen = useScentStore((s) => s.setCardOpen);
  const selectedId = useScentStore((s) => s.selectedId);
  const markers = useScentStore((s) => s.markers);
  const pendingMarker = useScentStore((s) => s.pendingMarker);
  const addMarker = useScentStore((s) => s.addMarker);
  const selectMarker = useScentStore((s) => s.selectMarker);
  const setPendingMarker = useScentStore((s) => s.setPendingMarker);

  const selectedMarker = useMemo(
    () => (selectedId ? markers.find((m) => m.id === selectedId) : null),
    [selectedId, markers]
  );

  const isEditing = !!selectedMarker;

  const [date, setDate] = useState<string>(getTodayDate());
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<ScentCategory>(getDefaultCategory());
  const [emotionTag, setEmotionTag] = useState<EmotionTag>(getDefaultEmotion());
  const [isFlipped, setIsFlipped] = useState(false);
  const [savedData, setSavedData] = useState<{
    poem: string;
    id: string;
    createdAt: Date;
  } | null>(null);
  const [sceneImage, setSceneImage] = useState<string>(getRandomSceneImage());
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isCardOpen) {
      setImageLoaded(false);
      setSceneImage(getRandomSceneImage());
      if (selectedMarker) {
        setDate(selectedMarker.date);
        setDescription(selectedMarker.description);
        setCategory(selectedMarker.category);
        setEmotionTag(selectedMarker.emotionTag);
        setIsFlipped(true);
        setSavedData({
          poem: selectedMarker.poem,
          id: selectedMarker.id,
          createdAt: new Date(selectedMarker.createdAt),
        });
      } else {
        setDate(getTodayDate());
        setDescription('');
        setCategory(getDefaultCategory());
        setEmotionTag(getDefaultEmotion());
        setIsFlipped(false);
        setSavedData(null);
      }
    }
  }, [isCardOpen, selectedMarker]);

  useEffect(() => {
    const lastKeyword = getLastKeyword(description);
    if (lastKeyword) {
      const entry = findScentEntry(description);
      if (entry) {
        setCategory(entry.category);
        setEmotionTag(entry.emotionTag);
      }
    }
  }, [description]);

  const colorTexture: ColorTexture = useMemo(() => {
    const entry = findScentEntry(description);
    if (entry) return entry.colorTexture;
    if (selectedMarker) {
      return {
        colors: selectedMarker.recommendedColors,
        pattern: selectedMarker.pattern,
      };
    }
    return getRandomColorTexture(emotionTag);
  }, [description, selectedMarker, emotionTag]);

  const gridColors = useMemo(() => {
    const colors: string[] = [];
    const src = colorTexture.colors;
    for (let i = 0; i < 9; i++) {
      colors.push(src[i % src.length]);
    }
    return colors;
  }, [colorTexture.colors]);

  const handleSave = () => {
    if (!pendingMarker && !selectedMarker) return;
    if (!description.trim()) return;

    const lat = selectedMarker ? selectedMarker.lat : pendingMarker!.lat;
    const lng = selectedMarker ? selectedMarker.lng : pendingMarker!.lng;
    const mainColor = EMOTION_COLORS[emotionTag];
    const poem = getRandomPoem();
    const newId = uuidv4();

    if (!selectedMarker) {
      const newMarker: ScentMarker = {
        id: newId,
        lat,
        lng,
        date,
        description: description.trim(),
        category,
        emotionTag,
        color: mainColor,
        recommendedColors: colorTexture.colors,
        pattern: colorTexture.pattern,
        poem,
        createdAt: new Date(),
      };
      addMarker(newMarker);
      setSavedData({ poem, id: newId, createdAt: newMarker.createdAt });
    } else {
      setSavedData({
        poem: selectedMarker.poem,
        id: selectedMarker.id,
        createdAt: new Date(selectedMarker.createdAt),
      });
    }
    setIsFlipped(true);
  };

  const handleClose = () => {
    setCardOpen(false);
    selectMarker(null);
    setPendingMarker(null);
    setIsFlipped(false);
  };

  const handleRecreate = () => {
    setIsFlipped(false);
    if (selectedMarker) {
      selectMarker(null);
      setDescription('');
    }
  };

  if (!isCardOpen) return null;

  const markerColor = EMOTION_COLORS[emotionTag];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '100%',
        height: '100%',
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(15, 52, 96, 0.4)',
          backdropFilter: 'blur(2px)',
          pointerEvents: 'auto',
          transition: 'opacity 0.3s ease',
        }}
      />

      <div
        className="slide-in-right"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: '100%',
          maxWidth: 400,
          padding: 20,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div
          className="card-flip-container"
          style={{ width: '100%', height: 'auto', minHeight: 560 }}
        >
          <div className={`card-flip-inner ${isFlipped ? 'flipped' : ''}`}
               style={{ minHeight: 560 }}>
            <div
              className="card-face card-front"
              style={{
                background: '#16213E',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', height: 200, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                {!imageLoaded && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #1A1A2E, #16213E)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#E0D9CF', fontSize: 14,
                  }}>加载景致中...</div>
                )}
                <img
                  src={sceneImage}
                  alt="scene"
                  onLoad={() => setImageLoaded(true)}
                  className="fade-in"
                  style={{
                    width: '100%', height: '100%', objectFit: 'cover',
                    opacity: imageLoaded ? 1 : 0, transition: 'opacity 0.5s ease',
                  }}
                />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(22, 33, 62, 0.9), transparent 60%)',
                }} />
                <button
                  onClick={handleClose}
                  style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.4)', border: 'none',
                    color: '#E0D9CF', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <X size={16} />
                </button>
                <div style={{
                  position: 'absolute', bottom: 12, left: 16, right: 16,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: markerColor,
                    boxShadow: `0 0 8px ${markerColor}`,
                  }} />
                  <span style={{ color: '#E0D9CF', fontSize: 13, opacity: 0.85 }}>
                    {CATEGORY_LABELS[category]} · {EMOTION_LABELS[emotionTag]}
                  </span>
                </div>
              </div>

              <div style={{
                padding: 20, flex: 1,
                display: 'flex', flexDirection: 'column', gap: 16,
                overflowY: 'auto',
              }} className="scent-custom-scrollbar">
                <div>
                  <label style={{ color: 'rgba(224, 217, 207, 0.6)', fontSize: 12, marginBottom: 6, display: 'block' }}>
                    日期
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, color: '#E0D9CF', fontSize: 14,
                      outline: 'none', transition: 'all 0.3s ease',
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: 'rgba(224, 217, 207, 0.6)', fontSize: 12, marginBottom: 6, display: 'block' }}>
                    气味描述
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="描述你闻到的气味..."
                    rows={3}
                    style={{
                      width: '100%', padding: '10px 12px',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, color: '#E0D9CF', fontSize: 16,
                      outline: 'none', transition: 'all 0.3s ease',
                      resize: 'none', fontFamily: 'inherit',
                      lineHeight: 1.5,
                    }}
                    onFocus={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = '#E94560';
                    }}
                    onBlur={(e) => {
                      (e.target as HTMLTextAreaElement).style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  />
                </div>

                <div>
                  <label style={{ color: 'rgba(224, 217, 207, 0.6)', fontSize: 12, marginBottom: 8, display: 'block' }}>
                    推荐颜色与纹理
                  </label>
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(3, 64px)',
                    gap: 2, justifyContent: 'flex-start',
                  }}>
                    {gridColors.map((color, i) => (
                      <div
                        key={i}
                        style={{
                          width: 64, height: 64,
                          background: `${color} ${colorTexture.pattern ? ', ' + colorTexture.pattern : ''}`.trim(),
                          backgroundBlendMode: 'overlay',
                          borderRadius: 4,
                          transition: 'all 0.3s ease',
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={!description.trim()}
                  style={{
                    marginTop: 'auto', padding: '14px 20px',
                    background: description.trim()
                      ? 'linear-gradient(135deg, #E94560, #FF6B6B)'
                      : 'rgba(255,255,255,0.1)',
                    border: 'none', borderRadius: 10,
                    color: 'white', fontSize: 15, fontWeight: 600,
                    cursor: description.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                    letterSpacing: 0.5,
                  }}
                >
                  {isEditing ? '查看卡片' : '保存气味记忆'}
                </button>
              </div>
            </div>

            <div
              className="card-face card-back"
              style={{
                background: '#16213E',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: 32,
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 24,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: selectedMarker ? selectedMarker.color : EMOTION_COLORS[emotionTag],
                    boxShadow: `0 0 12px ${selectedMarker ? selectedMarker.color : EMOTION_COLORS[emotionTag]}`,
                  }} />
                  <span style={{
                    color: 'rgba(224, 217, 207, 0.5)', fontSize: 11,
                    letterSpacing: 2, textTransform: 'uppercase',
                  }}>
                    SCENT MEMORY
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)', border: 'none',
                    color: 'rgba(224, 217, 207, 0.6)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              <div style={{
                flex: 1,
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 2, marginBottom: 24,
              }}>
                {gridColors.map((color, i) => (
                  <div
                    key={i}
                    style={{
                      background: `${color} ${colorTexture.pattern ? ', ' + colorTexture.pattern : ''}`.trim(),
                      backgroundBlendMode: 'overlay',
                      borderRadius: 2,
                    }}
                  />
                ))}
              </div>

              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16, lineHeight: 1.8,
                color: '#E0D9CF',
                textAlign: 'center',
                marginBottom: 28,
                fontStyle: 'italic',
                padding: '0 8px',
              }}>
                "{savedData?.poem || selectedMarker?.poem || '所有气味都是一把钥匙，打开某扇被遗忘的门。'}"
              </div>

              <div style={{
                display: 'flex', flexDirection: 'column',
                gap: 6, alignItems: 'center',
                paddingTop: 20,
                borderTop: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{
                  color: 'rgba(224, 217, 207, 0.4)',
                  fontSize: 11, letterSpacing: 2,
                  textTransform: 'uppercase',
                }}>
                  No. {savedData?.id?.slice(0, 8) || selectedMarker?.id?.slice(0, 8)}
                </div>
                <div style={{ color: 'rgba(224, 217, 207, 0.6)', fontSize: 12 }}>
                  {savedData?.createdAt?.toLocaleString('zh-CN') || selectedMarker?.createdAt?.toLocaleString('zh-CN')}
                </div>
              </div>

              <button
                onClick={handleRecreate}
                style={{
                  marginTop: 20, padding: '12px 20px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: 'rgba(224, 217, 207, 0.8)',
                  fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                创建新的气味记忆
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScentCard;
