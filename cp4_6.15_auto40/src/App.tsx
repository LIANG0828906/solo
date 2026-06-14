import React from 'react'
import { FarmMap } from '@/pages/FarmMap'
import { PlotDetail } from '@/pages/PlotDetail'
import { useFarmLogic } from '@/hooks/useFarmLogic'
import '@/styles/global.css'

function App() {
  const {
    plots,
    selectedPlotId,
    animationState,
    gridConfig,
    getPlotById,
    getClaimByPlotId,
    getLogsByPlotId,
    getDaysSinceClaim,
    claimPlot,
    addLog,
    selectPlot
  } = useFarmLogic()

  const selectedPlot = selectedPlotId ? getPlotById(selectedPlotId) : undefined
  const selectedClaim = selectedPlotId ? getClaimByPlotId(selectedPlotId) : undefined
  const selectedLogs = selectedPlotId ? getLogsByPlotId(selectedPlotId) : []

  return (
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#F5F0E1' }}>
      <FarmMap
        plots={plots}
        selectedPlotId={selectedPlotId}
        onPlotClick={selectPlot}
        onClaim={claimPlot}
        gridConfig={gridConfig}
        animationState={animationState}
      />
      
      {selectedPlotId && (
        <PlotDetail
          plot={selectedPlot}
          claim={selectedClaim}
          logs={selectedLogs}
          getDaysSinceClaim={getDaysSinceClaim}
          onAddLog={addLog}
          onBack={() => selectPlot(null)}
        />
      )}
    </div>
  )
}

export default App
