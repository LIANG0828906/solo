import { AnnotationType } from '@/types';

interface FloatingToolbarProps {
  visible: boolean;
  position: { x: number; y: number };
  onSelect: (type: AnnotationType) => void;
}

export default function FloatingToolbar({ visible, position, onSelect }: FloatingToolbarProps) {
  if (!visible) return null;

  const buttons = [
    { type: 'highlight' as AnnotationType, color: '#FBBF24', icon: '✦' },
    { type: 'underline' as AnnotationType, color: '#34D399', icon: '～' },
    { type: 'comment' as AnnotationType, color: '#60A5FA', icon: '💬' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
        display: 'flex',
        alignItems: 'center',
        background: '#ffffff',
        borderRadius: '2px',
        border: '1px solid #6366F1',
        padding: '4px',
        gap: '4px',
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      }}
    >
      {buttons.map(({ type, color, icon }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '4px',
            border: 'none',
            background: 'transparent',
            color: color,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `${color}33`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {icon}
        </button>
      ))}
    </div>
  );
}
