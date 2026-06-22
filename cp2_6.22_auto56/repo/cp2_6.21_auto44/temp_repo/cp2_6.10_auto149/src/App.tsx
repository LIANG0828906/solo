import React, { useState, useMemo, useCallback, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import styled, { css } from 'styled-components'

interface StarData {
  id: number
  name: string
  x: number
  y: number
  z: number
  magnitude: number
  constellation: string
}

interface StarRing {
  id: number
  name: string
  radius: number
  color: string
}

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
`

const Header = styled.header`
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(232, 212, 168, 0.2);
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;

  @media (max-width: 1024px) {
    height: 60px;
  }
`

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 12px;
  color: #e8d4a8;
  text-shadow: 0 0 20px rgba(232, 212, 168, 0.5);
  font-family: 'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', serif;

  @media (max-width: 1024px) {
    font-size: 24px;
    letter-spacing: 6px;
  }
`

const MainContent = styled.main`
  flex: 1;
  display: flex;
  overflow: hidden;

  @media (max-width: 1024px) {
    flex-direction: column;
  }
`

const SceneWrapper = styled.section`
  flex: 1;
  position: relative;
  min-height: 0;

  @media (max-width: 1024px) {
    height: 60%;
  }
`

const ControlPanel = styled.aside`
  width: 320px;
  padding: 24px;
  background: rgba(22, 33, 62, 0.9);
  border-left: 1px solid rgba(232, 212, 168, 0.2);
  overflow-y: auto;
  backdrop-filter: blur(10px);

  @media (max-width: 1024px) {
    width: 100%;
    height: 40%;
    border-left: none;
    border-top: 1px solid rgba(232, 212, 168, 0.2);
  }
`

const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  color: #f0e6d2;
  border-bottom: 1px solid rgba(232, 212, 168, 0.3);
  padding-bottom: 8px;
`

const MonthSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 24px;
`

const MonthButton = styled.button<{ $active: boolean }>`
  padding: 8px 4px;
  border: 1px solid rgba(232, 212, 168, 0.3);
  background: ${props => props.$active ? 'rgba(232, 212, 168, 0.2)' : 'transparent'};
  color: ${props => props.$active ? '#f0e6d2' : '#a89880'};
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  font-family: inherit;

  &:hover {
    background: rgba(232, 212, 168, 0.15);
    color: #f0e6d2;
  }
`

const RingList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 24px;
`

const RingItem = styled.div<{ $selected: boolean }>`
  padding: 12px 16px;
  border: 1px solid rgba(232, 212, 168, 0.3);
  background: ${props => props.$selected ? 'rgba(232, 212, 168, 0.15)' : 'transparent'};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 12px;

  &:hover {
    background: rgba(232, 212, 168, 0.1);
    transform: translateX(4px);
  }
`

const RingColorDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 0 8px ${props => props.color};
`

const RingName = styled.span`
  flex: 1;
  font-size: 14px;
  color: #e8d4a8;
`

const InfoPanel = styled.div`
  padding: 16px;
  background: rgba(15, 15, 35, 0.6);
  border-radius: 8px;
  border: 1px solid rgba(232, 212, 168, 0.2);
`

const InfoLabel = styled.div`
  font-size: 12px;
  color: #a89880;
  margin-bottom: 4px;
`

const InfoValue = styled.div`
  font-size: 16px;
  color: #f0e6d2;
  margin-bottom: 12px;

  &:last-child {
    margin-bottom: 0;
  }
`

const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '腊月']

const starRings: StarRing[] = [
  { id: 1, name: '紫微垣', radius: 3, color: '#ffd700' },
  { id: 2, name: '太微垣', radius: 5, color: '#87ceeb' },
  { id: 3, name: '天市垣', radius: 7, color: '#ff6b6b' },
  { id: 4, name: '黄道带', radius: 10, color: '#98d8c8' },
  { id: 5, name: '赤道带', radius: 12, color: '#dda0dd' },
]

const generateStars = (count: number): StarData[] => {
  const constellations = ['角宿', '亢宿', '氐宿', '房宿', '心宿', '尾宿', '箕宿', '斗宿']
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `星${i + 1}`,
    x: (Math.random() - 0.5) * 30,
    y: (Math.random() - 0.5) * 30,
    z: (Math.random() - 0.5) * 30,
    magnitude: Math.random() * 2 + 0.5,
    constellation: constellations[Math.floor(Math.random() * constellations.length)],
  }))
}

const StarField = React.memo(({ stars, hoveredStar, onHover, monthIndex }: {
  stars: StarData[]
  hoveredStar: number | null
  onHover: (id: number | null) => void
  monthIndex: number
}) => {
  const rotationY = (monthIndex / 12) * Math.PI * 2

  return (
    <group rotation={[0, rotationY, 0]}>
      {stars.map((star) => (
        <mesh
          key={star.id}
          position={[star.x, star.y, star.z]}
          onPointerOver={(e) => {
            e.stopPropagation()
            onHover(star.id)
          }}
          onPointerOut={() => onHover(null)}
        >
          <sphereGeometry args={[star.magnitude * 0.1, 16, 16]} />
          <meshStandardMaterial
            color={hoveredStar === star.id ? '#ffd700' : '#ffffff'}
            emissive={hoveredStar === star.id ? '#ffd700' : '#444444'}
            emissiveIntensity={hoveredStar === star.id ? 1 : 0.5}
          />
        </mesh>
      ))}
    </group>
  )
})

StarField.displayName = 'StarField'

