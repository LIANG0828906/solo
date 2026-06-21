import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import * as d3 from 'd3'
import type { AccuracyPoint, HistoryRecord } from '@/types'

interface HistoryChartProps {
  userId: string
}

const margin = { top: 20, right: 20, bottom: 30, left: 40 }

export default function HistoryChart({ userId }: HistoryChartProps) {
  const [expanded, setExpanded] = useState(false)
  const [points, setPoints] = useState<AccuracyPoint[]>([])
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 280 })

  useEffect(() => {
    if (!userId || !expanded) return

    const controller = new AbortController()

    fetch(`/api/history/${userId}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch history')
        return res.json()
      })
      .then((data: { records?: HistoryRecord[] }) => {
        if (data.records && Array.isArray(data.records)) {
          const sorted = [...data.records].sort(
            (a, b) => a.timestamp - b.timestamp,
          )
          const accPoints: AccuracyPoint[] = []
          let successCount = 0
          sorted.forEach((r, i) => {
            if (r.status === 'success') successCount++
            const accuracy = Math.round((successCount / (i + 1)) * 100)
            accPoints.push({ index: i + 1, accuracy })
          })
          setPoints(accPoints)
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setPoints([])
        }
      })

    return () => {
      controller.abort()
    }
  }, [userId, expanded])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const updateSize = () => {
      setContainerSize({ width: el.clientWidth, height: 280 })
    }

    updateSize()

    const ro = new ResizeObserver(updateSize)
    ro.observe(el)

    return () => ro.disconnect()
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    if (!svgRef.current) return
    if (containerSize.width === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { width, height } = containerSize

    if (points.length === 0) {
      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', 'var(--text-secondary)')
        .attr('font-size', 13)
        .text('暂无数据，运行代码后将显示趋势')
      return
    }

    const innerWidth = Math.max(0, width - margin.left - margin.right)
    const innerHeight = Math.max(0, height - margin.top - margin.bottom)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .style('opacity', 0)

    g.transition().duration(400).style('opacity', 1)

    const maxIndex = Math.max(1, points[points.length - 1].index)
    const xDomain: [number, number] =
      points.length === 1 ? [0, 1] : [1, maxIndex]

    const x = d3.scaleLinear().domain(xDomain).range([0, innerWidth])

    const y = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0])

    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(x)
          .ticks(Math.min(5, points.length))
          .tickFormat(d3.format('d'))
          .tickSizeOuter(0),
      )
      .call((sel) => {
        sel.selectAll('text').attr('fill', 'var(--text-secondary)').attr('font-size', 11)
        sel
          .selectAll('line')
          .attr('stroke', 'rgba(255,255,255,0.1)')
        sel.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)')
      })

    g.append('g')
      .call(
        d3.axisLeft(y).ticks(5).tickFormat((d) => `${d}%`).tickSizeOuter(0),
      )
      .call((sel) => {
        sel.selectAll('text').attr('fill', 'var(--text-secondary)').attr('font-size', 11)
        sel
          .selectAll('line')
          .attr('stroke', 'rgba(255,255,255,0.1)')
        sel.select('.domain').attr('stroke', 'rgba(255,255,255,0.15)')
      })

    const line = d3
      .line<AccuracyPoint>()
      .x((d) => x(d.index) ?? 0)
      .y((d) => y(d.accuracy) ?? 0)
      .curve(d3.curveMonotoneX)

    const path = g
      .append('path')
      .datum(points)
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')

    const pathNode = path.node()
    if (pathNode) {
      const totalLength = pathNode.getTotalLength()
      path
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(600)
        .ease(d3.easeCubicOut)
        .attr('stroke-dashoffset', 0)
    }

    const tooltip = d3.select(tooltipRef.current)

    g.selectAll<SVGCircleElement, AccuracyPoint>('circle')
      .data(points)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.index) ?? 0)
      .attr('cy', (d) => y(d.accuracy) ?? 0)
      .attr('r', 0)
      .attr('fill', '#06b6d4')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(150).attr('r', 6)
        tooltip
          .style('opacity', 1)
          .style('display', 'block')
          .html(`第${d.index}次: ${d.accuracy}%`)
        const [mx, my] = d3.pointer(event, containerRef.current)
        tooltip
          .style('left', `${mx + 12}px`)
          .style('top', `${my - 28}px`)
      })
      .on('mousemove', function (event) {
        const [mx, my] = d3.pointer(event, containerRef.current)
        tooltip
          .style('left', `${mx + 12}px`)
          .style('top', `${my - 28}px`)
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(150).attr('r', 4)
        tooltip.style('opacity', 0).style('display', 'none')
      })
      .transition()
      .delay(400)
      .duration(300)
      .attr('r', 4)
  }, [points, containerSize, expanded])

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="btn-press"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          padding: '10px 16px',
          background: 'rgba(6, 182, 212, 0.08)',
          color: '#06b6d4',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'background .2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(6, 182, 212, 0.08)'
        }}
      >
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        查看正确率趋势
      </button>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          marginTop: 12,
          maxHeight: expanded ? 500 : 0,
          opacity: expanded ? 1 : 0,
          overflow: 'hidden',
          transition:
            'max-height .45s cubic-bezier(.22,1,.36,1), opacity .3s',
        }}
      >
        <div
          style={{
            width: '100%',
            height: 280,
            background: 'rgba(15, 23, 42, 0.5)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.05)',
            padding: 8,
            position: 'relative',
          }}
        >
          <svg
            ref={svgRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />

          <div
            ref={tooltipRef}
            style={{
              position: 'absolute',
              background: '#1e293b',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 6,
              fontSize: 12,
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,.4)',
              opacity: 0,
              display: 'none',
              zIndex: 10,
              whiteSpace: 'nowrap',
              transition: 'opacity .15s ease',
            }}
          />
        </div>
      </div>
    </div>
  )
}
