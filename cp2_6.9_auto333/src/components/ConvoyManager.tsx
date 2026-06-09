import React, { useState } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import { useGame } from '../App'
import { ConvoyHorse, CargoItem } from '../types'

const Card = styled.div`
  background: linear-gradient(135deg, #fff8e7 0%, #f4e8c1 100%);
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(139, 90, 43, 0.2);
  position: relative;
  overflow: hidden;
`

const CardTitle = styled.h2`
  font-size: 20px;
  color: #2d5016;
  font-weight: 700;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #c8963e;
  font-family: 'Noto Serif SC', serif;
`

const ConvoyLayout = styled.div`
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const Panel = styled.div`
  background: rgba(255, 255, 255, 0.4);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(139, 90, 43, 0.3);
`

const PanelTitle = styled.h3`
  font-size: 16px;
  color: #8b5a2b;
  font-weight: 600;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(139, 90, 43, 0.3);
  font-family: 'Noto Serif SC', serif;
`

const HorseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
`

const HorseCard = styled(motion.div)<{ isDragging?: boolean }>`
  background: linear-gradient(135deg, #fff8e7 0%, #e8d9a8 100%);
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  padding: 12px;
  cursor: grab;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(139, 90, 43, 0.3);
  }

  &:active {
    cursor: grabbing;
  }

  ${({ isDragging }) =>
    isDragging &&
    `
    opacity: 0.5;
    transform: scale(0.95);
  `}
`

const HorseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
`

const HorseIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5a2b, #6b4420);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4e8c1;
  font-size: 20px;
`

const HorseName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2d5016;
  font-family: 'Noto Serif SC', serif;
`

const HorseBreed = styled.div`
  font-size: 12px;
  color: #8b5a2b;
  font-family: 'Noto Serif SC', serif;
`

const HorseStats = styled.div`
  display: flex;
  gap: 10px;
  font-size: 11px;
  color: #6b4420;
  font-family: 'Noto Serif SC', serif;
`

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const ConvoyGrid = styled.div<{ isOver: boolean }>`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  min-height: 400px;
  padding: 20px;
  background: ${({ isOver }) =>
    isOver ? 'rgba(45, 80, 22, 0.1)' : 'rgba(139, 90, 43, 0.05)'};
  border: 2px dashed ${({ isOver }) => (isOver ? '#2d5016' : 'rgba(139, 90, 43, 0.3)')};
  border-radius: 8px;
  transition: all 0.3s ease;
`

const GridSlot = styled(motion.div)<{ hasHorse: boolean; isOver: boolean }>`
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ hasHorse, isOver }) =>
    hasHorse
      ? 'linear-gradient(135deg, #fff8e7 0%, #e8d9a8 100%)'
      : isOver
      ? 'rgba(45, 80, 22, 0.2)'
      : 'rgba(139, 90, 43, 0.1)'};
  border: 2px solid
    ${({ hasHorse }) => (hasHorse ? '#8b5a2b' : 'rgba(139, 90, 43, 0.3)')};
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
`

const ConvoyHorseCard = styled.div<{ overload: boolean }>`
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  ${({ overload }) => overload && 'animation: shake 0.3s ease-in-out infinite;'}
`

const ConvoyHorseIcon = styled.div<{ overload: boolean }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${({ overload }) =>
    overload
      ? 'linear-gradient(135deg, #e67e22, #d35400)'
      : 'linear-gradient(135deg, #2d5016, #1a3009)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f4e8c1;
  font-size: 24px;
  transition: all 0.3s ease;
  ${({ overload }) => overload && 'animation: shake 0.3s ease-in-out infinite;'}
`

const LoadBar = styled.div`
  width: 100%;
  height: 8px;
  background: rgba(139, 90, 43, 0.2);
  border-radius: 4px;
  overflow: hidden;
`

const LoadProgress = styled.div<{ percentage: number }>`
  height: 100%;
  background: ${({ percentage }) => {
    if (percentage >= 80) return 'linear-gradient(90deg, #f39c12, #e74c3c)'
    if (percentage >= 50) return 'linear-gradient(90deg, #f39c12, #f1c40f)'
    return 'linear-gradient(90deg, #27ae60, #2ecc71)'
  }};
  border-radius: 4px;
  transition: width 0.3s ease;
`

const CargoList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
`

const CargoTag = styled.span`
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(139, 90, 43, 0.2);
  border-radius: 4px;
  color: #6b4420;
  font-family: 'Noto Serif SC', serif;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(192, 57, 43, 0.3);
    color: #c0392b;
  }
`

const SupplyArea = styled.div`
  margin-top: 20px;
