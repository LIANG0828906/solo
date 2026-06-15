import React, { useState, useEffect, useCallback, createContext, useContext } from 'react'
import styled from '@emotion/styled'
import { AnimatePresence, motion } from 'framer-motion'
import TradeBoard from './components/TradeBoard'
import ConvoyManager from './components/ConvoyManager'
import RouteSimulator from './components/RouteSimulator'
import NotificationBar from './components/NotificationBar'
import Sidebar from './components/Sidebar'
import {
  GameState,
  Tea,
  Horse,
  PricePoint,
  TradeRecord,
  ConvoyHorse,
  AvailableHorse,
  SupplyItem,
  Notification,
  RouteNode,
  RouteEdge,
  StationSupply,
} from './types'

const SHICHEN = ['辰时', '巳时', '午时', '未时', '申时', '酉时']

const initialTeas: Tea[] = [
  { id: 'tea1', name: '砖茶', type: 'brick', price: 15, stock: 500 },
  { id: 'tea2', name: '散茶', type: 'loose', price: 12, stock: 300 },
  { id: 'tea3', name: '饼茶', type: 'cake', price: 20, stock: 200 },
]

const initialHorses: Horse[] = [
  { id: 'horse1', name: '河曲马', breed: 'hequ', price: 80, maxLoad: 120, speed: 8, stock: 50 },
  { id: 'horse2', name: '滇马', breed: 'dian', price: 60, maxLoad: 100, speed: 10, stock: 80 },
  { id: 'horse3', name: '蒙古马', breed: 'mongolian', price: 100, maxLoad: 150, speed: 7, stock: 30 },
]

const initialPriceHistory: PricePoint[] = SHICHEN.map((time, idx) => ({
  time,
  brickTea: 15 + Math.random() * 5 - 2.5,
  looseTea: 12 + Math.random() * 4 - 2,
  cakeTea: 20 + Math.random() * 6 - 3,
  hequHorse: 80 + Math.random() * 20 - 10,
  dianHorse: 60 + Math.random() * 15 - 7.5,
  mongolianHorse: 100 + Math.random() * 25 - 12.5,
}))

const initialAvailableHorses: AvailableHorse[] = [
  { id: 'ah1', name: '黑风', breed: '河曲马', maxLoad: 125, speed: 8 },
  { id: 'ah2', name: '赤兔', breed: '蒙古马', maxLoad: 155, speed: 7 },
  { id: 'ah3', name: '青骢', breed: '滇马', maxLoad: 105, speed: 10 },
  { id: 'ah4', name: '黄骠', breed: '河曲马', maxLoad: 118, speed: 9 },
  { id: 'ah5', name: '白龙', breed: '滇马', maxLoad: 102, speed: 11 },
  { id: 'ah6', name: '乌骓', breed: '蒙古马', maxLoad: 160, speed: 6 },
]

const initialSupplyItems: SupplyItem[] = [
  { id: 'supply1', name: '茶包', weight: 0.5, type: 'tea' },
  { id: 'supply2', name: '铁器', weight: 0.5, type: 'iron' },
]

const initialNotifications: Notification[] = [
  { id: 'n1', type: 'info', message: '茶马司今日开市，诸事顺遂', time: '辰时初刻' },
  { id: 'n2', type: 'warning', message: '康定驿站积雪深厚，行路需谨慎', time: '卯时三刻' },
]

const routeNodes: RouteNode[] = [
  { id: 'yaan', name: '雅安', x: 100, y: 400, altitude: 600, type: 'start' },
  { id: 'kangding', name: '康定', x: 280, y: 320, altitude: 2560, type: 'station' },
  { id: 'litang', name: '理塘', x: 460, y: 240, altitude: 4014, type: 'station' },
  { id: 'batang', name: '巴塘', x: 640, y: 180, altitude: 2580, type: 'station' },
  { id: 'lhasa', name: '拉萨', x: 820, y: 100, altitude: 3650, type: 'end' },
]

const routeEdges: RouteEdge[] = [
  { from: 'yaan', to: 'kangding', distance: 150 },
  { from: 'kangding', to: 'litang', distance: 280 },
  { from: 'litang', to: 'batang', distance: 200 },
  { from: 'batang', to: 'lhasa', distance: 320 },
]

