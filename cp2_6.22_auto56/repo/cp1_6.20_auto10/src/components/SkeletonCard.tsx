const SkeletonCard = () => {
  return (
    <div
      style={{
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#1e1e2e',
        border: '1px solid #313244',
      }}
    >
      <div
      style={{
        width: '100%',
        height: '180px',
        background: 'linear-gradient(90deg, #313244 25%, #45475a 50%, #313244 75%)',
        backgroundSize: '200% 100%',
        animation: 'pulse 1.5s infinite',
      }}
    />
    <div style={{ padding: '16px' }}>
      <div
        style={{
          height: '24px',
          width: '70%',
          borderRadius: '4px',
          background: 'linear-gradient(90deg, #313244 25%, #45475a 50%, #313244 75%)',
          backgroundSize: '200% 100%',
          animation: 'pulse 1.5s infinite',
          marginBottom: '12px',
        }}
      />
      <div
        style={{
          height: '20px',
          width: '40%',
          borderRadius: '4px',
          background: 'linear-gradient(90deg, #313244 25%, #45475a 50%, #313244 75%)',
          backgroundSize: '200% 100%',
          animation: 'pulse 1.5s infinite',
          marginBottom: '12px',
        }}
      />
      <div
        style={{
          display: 'flex',
          gap: '16px',
        }}
      >
        <div
          style={{
            height: '16px',
            width: '60px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, #313244 25%, #45475a 50%, #313244 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s infinite',
          }}
        />
        <div
          style={{
            height: '16px',
            width: '60px',
            borderRadius: '4px',
            background: 'linear-gradient(90deg, #313244 25%, #45475a 50%, #313244 75%)',
            backgroundSize: '200% 100%',
            animation: 'pulse 1.5s infinite',
          }}
        />
      </div>
    </div>
    <style>{`
      @keyframes pulse {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
  );
};

export default SkeletonCard;
