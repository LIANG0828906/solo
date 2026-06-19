import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { useSimStore, calculatePhotosynthesisRate } from '@/store/useSimStore'

interface DataPoint {
  lux: number
  rate: number
}

export default function ChartPanel() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { lightParams, activeSchemeId } = useSimStore()
  const [data, setData] = useState<DataPoint[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const dataRef = useRef<DataPoint[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      const rate = calculatePhotosynthesisRate(lightParams.intensity)
      const newPoint: DataPoint = {
        lux: lightParams.intensity,
        rate: Math.round(rate * 10) / 10
      }
      dataRef.current = [...dataRef.current, newPoint].slice(-30)
      setData([...dataRef.current])
    }, 500)

    return () => clearInterval(interval)
  }, [lightParams.intensity])

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height: height - 60 })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || data.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 20, bottom: 40, left: 50 }
    const width = dimensions.width - margin.left - margin.right
    const height = dimensions.height - margin.top - margin.bottom

    const g = svg
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    const xScale = d3.scaleLinear()
      .domain([0, 1000])
      .range([0, width])

    const yScale = d3.scaleLinear()
      .domain([0, 18])
      .range([height, 0])

    const gradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'line-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4CAF50')

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#FFC107')

    const areaGradient = svg.append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%')

    areaGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#4CAF50')
      .attr('stop-opacity', 0.2)

    areaGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4CAF50')
      .attr('stop-opacity', 0)

    g.append('rect')
      .attr('x', xScale(300))
      .attr('y', 0)
      .attr('width', xScale(700) - xScale(300))
      .attr('height', height)
      .attr('fill', '#4CAF50')
      .attr('opacity', 0.1)

    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => `${d}`)

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}`)

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#555')

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .style('font-size', '10px')
      .style('fill', '#555')

    g.selectAll('.domain')
      .style('stroke', '#ccc')

    g.selectAll('.tick line')
      .style('stroke', '#eee')

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('光合速率 (μmol CO₂/m²/s)')

    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 32)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#666')
      .text('照度 (lux)')

    const line = d3.line<DataPoint>()
      .x(d => xScale(d.lux))
      .y(d => yScale(d.rate))
      .curve(d3.curveMonotoneX)

    const area = d3.area<DataPoint>()
      .x(d => xScale(d.lux))
      .y0(height)
      .y1(d => yScale(d.rate))
      .curve(d3.curveMonotoneX)

    const sortedData = [...data].sort((a, b) => a.lux - b.lux)

    if (sortedData.length > 1) {
      g.append('path')
        .datum(sortedData)
        .attr('fill', 'url(#area-gradient)')
        .attr('d', area)

      g.append('path')
        .datum(sortedData)
        .attr('fill', 'none')
        .attr('stroke', 'url(#line-gradient)')
        .attr('stroke-width', 2.5)
        .attr('d', line)
    }

    g.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => xScale(d.lux))
      .attr('cy', d => yScale(d.rate))
      .attr('r', 3)
      .attr('fill', '#4CAF50')
      .attr('opacity', 0.8)

    const currentRate = calculatePhotosynthesisRate(lightParams.intensity)
    
    g.append('line')
      .attr('x1', xScale(lightParams.intensity))
      .attr('x2', xScale(lightParams.intensity))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#FF5722')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.5)

    g.append('circle')
      .attr('cx', xScale(lightParams.intensity))
      .attr('cy', yScale(currentRate))
      .attr('r', 6)
      .attr('fill', '#FF5722')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)

  }, [data, dimensions, lightParams.intensity, activeSchemeId])

  const currentRate = calculatePhotosynthesisRate(lightParams.intensity)

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: 600,
          color: '#2E7D32'
        }}>
          光合效率实时监测
        </h3>
        <div style={{
          padding: '4px 12px',
          background: 'linear-gradient(135deg, #4CAF50, #81C784)',
          borderRadius: '20px',
          color: 'white',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {currentRate.toFixed(1)} μmol
        </div>
      </div>

      <svg ref={svgRef} style={{ flex: 1, minHeight: '180px' }} />

      <div style={{
        marginTop: '12px',
        padding: '10px 14px',
        background: 'rgba(76, 175, 80, 0.1)',
        borderRadius: '8px',
        borderLeft: '3px solid #4CAF50'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#555',
          marginBottom: '4px'
        }}>
          推荐照度范围
        </div>
        <div style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#2E7D32'
        }}>
          300 - 700 lux
        </div>
      </div>
    </div>
  )
}
