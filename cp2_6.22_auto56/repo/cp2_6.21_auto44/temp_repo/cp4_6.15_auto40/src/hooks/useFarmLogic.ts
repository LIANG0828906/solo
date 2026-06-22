import { useState, useCallback, useTransition, useEffect } from 'react'
import { PlotCell, PlotStatus, LogEntry, ClaimInfo, OperationType, AnimationState } from '@/types'
import { initialPlots, initialClaims, initialLogs, statusColorMap, gridConfig } from '@/data/mockData'

export function useFarmLogic() {
  const [plots, setPlots] = useState<PlotCell[]>(initialPlots)
  const [claims, setClaims] = useState<ClaimInfo[]>(initialClaims)
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [selectedPlotId, setSelectedPlotId] = useState<string | null>(null)
  const [animationState, setAnimationState] = useState<AnimationState>({ plotId: '', type: null, show: false })
  const [isPending, startTransition] = useTransition()

  const getPlotById = useCallback((plotId: string) => {
    return plots.find(p => p.id === plotId)
  }, [plots])

  const getClaimByPlotId = useCallback((plotId: string) => {
    return claims.find(c => c.plotId === plotId)
  }, [claims])

  const getLogsByPlotId = useCallback((plotId: string) => {
    return logs.filter(l => l.plotId === plotId).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [logs])

  const getDaysSinceClaim = useCallback((claimDate: string) => {
    const start = new Date(claimDate).getTime()
    const now = Date.now()
    return Math.floor((now - start) / (24 * 60 * 60 * 1000))
  }, [])

  const claimPlot = useCallback((plotId: string, nickname: string, plantGoal: string) => {
    const claimDate = new Date().toISOString()
    
    startTransition(() => {
      setPlots(prev => prev.map(plot => {
        if (plot.id === plotId) {
          return {
            ...plot,
            status: PlotStatus.CLAIMED,
            color: statusColorMap[PlotStatus.CLAIMED],
            hasPlantMarker: true,
            isAnimating: true,
            animationType: 'claim' as const
          }
        }
        return plot
      }))

      setClaims(prev => [...prev, {
        plotId,
        nickname,
        plantGoal,
        claimDate
      }])
    })

    requestAnimationFrame(() => {
      setTimeout(() => {
        startTransition(() => {
          setPlots(prev => prev.map(plot => {
            if (plot.id === plotId) {
              return { ...plot, isAnimating: false, animationType: null }
            }
            return plot
          }))
        })
      }, 1000)
    })
  }, [startTransition])

  const addLog = useCallback((plotId: string, operationType: OperationType, note: string) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      plotId,
      operationType,
      note,
      timestamp: new Date().toISOString()
    }

    startTransition(() => {
      setLogs(prev => [newLog, ...prev])
    })

    requestAnimationFrame(() => {
      setAnimationState({ plotId, type: operationType, show: true })
      
      setTimeout(() => {
        startTransition(() => {
          setAnimationState({ plotId: '', type: null, show: false })
        })
      }, 1500)
    })

    const claim = claims.find(c => c.plotId === plotId)
    if (claim) {
      const days = getDaysSinceClaim(claim.claimDate)
      if (days >= 20) {
        startTransition(() => {
          setPlots(prev => prev.map(plot => {
            if (plot.id === plotId && plot.status !== PlotStatus.HARVESTING) {
              return {
                ...plot,
                status: PlotStatus.HARVESTING,
                color: statusColorMap[PlotStatus.HARVESTING]
              }
            }
            return plot
          }))
        })
      }
    }
  }, [claims, getDaysSinceClaim, startTransition])

  const selectPlot = useCallback((plotId: string | null) => {
    startTransition(() => {
      setSelectedPlotId(plotId)
    })
  }, [startTransition])

  return {
    plots,
    claims,
    logs,
    selectedPlotId,
    animationState,
    gridConfig,
    isPending,
    getPlotById,
    getClaimByPlotId,
    getLogsByPlotId,
    getDaysSinceClaim,
    claimPlot,
    addLog,
    selectPlot
  }
}
