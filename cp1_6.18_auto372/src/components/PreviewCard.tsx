import type { LayoutScheme, DecorElement } from '../types';

interface PreviewCardProps {
  scheme: LayoutScheme;
  text: string;
  onClick: () => void;
  selected?: boolean;
}

function DecorRender({ elements }: { elements: DecorElement[] }) {
  return (
    <>
      {elements.map((el, idx) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          left: `${(el.position.x / 1080) * 100}%`,
          top: `${(el.position.y / 1080) * 100}%`,
          width: `${(el.size.width / 1080) * 100}%`,
          height: `${(el.size.height / 1080) * 100}%`,
          background: el.color,
          transform: `translate(-50%, -50%)${el.rotation ? ` rotate(${el.rotation}deg)` : ''}`,
          borderRadius: el.type === 'circle' ? '50%' : 0,
          opacity: 0.7,
          pointerEvents: 'none',
        };
        return <div key={idx} style={style} />;
      })}
    </>
  );
}

export default function PreviewCard({ scheme, text, onClick, selected }: PreviewCardProps) {
  const bgStyle: React.CSSProperties = scheme.backgroundColor.startsWith('linear')
    ? { background: scheme.backgroundColor }
    : { background: scheme.backgroundColor };

  return (
    <div
      onClick={onClick}
      style={{
        width: 180,
        height: 180,
        borderRadius: 8,
        border: `2px solid ${selected ? '#FF8C42' : '#E0E0E0'}`,
        overflow: 'hidden',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: selected ? '0 4px 16px rgba(255,140,66,0.25)' : '0 2px 6px rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease-in-out',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 18px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = selected
          ? '0 4px 16px rgba(255,140,66,0.25)'
          : '0 2px 6px rgba(0,0,0,0.06)';
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          ...bgStyle,
        }}
      >
        {scheme.decorElements && <DecorRender elements={scheme.decorElements} />}
        <div
          style={{
            position: 'absolute',
            left: `${(scheme.textPosition.x / 1080) * 100}%`,
            top: `${(scheme.textPosition.y / 1080) * 100}%`,
            transform: `translate(-50%, -50%) rotate(${scheme.rotation}deg)`,
            fontFamily: scheme.fontFamily,
            fontSize: `${Math.max(10, (scheme.fontSize / 1080) * 180)}px`,
            color: scheme.textColor,
            opacity: scheme.opacity,
            textAlign: scheme.textAlign,
            maxWidth: '90%',
            wordBreak: 'break-all',
            lineHeight: 1.3,
            pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
          }}
        >
          {text.slice(0, 20)}{text.length > 20 ? '...' : ''}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 8,
          bottom: 8,
          fontSize: 11,
          color: '#FFF',
          background: 'rgba(0,0,0,0.55)',
          padding: '2px 8px',
          borderRadius: 4,
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
        }}
      >
        {scheme.name}
      </div>
    </div>
  );
}
