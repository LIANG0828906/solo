import { PlotCell, PlotStatus, LogEntry, ClaimInfo, OperationType } from '@/types'

const GRID_ROWS = 6
const GRID_COLS = 8

const statusColors: Record<PlotStatus, string> = {
  [PlotStatus.AVAILABLE]: '#C8E6C9',
  [PlotStatus.CLAIMED]: '#FFCCBC',
  [PlotStatus.HARVESTING]: '#2E7D32'
}

export const initialPlots: PlotCell[] = Array.from({ length: GRID_ROWS * GRID_COLS }, (_, index) => {
  const row = Math.floor(index / GRID_COLS)
  const col = index % GRID_COLS
  const isClaimed = (row === 1 && col === 2) || (row === 2 && col === 4) || (row === 3 && col === 1)
  const isHarvesting = (row === 0 && col === 5) || (row === 4 && col === 6)
  
  let status = PlotStatus.AVAILABLE
  if (isHarvesting) status = PlotStatus.HARVESTING
  else if (isClaimed) status = PlotStatus.CLAIMED

  return {
    id: `plot-${row}-${col}`,
    row,
    col,
    status,
    color: statusColors[status],
    hasPlantMarker: status !== PlotStatus.AVAILABLE,
    isAnimating: false,
    animationType: null
  }
})

export const initialClaims: ClaimInfo[] = [
  {
    plotId: 'plot-1-2',
    nickname: '小菜农',
    plantGoal: '种西红柿',
    claimDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    plotId: 'plot-2-4',
    nickname: '园丁小王',
    plantGoal: '种黄瓜',
    claimDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    plotId: 'plot-3-1',
    nickname: '绿手指',
    plantGoal: '种生菜',
    claimDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    plotId: 'plot-0-5',
    nickname: '收获达人',
    plantGoal: '种草莓',
    claimDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    plotId: 'plot-4-6',
    nickname: '快乐农夫',
    plantGoal: '种茄子',
    claimDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const initialLogs: LogEntry[] = [
  {
    id: 'log-1',
    plotId: 'plot-1-2',
    operationType: OperationType.WATER,
    note: '今天天气很好，给西红柿浇了充足的水',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-2',
    plotId: 'plot-1-2',
    operationType: OperationType.FERTILIZE,
    note: '施了一些有机肥，希望西红柿长得更快',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-3',
    plotId: 'plot-2-4',
    operationType: OperationType.WATER,
    note: '黄瓜苗长势不错，继续浇水',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-4',
    plotId: 'plot-2-4',
    operationType: OperationType.PEST_CONTROL,
    note: '发现一些蚜虫，用天然驱虫剂处理了',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-5',
    plotId: 'plot-0-5',
    operationType: OperationType.WATER,
    note: '草莓熟了，今天收获了一斤多！',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'log-6',
    plotId: 'plot-3-1',
    operationType: OperationType.FERTILIZE,
    note: '生菜刚种下去，施点底肥',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
]

export const statusColorMap = statusColors

export const gridConfig = {
  rows: GRID_ROWS,
  cols: GRID_COLS,
  cellSize: 60,
  gap: 4
}
