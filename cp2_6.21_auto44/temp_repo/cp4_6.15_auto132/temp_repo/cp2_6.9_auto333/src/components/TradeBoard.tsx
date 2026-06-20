import React, { useState, useEffect, useMemo } from 'react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useGame } from '../App'
import { TradeRecord } from '../types'

const Card = styled.div`
  background: linear-gradient(135deg, #fff8e7 0%, #f4e8c1 100%);
  border: 2px solid #8b5a2b;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 15px rgba(139, 90, 43, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h100v100H0z' fill='none'/%3E%3Cpath d='M20 20c0-5 5-5 10 0s10 5 10 0 5-5 10 0 10 5 10 0 5-5 10 0 10 5 10 0' stroke='%238b5a2b' stroke-width='0.5' fill='none' opacity='0.1'/%3E%3C/svg%3E");
    opacity: 0.3;
    pointer-events: none;
  }
`

const CardTitle = styled.h2`
  font-size: 20px;
  color: #2d5016;
  font-weight: 700;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #c8963e;
  font-family: 'Noto Serif SC', serif;
  position: relative;
  z-index: 1;
`

const ChartsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`

const ChartWrapper = styled.div`
  background: rgba(255, 255, 255, 0.5);
  border-radius: 6px;
  padding: 15px;
  position: relative;
  z-index: 1;
`

const ChartTitle = styled.h3`
  font-size: 16px;
  color: #8b5a2b;
  font-weight: 600;
  margin-bottom: 10px;
  font-family: 'Noto Serif SC', serif;
`

const PriceCards = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const PriceCard = styled(motion.div)<{ type: 'tea' | 'horse' }>`
  background: ${({ type }) => type === 'tea' ? 'rgba(45, 80, 22, 0.1)' : 'rgba(139, 90, 43, 0.1)'};
  border: 2px solid ${({ type }) => type === 'tea' ? '#2d5016' : '#8b5a2b'};
  border-radius: 8px;
  padding: 15px;
  text-align: center;
  position: relative;
  z-index: 1;
`

const PriceCardName = styled.div`
  font-size: 14px;
  color: #8b5a2b;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: 'Noto Serif SC', serif;
`

const PriceCardValue = styled(motion.div)`
  font-size: 24px;
  color: #2d5016;
  font-weight: 700;
  font-family: 'Noto Serif SC', serif;
`

const PriceCardUnit = styled.span`
  font-size: 12px;
  color: #8b5a2b;
  margin-left: 4px;
`

const TradeControls = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
`

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Label = styled.label`
  font-size: 14px;
  color: #8b5a2b;
  font-weight: 600;
  font-family: 'Noto Serif SC', serif;
`

const Select = styled.select`
  padding: 8px 12px;
  border: 2px solid #8b5a2b;
  border-radius: 4px;
  background: #fff8e7;
  color: #3d2914;
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #c8963e;
  }
`

const Input = styled.input`
  padding: 8px 12px;
  border: 2px solid #8b5a2b;
  border-radius: 4px;
  background: #fff8e7;
  color: #3d2914;
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  width: 80px;

  &:focus {
    outline: none;
    border-color: #c8963e;
  }
`

const Button = styled.button`
  padding: 10px 25px;
  background: linear-gradient(135deg, #a0785a 0%, #8b5a2b 100%);
  border: 2px solid #c8963e;
  border-radius: 6px;
  color: #f4e8c1;
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.5s ease;
  position: relative;
  z-index: 1;

  &:hover {
    transform: scale(1.08);
    box-shadow: 0 4px 15px rgba(200, 150, 62, 0.4);
  }

  &:active {
    transform: scale(1.02);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  position: relative;
  z-index: 1;
`

const TableHeader = styled.th`
  padding: 12px;
  text-align: left;
  background: #8b5a2b;
  color: #f4e8c1;
  font-weight: 600;
  font-family: 'Noto Serif SC', serif;
  font-size: 14px;

  &:first-child {
    border-top-left-radius: 6px;
  }

  &:last-child {
    border-top-right-radius: 6px;
  }
`

const TableRow = styled(motion.tr)`
  &:nth-child(even) {
    background: rgba(139, 90, 43, 0.05);
  }

  &:hover {
    background: rgba(200, 150, 62, 0.2);
  }
`

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid rgba(139, 90, 43, 0.2);
  color: #3d2914;
  font-family: 'Noto Serif SC', serif;
  font-size: 13px;
`

const TableBody = styled.tbody`
  display: block;
  max-height: 300px;
  overflow-y: auto;
`

const TableHeadFixed = styled.thead`
  display: table;
  width: 100%;
  table-layout: fixed;
`

const TableBodyRow = styled(TableRow)`
  display: table;
  width: 100%;
  table-layout: fixed;
