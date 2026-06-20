interface ProgressBarProps {
  current: number;
  total: number;
  label: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, label }) => {
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px',
        borderRadius: 16,
        minWidth: 400,
        maxWidth: 600,
        pointerEvents: 'auto',
      }}
    >
      <span
        style={{
          color: '#d4af37',
          fontSize: 13,
          whiteSpace: 'nowrap',
          opacity: 0.85,
        }}
      >
        {label}
      </span>

      <div
        style={{
          flex: 1,
          height: 8,
          background: 'rgba(10,22,40,0.8)',
          borderRadius: 8,
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid rgba(212,175,55,0.15)',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #b8860b 0%, #d4af37 50%, #ffd700 100%)',
            borderRadius: 8,
            transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: '0 0 15px rgba(212,175,55,0.6), inset 0 0 8px rgba(255,215,0,0.3)',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 20,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5))',
              animation: 'pulse-glow 1.2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      <span
        style={{
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          minWidth: 50,
          textAlign: 'right',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {current}/{total}
      </span>
    </div>
  );
};

export default ProgressBar;