`

const SupplyItems = styled.div`
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
`

const SupplyCard = styled(motion.div)`
  padding: 15px 25px;
  background: linear-gradient(135deg, #a0785a 0%, #8b5a2b 100%);
  border: 2px solid #c8963e;
  border-radius: 8px;
  color: #f4e8c1;
  cursor: grab;
  font-family: 'Noto Serif SC', serif;
  font-weight: 600;
  transition: all 0.5s ease;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(200, 150, 62, 0.4);
  }

  &:active {
    cursor: grabbing;
  }
`

const RemoveButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 20px;
  height: 20px;
  border: none;
  background: rgba(192, 57, 43, 0.8);
  color: white;
  border-radius: 50%;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    background: rgba(192, 57, 43, 1);
  }
`

const ConvoyHorseWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;

  &:hover ${RemoveButton} {
    opacity: 1;
  }
`

const EmptySlotText = styled.div`
  font-size: 12px;
  color: #8b5a2b;
  opacity: 0.6;
  font-family: 'Noto Serif SC', serif;
  text-align: center;
`

const ConvoyStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
`

const StatCard = styled.div`
  background: rgba(45, 80, 22, 0.1);
  border: 2px solid #2d5016;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
`

const StatValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #2d5016;
  font-family: 'Noto Serif SC', serif;
`

const StatLabel = styled.div`
  font-size: 12px;
  color: #8b5a2b;
  margin-top: 5px;
  font-family: 'Noto Serif SC', serif;
