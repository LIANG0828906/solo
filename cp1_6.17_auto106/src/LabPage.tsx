export default function LabPage() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '24px',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '500px'
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #9B59B6 0%, #3498DB 100%)',
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px'
          }}
        >
          🔬
        </div>
        <h1
          style={{
            color: '#ECF0F1',
            fontSize: '28px',
            fontWeight: 600,
            margin: '0 0 12px 0'
          }}
        >
          气味实验室
        </h1>
        <p
          style={{
            color: '#7F8C8D',
            fontSize: '16px',
            lineHeight: '1.8',
            margin: 0
          }}
        >
          这里即将开放，你可以在这里创建全新的气味记忆，
          <br />
          选择颜色、图案和情感标签，记录下属于你的独特嗅觉体验。
        </p>
      </div>
    </div>
  );
}
