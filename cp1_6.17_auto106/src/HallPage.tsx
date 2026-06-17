import { useStore } from './store';
import SmellCard from './components/SmellCard';
import type { Smell, Emotion } from './types';
import { EMOTION_COLORS, EMOTION_NAMES } from './types';

const EMOTIONS: Emotion[] = ['joy', 'nostalgia', 'tension', 'calm'];

export default function HallPage() {
  const { smells } = useStore();

  const getSmellsByEmotion = (emotion: Emotion): Smell[] => {
    return smells.filter((s) => s.emotion === emotion);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        boxSizing: 'border-box',
        gap: '24px'
      }}
    >
      <h1
        style={{
          color: '#ECF0F1',
          fontSize: '24px',
          fontWeight: 600,
          margin: 0,
          textAlign: 'center'
        }}
      >
        展厅概览
      </h1>

      {EMOTIONS.map((emotion, index) => {
        const emotionSmells = getSmellsByEmotion(emotion);
        const isLast = index === EMOTIONS.length - 1;

        return (
          <div
            key={emotion}
            style={{
              background: `linear-gradient(180deg, #1A252F 0%, #2C3E50 100%)`,
              borderRadius: '12px',
              padding: '24px',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  backgroundColor: EMOTION_COLORS[emotion]
                }}
              />
              <h2
                style={{
                  color: '#ECF0F1',
                  fontSize: '20px',
                  fontWeight: 600,
                  margin: 0
                }}
              >
                {EMOTION_NAMES[emotion]}展厅
              </h2>
              <span
                style={{
                  color: '#7F8C8D',
                  fontSize: '14px'
                }}
              >
                ({emotionSmells.length} 件藏品)
              </span>
            </div>

            {emotionSmells.length === 0 ? (
              <div
                style={{
                  color: '#7F8C8D',
                  fontSize: '14px',
                  padding: '40px 0',
                  textAlign: 'center'
                }}
              >
                暂无展品
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '16px'
                }}
              >
                {emotionSmells.map((smell) => (
                  <SmellCard key={smell.id} smell={smell} />
                ))}
              </div>
            )}

            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-12px',
                  left: '24px',
                  right: '24px',
                  height: '1px',
                  backgroundColor: '#7F8C8D',
                  opacity: 0.3
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
