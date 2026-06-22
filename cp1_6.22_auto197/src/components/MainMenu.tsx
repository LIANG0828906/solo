interface MainMenuProps {
  onStart: () => void;
  completedCount: number;
  totalLevels: number;
}

export default function MainMenu({ onStart, completedCount, totalLevels }: MainMenuProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        padding: 40
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#E2E8F0',
            margin: 0,
            letterSpacing: 4,
            textShadow: '0 4px 24px rgba(99, 179, 237, 0.3)',
            lineHeight: 1.1
          }}
        >
          时空回溯
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 16
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              backgroundColor: '#63B3ED',
              opacity: 0.6,
              borderRadius: 2
            }}
          />
          <p
            style={{
              fontSize: 20,
              color: '#A0AEC0',
              margin: 0,
              fontWeight: 300
            }}
          >
            2D 平台跳跃解谜游戏
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '12px 24px',
          backgroundColor: 'rgba(99, 179, 237, 0.1)',
          border: '1px solid rgba(99, 179, 237, 0.3)',
          borderRadius: 12
        }}
      >
        <span style={{ fontSize: 20 }}>🎯</span>
        <span style={{ color: '#E2E8F0', fontSize: 14 }}>
          已通关 <strong style={{ color: '#68D391' }}>{completedCount}</strong> / {totalLevels} 关
        </span>
      </div>

      <button
        onClick={onStart}
        style={{
          padding: '18px 64px',
          fontSize: 20,
          fontWeight: 600,
          color: '#1A202C',
          backgroundColor: '#48BB78',
          border: 'none',
          borderRadius: 12,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 4px 16px rgba(72, 187, 120, 0.4)',
          letterSpacing: 2
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(72, 187, 120, 0.5)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(72, 187, 120, 0.4)';
        }}
      >
        开始游戏
      </button>

      <div
        style={{
          marginTop: 20,
          padding: 24,
          backgroundColor: 'rgba(26, 32, 44, 0.6)',
          border: '1px solid rgba(226, 232, 240, 0.1)',
          borderRadius: 16,
          maxWidth: 420
        }}
      >
        <h3
          style={{
            color: '#63B3ED',
            fontSize: 16,
            margin: '0 0 16px 0',
            fontWeight: 600
          }}
        >
          游戏机制
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <MechanicItem
            icon="⏱️"
            title="时间回溯"
            desc="按 T 记录操作，再按 T 回到过去并创建分身"
          />
          <MechanicItem
            icon="👥"
            title="分身协作"
            desc="半透明分身会自动复现你记录的动作"
          />
          <MechanicItem
            icon="🔧"
            title="机关解谜"
            desc="利用分身同时踩下压力板、推动方块开启机关"
          />
        </div>
      </div>
    </div>
  );
}

function MechanicItem({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ color: '#E2E8F0', fontSize: 14, fontWeight: 600 }}>{title}</div>
        <div style={{ color: '#718096', fontSize: 12, marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}