`

const TradeBoard: React.FC = () => {
  const { state, addTradeRecord, addNotification } = useGame()
  const [selectedItemType, setSelectedItemType] = useState<'tea' | 'horse'>('tea')
  const [selectedItemId, setSelectedItemId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [chartKey, setChartKey] = useState(0)

  useEffect(() => {
    setChartKey((prev) => prev + 1)
  }, [state.priceHistory])

  useEffect(() => {
    if (selectedItemType === 'tea' && state.teas.length > 0 && !selectedItemId) {
      setSelectedItemId(state.teas[0].id)
    } else if (selectedItemType === 'horse' && state.horses.length > 0 && !selectedItemId) {
      setSelectedItemId(state.horses[0].id)
    }
  }, [selectedItemType, state.teas, state.horses, selectedItemId])

  const selectedItem = useMemo(() => {
    if (selectedItemType === 'tea') {
      return state.teas.find((t) => t.id === selectedItemId)
    }
    return state.horses.find((h) => h.id === selectedItemId)
  }, [selectedItemType, selectedItemId, state.teas, state.horses])

  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0
    return Math.round(selectedItem.price * quantity * 100) / 100
  }, [selectedItem, quantity])

  const handleTrade = () => {
    if (!selectedItem || quantity <= 0) return

    addTradeRecord({
      itemName: selectedItem.name,
      itemType: selectedItemType,
      quantity,
      unitPrice: selectedItem.price,
      totalPrice,
    })

    addNotification(
      'info',
      `${tradeType === 'buy' ? '购入' : '售出'} ${quantity} 单位 ${selectedItem.name}，共 ${totalPrice} 银两`
    )

    setQuantity(1)
  }

  const teaChartData = state.priceHistory.map((point) => ({
    time: point.time,
    砖茶: Math.round(point.brickTea * 100) / 100,
    散茶: Math.round(point.looseTea * 100) / 100,
    饼茶: Math.round(point.cakeTea * 100) / 100,
  }))

  const horseChartData = state.priceHistory.map((point) => ({
    time: point.time,
    河曲马: Math.round(point.hequHorse * 100) / 100,
    滇马: Math.round(point.dianHorse * 100) / 100,
    蒙古马: Math.round(point.mongolianHorse * 100) / 100,
  }))

  const priceShakeAnimation = {
    animation: {
      scale: [1, 1.02, 1],
      transition: { duration: 0.3, ease: 'easeInOut' },
    },
  }

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="card-animate">
      <Card>
        <CardTitle>实时价格走势</CardTitle>

        <PriceCards>
          {state.teas.map((tea) => (
            <PriceCard key={tea.id} type="tea" {...priceShakeAnimation}>
              <PriceCardName>{tea.name}</PriceCardName>
              <PriceCardValue
                key={`${tea.id}-${tea.price}`}
                initial={{ scale: 1.1, color: '#c8963e' }}
                animate={{ scale: 1, color: '#2d5016' }}
                transition={{ duration: 0.3 }}
              >
                {Math.round(tea.price * 100) / 100}
                <PriceCardUnit>两/单位</PriceCardUnit>
              </PriceCardValue>
              <div style={{ fontSize: '12px', color: '#8b5a2b', marginTop: '5px' }}>
                库存: {tea.stock} 单位
              </div>
            </PriceCard>
          ))}
          {state.horses.map((horse) => (
            <PriceCard key={horse.id} type="horse" {...priceShakeAnimation}>
              <PriceCardName>{horse.name}</PriceCardName>
              <PriceCardValue
                key={`${horse.id}-${horse.price}`}
                initial={{ scale: 1.1, color: '#c8963e' }}
                animate={{ scale: 1, color: '#2d5016' }}
                transition={{ duration: 0.3 }}
              >
                {Math.round(horse.price * 100) / 100}
                <PriceCardUnit>两/匹</PriceCardUnit>
              </PriceCardValue>
              <div style={{ fontSize: '12px', color: '#8b5a2b', marginTop: '5px' }}>
                库存: {horse.stock} 匹
              </div>
            </PriceCard>
          ))}
        </PriceCards>

        <ChartsContainer>
          <ChartWrapper>
            <ChartTitle>茶叶价格走势</ChartTitle>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart key={`tea-${chartKey}`} data={teaChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 90, 43, 0.2)" />
                <XAxis dataKey="time" stroke="#8b5a2b" fontFamily="Noto Serif SC" fontSize={12} />
                <YAxis stroke="#8b5a2b" fontFamily="Noto Serif SC" fontSize={12} unit="两" />
                <Tooltip
                  contentStyle={{
                    background: '#fff8e7',
                    border: '2px solid #8b5a2b',
                    borderRadius: '6px',
                    fontFamily: 'Noto Serif SC',
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Noto Serif SC', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="砖茶"
                  stroke="#2d5016"
                  strokeWidth={2}
                  dot={{ fill: '#2d5016', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="散茶"
                  stroke="#5d8a3a"
                  strokeWidth={2}
                  dot={{ fill: '#5d8a3a', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="饼茶"
                  stroke="#8b5a2b"
                  strokeWidth={2}
                  dot={{ fill: '#8b5a2b', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>

          <ChartWrapper>
            <ChartTitle>马匹价格走势</ChartTitle>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart key={`horse-${chartKey}`} data={horseChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(139, 90, 43, 0.2)" />
                <XAxis dataKey="time" stroke="#8b5a2b" fontFamily="Noto Serif SC" fontSize={12} />
                <YAxis stroke="#8b5a2b" fontFamily="Noto Serif SC" fontSize={12} unit="两" />
                <Tooltip
                  contentStyle={{
                    background: '#fff8e7',
                    border: '2px solid #8b5a2b',
                    borderRadius: '6px',
                    fontFamily: 'Noto Serif SC',
                  }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Noto Serif SC', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="河曲马"
                  stroke="#8b4513"
                  strokeWidth={2}
                  dot={{ fill: '#8b4513', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="滇马"
                  stroke="#a0522d"
                  strokeWidth={2}
                  dot={{ fill: '#a0522d', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
                <Line
                  type="monotone"
                  dataKey="蒙古马"
                  stroke="#cd853f"
                  strokeWidth={2}
                  dot={{ fill: '#cd853f', r: 4 }}
                  activeDot={{ r: 6 }}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartsContainer>
      </Card>

      <Card>
        <CardTitle>交易操作</CardTitle>
        <TradeControls>
          <ControlGroup>
            <Label>类型:</label>
            <Select
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as 'buy' | 'sell')}
            >
              <option value="buy">购入</option>
              <option value="sell">售出</option>
            </Select>
          </ControlGroup>
          <ControlGroup>
            <Label>品种:</label>
            <Select
              value={selectedItemType}
              onChange={(e) => {
                setSelectedItemType(e.target.value as 'tea' | 'horse')
                setSelectedItemId('')
              }}
            >
              <option value="tea">茶叶</option>
              <option value="horse">马匹</option>
            </Select>
          </ControlGroup>
          <ControlGroup>
            <Label>物品:</label>
            <Select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
            >
              {selectedItemType === 'tea'
                ? state.teas.map((tea) => (
                    <option key={tea.id} value={tea.id}>
                      {tea.name}
                    </option>
                  ))
                : state.horses.map((horse) => (
                    <option key={horse.id} value={horse.id}>
                      {horse.name}
                    </option>
                  ))}
            </Select>
          </ControlGroup>
          <ControlGroup>
            <Label>数量:</label>
            <Input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </ControlGroup>
          <ControlGroup>
            <Label>总价: <strong style={{ color: '#c8963e' }}>{totalPrice} 两</strong></Label>
          </ControlGroup>
          <Button onClick={handleTrade} disabled={!selectedItem}>
            {tradeType === 'buy' ? '买入' : '卖出'}
          </Button>
        </TradeControls>
      </Card>

      <Card>
        <CardTitle>交易记录</CardTitle>
        <Table>
          <TableHeadFixed>
            <tr>
              <TableHeader style={{ width: '15%' }}>时间</TableHeader>
              <TableHeader style={{ width: '25%' }}>物品</TableHeader>
              <TableHeader style={{ width: '15%' }}>数量</TableHeader>
              <TableHeader style={{ width: '20%' }}>单价(两)</TableHeader>
              <TableHeader style={{ width: '25%' }}>总价(两)</TableHeader>
            </tr>
          </TableHeadFixed>
          <TableBody>
            <AnimatePresence initial={false}>
              {state.tradeRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} style={{ textAlign: 'center', padding: '40px', color: '#8b5a2b', opacity: 0.6 }}>
                    暂无交易记录
                  </TableCell>
                </TableRow>
              ) : (
                state.tradeRecords.map((record: TradeRecord, index: number) => (
                  <TableBodyRow
                    key={record.id}
                    variants={rowVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <TableCell style={{ width: '15%' }}>{record.time}</TableCell>
                    <TableCell style={{ width: '25%' }}>{record.itemName}</TableCell>
                    <TableCell style={{ width: '15%' }}>{record.quantity}</TableCell>
                    <TableCell style={{ width: '20%' }}>{record.unitPrice.toFixed(2)}</TableCell>
                    <TableCell style={{ width: '25%', fontWeight: 600, color: '#2d5016' }}>
                      {record.totalPrice.toFixed(2)}
                    </TableCell>
                  </TableBodyRow>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}

export default TradeBoard
