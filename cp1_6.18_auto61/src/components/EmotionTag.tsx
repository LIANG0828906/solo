import type { EmotionType } from '@/types';
import { EMOTION_COLORS, EMOTION_LABELS } from '@/types';

interface EmotionTagProps {
  emotion: EmotionType;
  intensity?: number;
  size?: 'small' | 'medium' | 'large';
}

export default function EmotionTag({
  emotion,
  intensity,
  size = 'medium',
}: EmotionTagProps) {
  const color = EMOTION_COLORS[emotion];
  const label = EMOTION_LABELS[emotion];

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      fontSize: '12px',
      padding: '2px 8px',
      borderRadius: '4px',
    },
    medium: {
      fontSize: '14px',
      padding: '4px 12px',
      borderRadius: '6px',
    },
    large: {
      fontSize: '24px',
      fontWeight: 'bold',
      padding: '8px 24px',
      borderRadius: '8px',
    },
  };

  return (
    <span
      style={{
        ...styles.tag,
        ...sizeStyles[size],
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
      {intensity !== undefined && size !== 'small' && (
        <span style={styles.intensity}>
          强度 {Math.round(intensity * 100)}%
        </span>
      )}
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
  },
  intensity: {
    fontSize: '12px',
    opacity: 0.7,
    fontWeight: 400,
  },
};
