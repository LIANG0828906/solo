interface NavBarProps {
  levelName: string;
  onRestart: () => void;
  onSettings: () => void;
}

const NavBar: React.FC<NavBarProps> = ({ levelName, onRestart, onSettings }) => {
  return (
    <div
      className="glass"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 28px',
        margin: 16,
        borderRadius: 16,
        pointerEvents: 'auto',
      }}
    >
      <div
        className="font-cinzel"
        style={{
          color: '#d4af37',
          fontSize: 18,
          fontWeight: 600,
          textShadow: '0 0 10px rgba(212,175,55,0.4)',
        }}
      >
        {levelName}
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button className="glass-button" onClick={onRestart}>
          <span style={{ fontSize: 14 }}>↻</span>
          重新开始
        </button>
        <button className="glass-button" onClick={onSettings}>
          <span style={{ fontSize: 14 }}>⚙</span>
          设置
        </button>
      </div>
    </div>
  );
};

export default NavBar;
