import { useGameStore } from './store'

const LanternScene = () => {
  const { lanterns, currentModal, actions } = useGameStore()

  const handleLanternClick = (lanternId: number) => {
    if (currentModal.isOpen) return
    setTimeout(() => {
      actions.openModal(lanternId)
    }, 150)
  }

  return (
    <div
      style={{
        width: '1000px',
        height: '600px',
        backgroundColor: '#4A4A4A',
        position: 'relative',
        overflow: 'hidden',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '150px',
          height: '100%',
          background: 'linear-gradient(to right, #2C2C2C, #3D3D3D)',
          borderRight: '3px solid #1A1A1A',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '150px',
          height: '100%',
          background: 'linear-gradient(to left, #2C2C2C, #3D3D3D)',
          borderLeft: '3px solid #1A1A1A',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '150px',
          right: '150px',
          height: '200px',
          background: `
            repeating-linear-gradient(
              90deg,
              #8B7355 0px,
              #8B7355 50px,
              #7A6548 50px,
              #7A6548 100px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              transparent 25px,
              #5C4A3A 25px,
              #5C4A3A 28px
            )
          `,
          backgroundBlendMode: 'multiply',
        }}
      />
      {lanterns.map((lantern) => (
        <div
          key={lantern.id}
          onClick={() => handleLanternClick(lantern.id)}
          style={{
            position: 'absolute',
            left: `${lantern.position.x}px`,
            top: `${lantern.position.y}px`,
            width: '45px',
            height: '45px',
            borderRadius: '50%',
            backgroundColor: lantern.isLit ? '#FFD700' : '#D4A373',
            cursor: 'pointer',
            transition: 'all 0.5s ease',
            transform: lantern.isLit ? 'scale(1.15)' : 'scale(1)',
            animation: lantern.isLit ? 'lanternExpand 0.6s ease, lanternGlow 1.5s ease-in-out infinite' : 'none',
            boxShadow: lantern.isLit
              ? '0 0 20px #FFD700, 0 0 40px #FFD700'
              : '0 0 10px rgba(212, 163, 115, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            color: lantern.isLit ? '#8B4513' : '#5C4033',
            zIndex: 10,
          }}
          onMouseEnter={(e) => {
            if (!lantern.isLit) {
              e.currentTarget.style.transform = 'scale(1.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!lantern.isLit) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '15px',
              backgroundColor: '#8B4513',
            }}
          />
          <span>{lantern.id}</span>
        </div>
      ))}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '150px',
          right: '150px',
          height: '3px',
          backgroundColor: '#8B4513',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}

export default LanternScene
