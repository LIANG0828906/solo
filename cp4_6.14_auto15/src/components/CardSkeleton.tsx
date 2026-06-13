export default function CardSkeleton() {
  return (
    <div style={{
      background: 'var(--card-bg)',
      borderRadius: 16,
      overflow: 'hidden',
      boxShadow: 'var(--shadow)',
    }}>
      <div className="skeleton" style={{
        width: '100%',
        aspectRatio: '4 / 3',
      }} />
      <div style={{ padding: 16 }}>
        <div className="skeleton" style={{
          height: 20,
          width: '70%',
          borderRadius: 6,
          marginBottom: 10,
        }} />
        <div className="skeleton" style={{
          height: 14,
          width: '90%',
          borderRadius: 4,
          marginBottom: 8,
        }} />
        <div className="skeleton" style={{
          height: 14,
          width: '50%',
          borderRadius: 4,
          marginBottom: 12,
        }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="skeleton" style={{
            height: 24,
            width: 50,
            borderRadius: 12,
          }} />
          <div className="skeleton" style={{
            height: 24,
            width: 50,
            borderRadius: 12,
          }} />
        </div>
      </div>
    </div>
  );
}
