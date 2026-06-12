import { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { useReactorStore, HistoryRecord } from '../store'

const COLORS = {
  temperature: '#FF1493',
  density: '#00FFFF',
  magneticField: '#FFB300'
}

function HistoryChart() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { history, isReplayMode, replaySpeed, toggleReplay, setReplayTime, params } = useReactorStore()
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: HistoryRecord | null }>({ x: 0, y: 0, data: null })
  const replayRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  const drawChart = useCallback(() => {
    if (!svgRef.current || !containerRef.current || history.length === 0) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight
    const margin = { top: 10, right: 10, bottom: 20, left: 40 }

    const svg = d3.select(svgRef.current)
    svg.attr('width', width).attr('height', height)

    svg.selectAll('*').remove()

    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const now = Date.now()
    const sixtySecondsAgo = now - 60000

    const xScale = d3.scaleLinear()
      .domain([sixtySecondsAgo, now])
      .range([0, chartWidth])

    const tempScale = d3.scaleLinear()
      .domain([1, 150])
      .range([chartHeight, 0])

    const denseScale = d3.scaleLinear()
      .domain([0.1, 5])
      .range([chartHeight, 0])

    const fieldScale = d3.scaleLinear()
      .domain([1, 10])
      .range([chartHeight, 0])

    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat((d) => {
        const seconds = Math.floor((now - (d as number)) / 1000
        return `-${seconds}s`
      })

    g.append('g')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis)
      .style('color', '#8a8fa3')
      .style('font-size', '10px')
      .selectAll('path')
      .style('stroke', 'rgba(138, 143, 163, 0.3)')

    g.selectAll('.tick line')
      .style('stroke', 'rgba(138, 143, 163, 0.2)')

    const tempLine = d3.line<HistoryRecord>()
      .x(d => xScale(d.timestamp))
      .y(d => tempScale(d.temperature))
      .curve(d3.curveMonotoneX)

    const denseLine = d3.line<HistoryRecord>()
      .x(d => xScale(d.timestamp))
      .y(d => denseScale(d.density))
      .curve(d3.curveMonotoneX)

    const fieldLine = d3.line<HistoryRecord>()
      .x(d => xScale(d.timestamp))
      .y(d => fieldScale(d.magneticField))
      .curve(d3.curveMonotoneX)

    const visibleHistory = history.filter(d => d.timestamp >= sixtySecondsAgo)

    g.append('path')
      .datum(visibleHistory)
      .attr('fill', 'none')
      .attr('stroke', COLORS.temperature)
      .attr('stroke-width', 2)
      .attr('d', tempLine)
      .style('filter', 'drop-shadow(0 0 3px rgba(255, 20, 147, 0.5))')

    g.append('path')
      .datum(visibleHistory)
      .attr('fill', 'none')
      .attr('stroke', COLORS.density)
      .attr('stroke-width', 2)
      .attr('d', denseLine)
      .style('filter', 'drop-shadow(0 0 3px rgba(0, 255, 255, 0.5))')

    g.append('path')
      .datum(visibleHistory)
      .attr('fill', 'none')
      .attr('stroke', COLORS.magneticField)
      .attr('stroke-width', 2)
      .attr('d', fieldLine)
      .style('filter', 'drop-shadow(0 0 3px rgba(255, 179, 0, 0.5))')

    const eventMarkers = visibleHistory.filter(d => d.event)
    eventMarkers.forEach(d => {
      g.append('rect')
        .attr('x', xScale(d.timestamp) - 2)
        .attr('y', 0)
        .attr('width', 4)
        .attr('height', chartHeight)
        .attr('fill', '#FF0000')
        .attr('opacity', 0.3)
    })

    const overlay = g.append('rect')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')

    overlay.on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event)
      const xValue = xScale.invert(mouseX)

      let closestRecord: HistoryRecord | null = null
      let closestDistance = Infinity

      visibleHistory.forEach(record => {
        const distance = Math.abs(record.timestamp - xValue)
        if (distance < closestDistance) {
          closestDistance = distance
          closestRecord = record
        }
      })

      if (closestRecord && closestDistance < 2000) {
        const rect = container.getBoundingClientRect()
        setTooltip({
          x: xScale(closestRecord.timestamp) + margin.left,
          y: 10,
          data: closestRecord
        })
      } else {
        setTooltip(prev => ({ ...prev, data: null }))
      }
    })

    overlay.on('mouseleave', () => {
      setTooltip(prev => ({ ...prev, data: null }))
    })

    if (isReplayMode) {
      const replayX = xScale(history[history.length - 1]?.timestamp || now)
      g.append('line')
        .attr('x1', replayX)
        .attr('y1', 0)
        .attr('x2', replayX)
        .attr('y2', chartHeight)
        .attr('stroke', '#00FF66')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .style('animation', 'pulse 1s infinite')
    }
  }, [history, isReplayMode])

  useEffect(() => {
    if (!isReplayMode) {
      drawChart()
    }
  }, [history, drawChart, isReplayMode])

  useEffect(() => {
    const handleResize = () => drawChart()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [drawChart])

  useEffect(() => {
    if (isReplayMode && history.length > 0) {
      let startTime = performance.now()
      const totalDuration = 60000 / replaySpeed
      const startTimestamp = history[0]?.timestamp || 0
      const endTimestamp = history[history.length - 1]?.timestamp || Date.now()
      const totalSpan = endTimestamp - startTimestamp

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / totalDuration, 1)
        const currentTimestamp = startTimestamp + totalSpan * progress

        const record = history.reduce((prev, curr) =>
          Math.abs(curr.timestamp - currentTimestamp) < Math.abs(prev.timestamp - currentTimestamp)
            ? curr : prev
        )

        setReplayTime(currentTimestamp)

        if (progress < 1) {
          replayRef.current = requestAnimationFrame(animate)
        } else {
          toggleReplay()
        }
      }

      replayRef.current = requestAnimationFrame(animate)

      return () => {
        if (replayRef.current) {
          cancelAnimationFrame(replayRef.current)
        }
      }
    }
  }, [isReplayMode, history, replaySpeed, setReplayTime, toggleReplay])

  return (
    <div className="history-panel">
      <div className="history-header">
        <span className="history-title">历史参数记录</span>
        <div className="history-controls">
          <div className="legend">
            <div className="legend-item">
              <div className="legend-line" style={{ backgroundColor: COLORS.temperature }} />
              <span>温度</span>
            </div>
            <div className="legend-item">
              <div className="legend-line" style={{ backgroundColor: COLORS.density }} />
              <span>密度</span>
            </div>
            <div className="legend-item">
              <div className="legend-line" style={{ backgroundColor: COLORS.magneticField }} />
              <span>磁场</span>
            </div>
          </div>
          <button
            className={`replay-btn ${isReplayMode ? 'active' : ''}`}
            onClick={toggleReplay}
          >
            {isReplayMode ? '停止回放' : '回放'}
          </button>
        </div>
      </div>
      <div className="chart-container" ref={containerRef}>
        <svg ref={svgRef} />
        {tooltip.data && (
          <div
            className="chart-tooltip"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y
            }}
          >
            <div className="tooltip-item">
              <div className="tooltip-dot" style={{ backgroundColor: COLORS.temperature }} />
              <span>温度: {tooltip.data.temperature.toFixed(1)} keV</span>
            </div>
            <div className="tooltip-item">
              <div className="tooltip-dot" style={{ backgroundColor: COLORS.density }} />
              <span>密度: {tooltip.data.density.toFixed(2)} ×10²⁰/m³</span>
            </div>
            <div className="tooltip-item">
              <div className="tooltip-dot" style={{ backgroundColor: COLORS.magneticField }} />
              <span>磁场: {tooltip.data.magneticField.toFixed(1)} T</span>
            </div>
            {tooltip.data.event && (
              <div style={{ color: '#FF6666', marginTop: '4px' }}>
                ⚠ 事件发生
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HistoryChart
