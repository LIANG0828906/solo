import { useGameStore } from '@/store/gameStore';

export default function HUD() {
  const { collectedCount, timeElapsed } = useGameStore();

  return (
    <div
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: '8px',
        padding: '12px 16px',
        color: '#E8E0FF',
        fontSize: '14px',
        lineHeight: 1.8,
        pointerEvents: 'none',
      }}
    >
      <div>图腾：{collectedCount}/6</div>
      <div>用时：{timeElapsed.toFixed(1)}s</div>
    </div>
  );
}
