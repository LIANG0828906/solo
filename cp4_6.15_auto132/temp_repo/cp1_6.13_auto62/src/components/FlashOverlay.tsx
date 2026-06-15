export default function FlashOverlay({ visible }: { visible: boolean }) {
  return (
    <div
      className="flash-overlay"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }}
    />
  );
}