const StarRings = React.memo(({ rings, selectedRing, onSelectRing, monthIndex }: {
  rings: StarRing[]
  selectedRing: number | null
  onSelectRing: (id: number) => void
  monthIndex: number
}) => {
  const rotationY = (monthIndex / 12) * Math.PI * 2

  return (
    <group rotation={[0, rotationY, 0]}>
      {rings.map((ring) => (
        <mesh
          key={ring.id}
          rotation={[Math.PI / 2, 0, 0]}
          onClick={(e) => {
            e.stopPropagation()
            onSelectRing(ring.id)
          }}
        >
          <torusGeometry args={[ring.radius, 0.05, 16, 100]} />
          <meshStandardMaterial
            color={ring.color}
            emissive={ring.color}
            emissiveIntensity={selectedRing === ring.id ? 0.8 : 0.3}
            transparent
            opacity={selectedRing === ring.id ? 1 : 0.6}
          />
        </mesh>
      ))}
    </group>
  )
})

StarRings.displayName = 'StarRings'

const Scene = React.memo(({ monthIndex, selectedRing, onSelectRing, hoveredStar, onHoverStar, stars }: {
  monthIndex: number
  selectedRing: number | null
  onSelectRing: (id: number) => void
  hoveredStar: number | null
  onHoverStar: (id: number | null) => void
  stars: StarData[]
}) => {
  return (
    <>
      <color attach="background" args={['#1a1a2e']} />
      <fog attach="fog" args={['#1a1a2e', 20, 50]} />

      <ambientLight intensity={0.3} color="#ffffff" />
      <directionalLight
        position={[10, 10, 5]}
        intensity={0.8}
        color="#fff5e6"
        castShadow
      />
      <pointLight
        position={[-10, -10, -5]}
        intensity={0.4}
        color="#87ceeb"
      />
      <pointLight
        position={[0, 15, 0]}
        intensity={0.3}
        color="#ffd700"
      />

      <Suspense fallback={null}>
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />
      </Suspense>

      <StarField
        stars={stars}
        hoveredStar={hoveredStar}
        onHover={onHoverStar}
        monthIndex={monthIndex}
      />

      <StarRings
        rings={starRings}
        selectedRing={selectedRing}
        onSelectRing={onSelectRing}
        monthIndex={monthIndex}
      />

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={5}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  )
})

Scene.displayName = 'Scene'

const App: React.FC = () => {
  const [monthIndex, setMonthIndex] = useState<number>(0)
  const [selectedRing, setSelectedRing] = useState<number | null>(null)
  const [hoveredStar, setHoveredStar] = useState<number | null>(null)

  const stars = useMemo(() => generateStars(200), [])
  const selectedRingData = useMemo(() => starRings.find(r => r.id === selectedRing), [selectedRing])
  const hoveredStarData = useMemo(() => stars.find(s => s.id === hoveredStar), [hoveredStar, stars])

  const handleMonthChange = useCallback((index: number) => {
    setMonthIndex(index)
  }, [])

  const handleRingSelect = useCallback((id: number) => {
    setSelectedRing(prev => prev === id ? null : id)
  }, [])

  const handleStarHover = useCallback((id: number | null) => {
    setHoveredStar(id)
  }, [])

  return (
    <AppContainer>
      <Header>
        <Title>汴京浑天星图</Title>
      </Header>

      <MainContent>
        <SceneWrapper>
          <Canvas
            camera={{ position: [0, 10, 20], fov: 60 }}
            gl={{ antialias: true, alpha: false }}
          >
            <Scene
              monthIndex={monthIndex}
              selectedRing={selectedRing}
              onSelectRing={handleRingSelect}
              hoveredStar={hoveredStar}
              onHoverStar={handleStarHover}
              stars={stars}
            />
          </Canvas>
        </SceneWrapper>

        <ControlPanel>
          <SectionTitle>月令</SectionTitle>
          <MonthSelector>
            {monthNames.map((name, index) => (
              <MonthButton
                key={index}
                $active={monthIndex === index}
                onClick={() => handleMonthChange(index)}
              >
                {name}
              </MonthButton>
            ))}
          </MonthSelector>

          <SectionTitle>星垣</SectionTitle>
          <RingList>
            {starRings.map((ring) => (
              <RingItem
                key={ring.id}
                $selected={selectedRing === ring.id}
                onClick={() => handleRingSelect(ring.id)}
              >
                <RingColorDot color={ring.color} />
                <RingName>{ring.name}</RingName>
              </RingItem>
            ))}
          </RingList>

          <SectionTitle>星象信息</SectionTitle>
          <InfoPanel>
            {hoveredStarData ? (
              <>
                <InfoLabel>星名</InfoLabel>
                <InfoValue>{hoveredStarData.name}</InfoValue>
                <InfoLabel>星宿</InfoLabel>
                <InfoValue>{hoveredStarData.constellation}</InfoValue>
                <InfoLabel>星等</InfoLabel>
                <InfoValue>{hoveredStarData.magnitude.toFixed(2)}</InfoValue>
              </>
            ) : selectedRingData ? (
              <>
                <InfoLabel>星垣</InfoLabel>
                <InfoValue>{selectedRingData.name}</InfoValue>
                <InfoLabel>天球半径</InfoLabel>
                <InfoValue>{selectedRingData.radius} 度</InfoValue>
              </>
            ) : (
              <>
                <InfoLabel>当前月令</InfoLabel>
                <InfoValue>{monthNames[monthIndex]}</InfoValue>
                <InfoLabel>提示</InfoLabel>
                <InfoValue style={{ fontSize: '13px', color: '#a89880' }}>
                  悬停星星查看详情，点击星垣选中
                </InfoValue>
              </>
            )}
          </InfoPanel>
        </ControlPanel>
      </MainContent>
    </AppContainer>
  )
}

export default React.memo(App)
