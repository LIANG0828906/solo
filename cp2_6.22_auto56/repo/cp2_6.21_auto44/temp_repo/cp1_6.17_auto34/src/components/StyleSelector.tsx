import { useAppStore } from '@/store';
import { fontEffectLabels, fontEffectPreviewText, type FontEffectType } from '@/utils/fontEffects';

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: 10,
    overflowX: 'auto',
    padding: '8px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: '#444 transparent',
  },
  card: {
    minWidth: 120,
    height: 80,
    borderRadius: 8,
    background: '#2A2A2A',
    border: '2px solid transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s, transform 0.1s',
    flexShrink: 0,
    userSelect: 'none',
  },
  cardSelected: {
    minWidth: 120,
    height: 80,
    borderRadius: 8,
    background: '#FF6B00',
    border: '2px solid #FF6B00',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background 0.2s, border-color 0.2s, transform 0.1s',
    flexShrink: 0,
    userSelect: 'none',
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#E0E0E0',
    marginBottom: 4,
  },
  labelSelected: {
    fontSize: 14,
    fontWeight: 600,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  preview: {
    fontSize: 20,
    fontWeight: 700,
    color: '#888',
    fontFamily: '"Courier New", monospace',
  },
  previewSelected: {
    fontSize: 20,
    fontWeight: 700,
    color: '#FFFFFF',
    fontFamily: '"Courier New", monospace',
  },
};

const EFFECT_TYPES: FontEffectType[] = ['neon', 'pixel', 'handwritten', 'relief3d', 'glitch'];

const PREVIEW_COLORS: Record<FontEffectType, string> = {
  neon: '#FF6B00',
  pixel: '#00BFFF',
  handwritten: '#F5E6D0',
  relief3d: '#C0C0C0',
  glitch: '#FF0066',
};

export default function StyleSelector() {
  const style = useAppStore((s) => s.style);
  const setStyle = useAppStore((s) => s.setStyle);

  return (
    <div style={styles.container}>
      {EFFECT_TYPES.map((effectType) => {
        const isSelected = style === effectType;
        return (
          <div
            key={effectType}
            style={isSelected ? styles.cardSelected : styles.card}
            onClick={() => setStyle(effectType)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = '#FF6B00';
                e.currentTarget.style.transform = 'scale(1.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = isSelected ? 'scale(1)' : 'scale(1.03)';
            }}
          >
            <span style={isSelected ? styles.labelSelected : styles.label}>
              {fontEffectLabels[effectType]}
            </span>
            <span
              style={{
                ...(isSelected ? styles.previewSelected : styles.preview),
                color: isSelected ? '#FFFFFF' : PREVIEW_COLORS[effectType],
                textShadow: effectType === 'neon' && !isSelected ? `0 0 8px ${PREVIEW_COLORS[effectType]}` : 'none',
              }}
            >
              {fontEffectPreviewText[effectType]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
