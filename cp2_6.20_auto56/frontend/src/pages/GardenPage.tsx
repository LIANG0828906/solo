import GardenMap from '../modules/garden/GardenMap'

function GardenPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
        borderRadius: 'var(--radius-lg)',
        padding: 16,
        boxShadow: 'var(--shadow-soft)',
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>🌳 萌宠花园</h2>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
          在这里与其他玩家的宠物互动吧！点击宠物可以打招呼、跳舞或送礼物
        </p>
      </div>
      <GardenMap />
    </div>
  )
}

export default GardenPage