`

const ConvoyManager: React.FC = () => {
  const {
    state,
    addConvoyHorse,
    removeConvoyHorse,
    addCargoToHorse,
    removeCargoFromHorse,
  } = useGame()

  const [draggedHorse, setDraggedHorse] = useState<string | null>(null)
  const [draggedSupply, setDraggedSupply] = useState<string | null>(null)
  const [isOverConvoy, setIsOverConvoy] = useState(false)
  const [overHorseId, setOverHorseId] = useState<string | null>(null)

  const handleHorseDragStart = (horseId: string) => {
    setDraggedHorse(horseId)
  }

  const handleHorseDragEnd = () => {
    setDraggedHorse(null)
    setIsOverConvoy(false)
  }

  const handleHorseDrop = () => {
    if (draggedHorse) {
      const horse = state.availableHorses.find((h) => h.id === draggedHorse)
      if (horse) {
        addConvoyHorse(horse)
      }
    }
    setDraggedHorse(null)
    setIsOverConvoy(false)
  }

  const handleSupplyDragStart = (supplyId: string) => {
    setDraggedSupply(supplyId)
  }

  const handleSupplyDragEnd = () => {
    setDraggedSupply(null)
    setOverHorseId(null)
  }

  const handleSupplyDrop = (convoyHorseId: string) => {
    if (draggedSupply) {
      const supply = state.supplyItems.find((s) => s.id === draggedSupply)
      if (supply) {
        addCargoToHorse(convoyHorseId, supply)
      }
    }
    setDraggedSupply(null)
    setOverHorseId(null)
  }

  const handleRemoveHorse = (convoyHorseId: string) => {
    removeConvoyHorse(convoyHorseId)
  }

  const handleRemoveCargo = (convoyHorseId: string, cargoId: string) => {
    removeCargoFromHorse(convoyHorseId, cargoId)
  }

  const totalLoad = state.convoyHorses.reduce(
    (sum, h) => sum + h.currentLoad,
    0
  )
  const avgSpeed =
    state.convoyHorses.length > 0
      ? Math.min(...state.convoyHorses.map((h) => h.speed))
      : 0

  const gridSlots = Array(9).fill(null)

  return (
    <div className="card-animate">
      <Card>
        <CardTitle>商队编组</CardTitle>

        <ConvoyStats>
          <StatCard>
            <StatValue>{state.convoyHorses.length}/9</StatValue>
            <StatLabel>马匹数量</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{totalLoad.toFixed(1)}</StatValue>
            <StatLabel>总负载(单位)</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{avgSpeed}</StatValue>
            <StatLabel>行进速度(节)</StatLabel>
          </StatCard>
        </ConvoyStats>

        <ConvoyLayout>
          <Panel>
            <PanelTitle>可选骡马</PanelTitle>
            <HorseList>
              {state.availableHorses.length === 0 ? (
                <EmptySlotText>暂无可用骡马</EmptySlotText>
              ) : (
                state.availableHorses.map((horse) => (
                  <HorseCard
                    key={horse.id}
                    draggable
                    onDragStart={() => handleHorseDragStart(horse.id)}
                    onDragEnd={handleHorseDragEnd}
                    isDragging={draggedHorse === horse.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <HorseHeader>
                      <HorseIcon>🐴</HorseIcon>
                      <div>
                        <HorseName>{horse.name}</HorseName>
                        <HorseBreed>{horse.breed}</HorseBreed>
                      </div>
                    </HorseHeader>
                    <HorseStats>
                      <StatItem>
                        <span>⚖️</span>
                        <span>负重: {horse.maxLoad}</span>
                      </StatItem>
                      <StatItem>
                        <span>💨</span>
                        <span>速度: {horse.speed}</span>
                      </StatItem>
                    </HorseStats>
                  </HorseCard>
                ))
              )}
            </HorseList>
          </Panel>

          <div>
            <PanelTitle>编组区 (拖拽骡马至此)</PanelTitle>
            <ConvoyGrid
              isOver={isOverConvoy}
              onDragOver={(e) => {
                e.preventDefault()
                if (draggedHorse) setIsOverConvoy(true)
              }}
              onDragLeave={() => setIsOverConvoy(false)}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedHorse) handleHorseDrop()
              }}
            >
              {gridSlots.map((_, index) => {
                const horse = state.convoyHorses[index]
                const isOver = overHorseId === horse?.id && draggedSupply

                return (
                  <GridSlot
                    key={index}
                    hasHorse={!!horse}
                    isOver={isOver}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (draggedSupply && horse) {
                        setOverHorseId(horse.id)
                      }
                    }}
                    onDragLeave={() => {
                      if (horse) setOverHorseId(null)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedSupply && horse) {
                        handleSupplyDrop(horse.id)
                      }
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {horse ? (
                      <ConvoyHorseWrapper>
                        <RemoveButton onClick={() => handleRemoveHorse(horse.id)}>
                          ×
                        </RemoveButton>
                        <ConvoyHorseCard
                          overload={
                            (horse.currentLoad / horse.maxLoad) * 100 >= 80
                          }
                        >
                          <ConvoyHorseIcon
                            overload={
                              (horse.currentLoad / horse.maxLoad) * 100 >= 80
                            }
                          >
                            🐴
                          </ConvoyHorseIcon>
                          <div style={{ textAlign: 'center' }}>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: '#2d5016',
                                fontFamily: 'Noto Serif SC',
                              }}
                            >
                              {horse.name}
                            </div>
                            <div
                              style={{
                                fontSize: '10px',
                                color: '#8b5a2b',
                                fontFamily: 'Noto Serif SC',
                              }}
                            >
                              {horse.breed}
                            </div>
                          </div>
                          <div style={{ width: '100%' }}>
                            <LoadBar>
                              <LoadProgress
                                percentage={
                                  (horse.currentLoad / horse.maxLoad) * 100
                                }
                                style={{
                                  width: `${Math.min(
                                    (horse.currentLoad / horse.maxLoad) * 100,
                                    100
                                  )}%`,
                                }}
                              />
                            </LoadBar>
                            <div
                              style={{
                                fontSize: '10px',
                                color: '#6b4420',
                                textAlign: 'center',
                                marginTop: '4px',
                                fontFamily: 'Noto Serif SC',
                              }}
                            >
                              {horse.currentLoad.toFixed(1)} / {horse.maxLoad}
                            </div>
                          </div>
                          <CargoList>
                            {horse.cargo.map((cargo: CargoItem) => (
                              <CargoTag
                                key={cargo.id}
                                onClick={() =>
                                  handleRemoveCargo(horse.id, cargo.id)
                                }
                                title="点击移除"
                              >
                                {cargo.name} ×{cargo.quantity}
                              </CargoTag>
                            ))}
                          </CargoList>
                        </ConvoyHorseCard>
                      </ConvoyHorseWrapper>
                    ) : (
                      <EmptySlotText>空位</EmptySlotText>
                    )}
                  </GridSlot>
                )
              })}
            </ConvoyGrid>
          </div>
        </ConvoyLayout>

        <SupplyArea>
          <PanelTitle>物资库 (拖拽至马匹装载)</PanelTitle>
          <SupplyItems>
            {state.supplyItems.map((item) => (
              <SupplyCard
                key={item.id}
                draggable
                onDragStart={() => handleSupplyDragStart(item.id)}
                onDragEnd={handleSupplyDragEnd}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                {item.type === 'tea' ? '🍵' : '⚔️'} {item.name} ({item.weight}单位)
              </SupplyCard>
            ))}
          </SupplyItems>
        </SupplyArea>
      </Card>
    </div>
  )
}

export default ConvoyManager
