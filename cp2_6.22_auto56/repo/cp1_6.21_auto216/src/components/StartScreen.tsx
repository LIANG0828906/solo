interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="screen-container">
      <h1
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '48px',
          color: '#E2E8F0',
          textShadow: '0 0 20px #3B82F6, 0 0 40px #3B82F6, 0 0 80px #3B82F6',
        }}
      >
        弹幕风暴
      </h1>
      <div
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: '11px',
          color: '#94A3B8',
          textAlign: 'center',
          lineHeight: '2.2',
        }}
      >
        <div>WSAD / Arrow Keys - Move</div>
        <div>Left Click - Shoot</div>
        <div>Right Click - Special</div>
      </div>
      <button className="game-button" onClick={onStart}>
        START
      </button>
    </div>
  );
}
