import { useAppStore, VisualMode } from '../store/useAppStore';

interface TrackSelectorProps {
  onFileUpload: (file: File) => void;
  onSelectDemo: (index: number) => void;
}

const DEMO_TRACKS = [
  { name: '演示曲目 1 - 电子脉动', description: '强劲节拍与合成器' },
  { name: '演示曲目 2 - 梦幻氛围', description: '舒缓的环境音景' },
  { name: '演示曲目 3 - 交响史诗', description: '宏大的管弦乐章' },
  { name: '演示曲目 4 - 爵士律动', description: '轻柔的爵士即兴' },
  { name: '演示曲目 5 - 摇滚能量', description: '充满力量的摇滚' },
];

export const TrackSelector: React.FC<TrackSelectorProps> = ({ onFileUpload, onSelectDemo }) => {
  const { sidebarCollapsed } = useAppStore();
  const currentTrackName = useAppStore((s) => s.audioState.currentTrackName);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  const modeButtons: { mode: VisualMode; label: string; icon: string }[] = [
    { mode: 'waveform', label: '波形', icon: '〰' },
    { mode: 'nebula', label: '星云', icon: '✦' },
    { mode: 'explosion', label: '爆炸', icon: '✺' },
  ];

  const visualMode = useAppStore((s) => s.visualMode);
  const setVisualMode = useAppStore((s) => s.setVisualMode);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: sidebarCollapsed ? 0 : 200,
        overflow: 'hidden',
        transition: 'width 0.3s ease, opacity 0.3s ease',
        opacity: sidebarCollapsed ? 0 : 1,
        height: '100%',
        background: 'transparent',
      }}
    >
      <div style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
          {modeButtons.map(({ mode, label, icon }) => {
            const isActive = visualMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setVisualMode(mode)}
                title={label}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  border: isActive ? '2px solid #4ECDC4' : '2px solid transparent',
                  background: '#2A2A44',
                  color: isActive ? '#4ECDC4' : '#A0A0B8',
                  fontSize: 18,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
                  (e.currentTarget as HTMLButtonElement).style.background = '#3A3A5E';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  (e.currentTarget as HTMLButtonElement).style.background = '#2A2A44';
                }}
              >
                {icon}
              </button>
            );
          })}
        </div>

        <div style={{ borderTop: '1px solid #2A2A44', paddingTop: 12 }}>
          <div style={{ fontSize: 11, color: '#808098', marginBottom: 8, letterSpacing: 1 }}>预设曲目</div>
          <div
            style={{
              maxHeight: 260,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingRight: 4,
            }}
          >
            {DEMO_TRACKS.map((track, index) => {
              const isActive = currentTrackName === track.name;
              return (
                <button
                  key={index}
                  onClick={() => onSelectDemo(index)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: isActive ? '#2A2A54' : '#1E1E2E',
                    border: isActive ? '1px solid #4ECDC4' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    color: isActive ? '#FFFFFF' : '#C0C0D8',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
                    (e.currentTarget as HTMLButtonElement).style.background = '#2A2A48';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    (e.currentTarget as HTMLButtonElement).style.background = isActive ? '#2A2A54' : '#1E1E2E';
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#808098' }}>{track.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackSelector;