const initialState: GameState = {
  currentTime: SHICHEN[0],
  timestamp: Date.now(),
  totalStock: 1160,
  teas: initialTeas,
  horses: initialHorses,
  priceHistory: initialPriceHistory,
  tradeRecords: [],
  convoyHorses: [],
  availableHorses: initialAvailableHorses,
  supplyItems: initialSupplyItems,
  currentTab: 'trade',
  notifications: initialNotifications,
  isJourneyActive: false,
  currentNodeIndex: 0,
  caravanPosition: { x: 100, y: 400 },
  showSupplyWindow: false,
  supplyCountdown: 30,
  stationSupply: {
    remainingTea: 50,
    remainingIron: 30,
    damageRate: 0.05,
  },
}

interface GameContextType {
  state: GameState
  setState: React.Dispatch<React.SetStateAction<GameState>>
  routeNodes: RouteNode[]
  routeEdges: RouteEdge[]
  addNotification: (type: 'urgent' | 'warning' | 'info', message: string) => void
  addTradeRecord: (record: Omit<TradeRecord, 'id' | 'time'>) => void
  addConvoyHorse: (horse: AvailableHorse) => void
  removeConvoyHorse: (convoyHorseId: string) => void
  addCargoToHorse: (convoyHorseId: string, item: SupplyItem) => void
  removeCargoFromHorse: (convoyHorseId: string, cargoId: string) => void
  startJourney: () => void
  handleSupplyDecision: (shouldSupply: boolean) => void
}

const GameContext = createContext<GameContextType | null>(null)

export const useGame = () => {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used within GameProvider')
  return context
}

const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #f4e8c1 0%, #e8d9a8 50%, #dcc896 100%);
  position: relative;
`

const MainContent = styled.div`
  flex: 1;
  margin-left: 240px;
  margin-right: 280px;
  padding: 20px;
  position: relative;
  overflow-x: hidden;

  @media (max-width: 1200px) {
    margin-right: 240px;
  }

  @media (max-width: 900px) {
    margin-left: 0;
    margin-right: 0;
    margin-bottom: 60px;
    padding: 15px;
  }
`

const HeaderBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 20px;
  background: linear-gradient(to right, rgba(139, 90, 43, 0.1), rgba(45, 80, 22, 0.1));
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`

const HeaderInfo = styled.div`
  display: flex;
  gap: 30px;
`

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const InfoLabel = styled.span`
  font-size: 12px;
  color: #8b5a2b;
  font-weight: 600;
`

const InfoValue = styled.span`
  font-size: 18px;
  color: #2d5016;
  font-weight: 700;
`

const TabContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: hidden;
`

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(initialState)

  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const lastPrice = prev.priceHistory[prev.priceHistory.length - 1]
        const newTimeIndex = (SHICHEN.indexOf(prev.currentTime) + 1) % SHICHEN.length
        const newTime = SHICHEN[newTimeIndex]

        const newPricePoint: PricePoint = {
          time: newTime,
          brickTea: Math.max(10, Math.min(25, lastPrice.brickTea + (Math.random() - 0.5) * 3)),
          looseTea: Math.max(8, Math.min(20, lastPrice.looseTea + (Math.random() - 0.5) * 2.5)),
          cakeTea: Math.max(15, Math.min(30, lastPrice.cakeTea + (Math.random() - 0.5) * 3.5)),
          hequHorse: Math.max(60, Math.min(120, lastPrice.hequHorse + (Math.random() - 0.5) * 10)),
          dianHorse: Math.max(45, Math.min(90, lastPrice.dianHorse + (Math.random() - 0.5) * 8)),
          mongolianHorse: Math.max(70, Math.min(140, lastPrice.mongolianHorse + (Math.random() - 0.5) * 12)),
        }

        const newHistory = [...prev.priceHistory.slice(1), newPricePoint]

        const updatedTeas = prev.teas.map((tea) => {
          if (tea.type === 'brick') return { ...tea, price: newPricePoint.brickTea }
          if (tea.type === 'loose') return { ...tea, price: newPricePoint.looseTea }
          return { ...tea, price: newPricePoint.cakeTea }
        })

        const updatedHorses = prev.horses.map((horse) => {
          if (horse.breed === 'hequ') return { ...horse, price: newPricePoint.hequHorse }
          if (horse.breed === 'dian') return { ...horse, price: newPricePoint.dianHorse }
          return { ...horse, price: newPricePoint.mongolianHorse }
        })

        return {
          ...prev,
          currentTime: newTime,
          timestamp: Date.now(),
          priceHistory: newHistory,
          teas: updatedTeas,
          horses: updatedHorses,
        }
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const notificationInterval = setInterval(() => {
      const messages = [
        { type: 'info' as const, msg: '一队滇马已抵市集，价格下降5%' },
        { type: 'urgent' as const, msg: '吐蕃商人求购上等砖茶千块' },
        { type: 'warning' as const, msg: '近日阴雨连绵，茶价看涨' },
        { type: 'info' as const, msg: '蒙古马队抵达，良马众多' },
        { type: 'warning' as const, msg: '沿途驿站报告有山贼出没' },
        { type: 'info' as const, msg: '新茶上市，饼茶品质上佳' },
        { type: 'urgent' as const, msg: '边关急报，急需战马补充' },
      ]
      const randomMsg = messages[Math.floor(Math.random() * messages.length)]
      addNotification(randomMsg.type, randomMsg.msg)
    }, 15000)

    return () => clearInterval(notificationInterval)
  }, [])

  const addNotification = useCallback((type: 'urgent' | 'warning' | 'info', message: string) => {
    setState((prev) => {
      const newNotification: Notification = {
        id: `n${Date.now()}`,
        type,
        message,
        time: prev.currentTime,
      }
      return {
        ...prev,
        notifications: [newNotification, ...prev.notifications].slice(0, 20),
      }
    })
  }, [])

  const addTradeRecord = useCallback((record: Omit<TradeRecord, 'id' | 'time'>) => {
    setState((prev) => {
      const newRecord: TradeRecord = {
        ...record,
        id: `tr${Date.now()}`,
        time: prev.currentTime,
      }
      return {
        ...prev,
        tradeRecords: [newRecord, ...prev.tradeRecords].slice(0, 50),
      }
    })
  }, [])

  const addConvoyHorse = useCallback((horse: AvailableHorse) => {
    setState((prev) => {
      if (prev.convoyHorses.length >= 9) return prev
      const newConvoyHorse: ConvoyHorse = {
        id: `ch${Date.now()}`,
        horseId: horse.id,
        name: horse.name,
        breed: horse.breed,
        maxLoad: horse.maxLoad,
        speed: horse.speed,
        currentLoad: 0,
        cargo: [],
      }
      return {
        ...prev,
        convoyHorses: [...prev.convoyHorses, newConvoyHorse],
        availableHorses: prev.availableHorses.filter((h) => h.id !== horse.id),
      }
    })
  }, [])

  const removeConvoyHorse = useCallback((convoyHorseId: string) => {
    setState((prev) => {
      const horse = prev.convoyHorses.find((h) => h.id === convoyHorseId)
      if (!horse) return prev
      const availableHorse: AvailableHorse = {
        id: horse.horseId,
        name: horse.name,
        breed: horse.breed,
        maxLoad: horse.maxLoad,
        speed: horse.speed,
      }
      return {
        ...prev,
        convoyHorses: prev.convoyHorses.filter((h) => h.id !== convoyHorseId),
        availableHorses: [...prev.availableHorses, availableHorse],
      }
    })
  }, [])

  const addCargoToHorse = useCallback((convoyHorseId: string, item: SupplyItem) => {
    setState((prev) => {
      return {
        ...prev,
        convoyHorses: prev.convoyHorses.map((horse) => {
          if (horse.id !== convoyHorseId) return horse
          const existingCargo = horse.cargo.find((c) => c.name === item.name)
          let newCargo: CargoItem[]
          if (existingCargo) {
            newCargo = horse.cargo.map((c) =>
              c.name === item.name ? { ...c, quantity: c.quantity + 1 } : c
            )
          } else {
            newCargo = [
              ...horse.cargo,
              { id: `cargo${Date.now()}`, name: item.name, weight: item.weight, quantity: 1 },
            ]
          }
          const newLoad = newCargo.reduce((sum, c) => sum + c.weight * c.quantity, 0)
          return { ...horse, cargo: newCargo, currentLoad: newLoad }
        }),
      }
    })
  }, [])

  const removeCargoFromHorse = useCallback((convoyHorseId: string, cargoId: string) => {
    setState((prev) => {
      return {
        ...prev,
        convoyHorses: prev.convoyHorses.map((horse) => {
          if (horse.id !== convoyHorseId) return horse
          const cargo = horse.cargo.find((c) => c.id === cargoId)
          if (!cargo) return horse
          let newCargo: CargoItem[]
          if (cargo.quantity > 1) {
            newCargo = horse.cargo.map((c) =>
              c.id === cargoId ? { ...c, quantity: c.quantity - 1 } : c
            )
          } else {
            newCargo = horse.cargo.filter((c) => c.id !== cargoId)
          }
          const newLoad = newCargo.reduce((sum, c) => sum + c.weight * c.quantity, 0)
          return { ...horse, cargo: newCargo, currentLoad: newLoad }
        }),
      }
    })
  }, [])

  const startJourney = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isJourneyActive: true,
      currentNodeIndex: 0,
      caravanPosition: { x: routeNodes[0].x, y: routeNodes[0].y },
    }))
    addNotification('info', '商队自雅安启程，前往拉萨')
  }, [addNotification])

  const handleSupplyDecision = useCallback((shouldSupply: boolean) => {
    setState((prev) => {
      if (shouldSupply) {
        addNotification('info', `在${routeNodes[prev.currentNodeIndex + 1]?.name || '驿站'}补充物资完毕`)
        return {
          ...prev,
          showSupplyWindow: false,
          supplyCountdown: 30,
          stationSupply: {
            ...prev.stationSupply,
            remainingTea: prev.stationSupply.remainingTea + 20,
            remainingIron: prev.stationSupply.remainingIron + 10,
            damageRate: Math.max(0.02, prev.stationSupply.damageRate - 0.01),
          },
        }
      }
      addNotification('warning', '未补充物资，继续赶路')
      return {
        ...prev,
        showSupplyWindow: false,
        supplyCountdown: 30,
      }
    })
  }, [addNotification])

  const totalStock = state.teas.reduce((sum, t) => sum + t.stock, 0) +
    state.horses.reduce((sum, h) => sum + h.stock, 0)

  const contextValue: GameContextType = {
    state,
    setState,
    routeNodes,
    routeEdges,
    addNotification,
    addTradeRecord,
    addConvoyHorse,
    removeConvoyHorse,
    addCargoToHorse,
    removeCargoFromHorse,
    startJourney,
    handleSupplyDecision,
  }

  const tabVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  }

  const [[page, direction], setPage] = useState([0, 0])

  useEffect(() => {
    const tabIndex = state.currentTab === 'trade' ? 0 : state.currentTab === 'convoy' ? 1 : 2
    const oldIndex = page
    const newDirection = tabIndex > oldIndex ? 1 : -1
    setPage([tabIndex, newDirection])
  }, [state.currentTab, page])

  return (
    <GameContext.Provider value={contextValue}>
      <AppContainer>
        <Sidebar />
        <NotificationBar notifications={state.notifications} />
        <MainContent>
          <HeaderBar>
            <HeaderInfo>
              <InfoItem>
                <InfoLabel>当前时辰</InfoLabel>
                <InfoValue>{state.currentTime}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>库存总量</InfoLabel>
                <InfoValue>{totalStock} 件</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>商队马匹</InfoLabel>
                <InfoValue>{state.convoyHorses.length}/9 匹</InfoValue>
              </InfoItem>
            </HeaderInfo>
            <div style={{ fontSize: '14px', color: '#8b5a2b' }}>
              大明万历年间 · 茶马司
            </div>
          </HeaderBar>

          <TabContainer>
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={state.currentTab}
                custom={direction}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                style={{ width: '100%' }}
              >
                {state.currentTab === 'trade' && <TradeBoard />}
                {state.currentTab === 'convoy' && <ConvoyManager />}
                {state.currentTab === 'route' && <RouteSimulator />}
              </motion.div>
            </AnimatePresence>
          </TabContainer>
        </MainContent>
      </AppContainer>
    </GameContext.Provider>
  )
}

export default App
