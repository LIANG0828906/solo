import { useCallback } from 'react';
import { useStore } from './store';
import SmellCard from './components/SmellCard';
import { useVirtualScroll } from './hooks/useVirtualScroll';
import type { Smell, Emotion } from './types';
import { EMOTION_COLORS, EMOTION_NAMES } from './types';

const EMOTIONS: Emotion[] = ['joy', 'nostalgia', 'tension', 'calm'];
const CARD_HEIGHT = 180;

export default function CollectionPage() {
  const {
    searchQuery,
    emotionFilter,
    setSearchQuery,
    setEmotionFilter,
    getFilteredSmells
  } = useStore();

  const filteredSmells = getFilteredSmells();

  const { containerRef, handleScroll, visibleItems, totalHeight } = useVirtualScroll(
    filteredSmells,
    {
      itemHeight: CARD_HEIGHT,
      gap: 16,
      overscan: 2
    }
  );

  const handleSelect = useCallback((smell: Smell) => {
    console.log('选中气味:', smell.name);
  }, []);

  const toggleEmotionFilter = useCallback((emotion: Emotion) => {
    setEmotionFilter(emotionFilter === emotion ? null : emotion);
  }, [emotionFilter, setEmotionFilter]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          marginBottom: '24px',
          flexShrink: 0
        }}
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索气味记忆..."
          style={{
            background: '#2C3E50',
            border: '2px solid #7F8C8D',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#ECF0F1',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#E74C3C';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#7F8C8D';
          }}
        />

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ color: '#7F8C8D', fontSize: '14px' }}>情感筛选:</span>
          {EMOTIONS.map((emotion) => {
            const isActive = emotionFilter === emotion;
            return (
              <button
                key={emotion}
                onClick={() => toggleEmotionFilter(emotion)}
                title={EMOTION_NAMES[emotion]}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  border: isActive ? '2px solid #FFFFFF' : '2px solid transparent',
                  backgroundColor: EMOTION_COLORS[emotion],
                  cursor: 'pointer',
                  transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 0.1s ease, border-color 0.1s ease',
                  boxSizing: 'border-box',
                  padding: 0
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = isActive ? 'scale(1.1)' : 'scale(1)';
                }}
              />
            );
          })}
          <span style={{ color: '#7F8C8D', fontSize: '14px', marginLeft: 'auto' }}>
            共 {filteredSmells.length} 条记忆
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          position: 'relative',
          willChange: 'transform'
        }}
      >
        {filteredSmells.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#7F8C8D',
              fontSize: '16px'
            }}
          >
            暂无匹配的气味记忆
          </div>
        ) : (
          <div style={{ height: totalHeight, position: 'relative' }}>
            {visibleItems.map(({ item, offsetY }) => (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: offsetY,
                  left: 0,
                  right: 0,
                  height: CARD_HEIGHT
                }}
              >
                <SmellCard smell={item} onSelect={handleSelect} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
