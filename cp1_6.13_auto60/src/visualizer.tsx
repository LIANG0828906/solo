import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react'
import * as d3 from 'd3'
import type { SyntaxNode, ParseResult } from './parser'
import { getNodeColor, getTypeLabel, calculateNodeRadius } from './parser'

export interface VisualizerHandle {
  resetLayout: () => void
  exportImage: () => void
}

interface VisualizerProps {
  parseResult: ParseResult | null
  onNodeSelect: (node: SyntaxNode | null) => void
}

interface D3NodeData extends SyntaxNode {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  vx?: number
  vy?: number
  radius?: number
}

interface D3LinkData {
  source: string | D3NodeData
  target: string | D3NodeData
}

interface PerfMetrics {
  fps: number
  nodeCount: number
  renderTime: number
}

const MAX_ITERATIONS = 300
const TARGET_FPS = 60

const Visualizer = forwardRef<VisualizerHandle, VisualizerProps>(({ parseResult, onNodeSelect }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<D3NodeData, D3LinkData> | null>(null)
  const nodesDataRef = useRef<D3NodeData[]>([])
  const linksDataRef = useRef<D3LinkData[]>([])
  const frameCountRef = useRef<number>(0)
  const lastFpsTimeRef = useRef<number>(performance.now())
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [perf, setPerf] = useState<PerfMetrics>({ fps: 60, nodeCount: 0, renderTime: 0 })
  const [animationKey, setAnimationKey] = useState(0)

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDimensions({
          width: Math.max(rect.width, 400),
          height: Math.max(rect.height, 300),
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  useImperativeHandle(ref, () => ({
    resetLayout: () => {
      if (!simulationRef.current || nodesDataRef.current.length === 0) return

      const nodes = nodesDataRef.current
      const initialPositions = initialPositionsRef.current

      nodes.forEach(node => {
        const initPos = initialPositions.get(node.id)
        if (initPos) {
          node.fx = initPos.x
          node.fy = initPos.y
        }
      })

      simulationRef.current.alpha(1).restart()

      setTimeout(() => {
        nodes.forEach(node => {
          node.fx = null
          node.fy = null
        })
        simulationRef.current?.alpha(0.8).restart()
      }, 1000)

      setAnimationKey(k => k + 1)
    },
    exportImage: () => {
      if (!svgRef.current) return

      const renderStartTime = performance.now()
      const svg = svgRef.current
      const serializer = new XMLSerializer()
      let svgString = serializer.serializeToString(svg)

      const { width, height } = dimensions

      const bgRect = `<defs>
        <linearGradient id="exportBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#16213e;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#exportBg)"/>`

      svgString = svgString.replace(
        '<svg',
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`
      )
      const insertIdx = svgString.indexOf('>') + 1
      svgString = svgString.slice(0, insertIdx) + bgRect + svgString.slice(insertIdx)

      const img = new Image()
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        const canvas = document.createElement('canvas')
        const scale = 2
        canvas.width = width * scale
        canvas.height = height * scale
        const ctx = canvas.getContext('2d')!
        ctx.scale(scale, scale)

        const gradient = ctx.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, '#1a1a2e')
        gradient.addColorStop(1, '#16213e')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, width, height)

        ctx.drawImage(img, 0, 0, width, height)
        URL.revokeObjectURL(url)

        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.download = `codemosaic-${Date.now()}.png`
        link.href = pngUrl
        link.click()

        const renderTime = performance.now() - renderStartTime
        setPerf(p => ({ ...p, renderTime: Math.round(renderTime) }))
      }

      img.src = url
    },
  }))

  useEffect(() => {
    if (!parseResult || !svgRef.current || dimensions.width === 0) return

    const setupStartTime = performance.now()
    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions

    svg.selectAll('*').remove()

    const { nodes, parentMap } = parseResult

    const d3Nodes: D3NodeData[] = nodes.map(n => ({
      ...n,
      radius: calculateNodeRadius(n.childCount),
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }))

    const d3Links: D3LinkData[] = []
    parentMap.forEach((children, parentId) => {
      children.forEach(childId => {
        d3Links.push({ source: parentId, target: childId })
      })
    })

    nodesDataRef.current = d3Nodes
    linksDataRef.current = d3Links

    const initialPositions = new Map<string, { x: number; y: number }>()
    d3Nodes.forEach(n => {
      if (n.x !== undefined && n.y !== undefined) {
        initialPositions.set(n.id, { x: n.x, y: n.y })
      }
    })
    initialPositionsRef.current = initialPositions

    const rootG = svg.append('g').attr('class', 'root-group')

    const defs = rootG.append('defs')

    d3Nodes.forEach((node, i) => {
      const color = getNodeColor(node.type)
      const gradientId = `grad-${node.id}-${Date.now()}-${i}`

      const radialGrad = defs
        .append('radialGradient')
        .attr('id', gradientId)
        .attr('cx', '35%')
        .attr('cy', '30%')
        .attr('r', '75%')

      radialGrad.append('stop').attr('offset', '0%').attr('stop-color', d3.color(color)!.brighter(1.5).toString()).attr('stop-opacity', '1')
      radialGrad.append('stop').attr('offset', '50%').attr('stop-color', color).attr('stop-opacity', '1')
      radialGrad.append('stop').attr('offset', '100%').attr('stop-color', d3.color(color)!.darker(1).toString()).attr('stop-opacity', '1')

      const filterId = `glow-${node.id}-${i}`
      const filter = defs.append('filter').attr('id', filterId).attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%')
      filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur')
      const merge = filter.append('feMerge')
      merge.append('feMergeNode').attr('in', 'coloredBlur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })

    const linkGroup = rootG.append('g').attr('class', 'links')
    const nodeGroup = rootG.append('g').attr('class', 'nodes')

    const link = linkGroup
      .selectAll('path')
      .data(d3Links)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(180, 180, 200, 0.5)')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')

    const node = nodeGroup
      .selectAll<SVGGElement, D3NodeData>('g')
      .data(d3Nodes, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('cursor', 'grab')
      .style('opacity', 0)

    node
      .append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => d.radius || 30)
      .attr('fill', (d, i) => `url(#grad-${d.id}-${Date.now()}-${i})`)
      .attr('filter', (d, i) => `url(#glow-${d.id}-${i})`)
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)

    node
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-family', 'monospace')
      .attr('font-size', 12)
      .attr('font-weight', 500)
      .attr('pointer-events', 'none')
      .text(d => {
        const r = d.radius || 30
        const maxChars = Math.max(4, Math.floor(r / 7))
        return d.label.length > maxChars ? d.label.slice(0, maxChars) + '…' : d.label
      })

    node
      .append('circle')
      .attr('class', 'click-area')
      .attr('r', d => (d.radius || 30) + 5)
      .attr('fill', 'transparent')
      .attr('stroke', 'none')

    node.transition().duration(500).delay((_, i) => i * 30).style('opacity', 1)

    const simulation = d3
      .forceSimulation<D3NodeData>(d3Nodes)
      .force(
        'link',
        d3
          .forceLink<D3NodeData, D3LinkData>(d3Links)
          .id((d: any) => d.id)
          .distance(140)
          .strength(0.2)
      )
      .force('charge', d3.forceManyBody().strength((d: any) => -40 * ((d.radius || 30) / 30)))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.15))
      .force(
        'collision',
        d3.forceCollide().radius((d: any) => (d.radius || 30) + 15)
      )
      .force('x', d3.forceX(width / 2).strength(0.04))
      .force('y', d3.forceY(height / 2).strength(0.04))
      .stop()

    simulation.iterations = Math.min(MAX_ITERATIONS, Math.ceil(d3Nodes.length * 5))
    for (let i = 0; i < simulation.iterations; i++) {
      simulation.tick()
    }

    d3Nodes.forEach(n => {
      const initPos = initialPositions.get(n.id)
      if (initPos) {
        initPos.x = n.x || width / 2
        initPos.y = n.y || height / 2
      }
    })

    simulation.alphaDecay(0.022).velocityDecay(0.4).restart()

    let rafId: number

    const measureFps = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastFpsTimeRef.current >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current))
        setPerf(p => ({ ...p, fps: Math.min(fps, TARGET_FPS), nodeCount: d3Nodes.length }))
        frameCountRef.current = 0
        lastFpsTimeRef.current = now
      }
    }

    function bezierPath(d: D3LinkData): string {
      const source = d.source as D3NodeData
      const target = d.target as D3NodeData
      const sx = source.x || 0
      const sy = source.y || 0
      const tx = target.x || 0
      const ty = target.y || 0
      const sr = (source as any).radius || 30
      const tr = (target as any).radius || 30

      const dx = tx - sx
      const dy = ty - sy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const nx = dx / dist
      const ny = dy / dist

      const startX = sx + nx * sr
      const startY = sy + ny * sr
      const endX = tx - nx * tr
      const endY = ty - ny * tr

      const mx = (startX + endX) / 2
      const my = (startY + endY) / 2
      const perpX = -ny * dist * 0.1
      const perpY = nx * dist * 0.1

      return `M ${startX} ${startY} Q ${mx + perpX} ${my + perpY} ${endX} ${endY}`
    }

    simulation.on('tick', () => {
      link.attr('d', bezierPath as any)

      node.attr('transform', d => `translate(${d.x},${d.y})`)

      node.select('.node-circle')
        .transition()
        .duration(0)
        .attr('cx', 0)
        .attr('cy', 0)

      measureFps()
    })

    rafId = requestAnimationFrame(function loop() {
      measureFps()
      rafId = requestAnimationFrame(loop)
    })

    const drag = d3
      .drag<SVGGElement, D3NodeData>()
      .on('start', function (event, d) {
        if (!event.active) simulation.alphaTarget(0.35).restart()
        d.fx = d.x
        d.fy = d.y
        d3.select(this).attr('cursor', 'grabbing').select('.node-circle').attr('stroke', 'rgba(255,255,255,0.6)').attr('stroke-width', 2)
      })
      .on('drag', function (event, d) {
        const margin = 50
        d.fx = Math.max(margin, Math.min(width - margin, event.x))
        d.fy = Math.max(margin, Math.min(height - margin, event.y))
      })
      .on('end', function (event, d) {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
        d3.select(this)
          .attr('cursor', 'grab')
          .select('.node-circle')
          .attr('stroke', 'rgba(255,255,255,0.2)')
          .attr('stroke-width', 1)
      })

    node.call(drag as any)

    let clickStartPos: { x: number; y: number } | null = null

    node.on('pointerdown', function (event) {
      clickStartPos = { x: event.clientX, y: event.clientY }
    })

    node.on('pointerup', function (event, d) {
      if (!clickStartPos) return
      const dx = Math.abs(event.clientX - clickStartPos.x)
      const dy = Math.abs(event.clientY - clickStartPos.y)
      if (dx < 5 && dy < 5) {
        onNodeSelect(d)
      }
      clickStartPos = null
    })

    simulationRef.current = simulation

    const setupTime = performance.now() - setupStartTime
    setPerf(p => ({ ...p, renderTime: Math.round(setupTime), nodeCount: d3Nodes.length }))

    return () => {
      simulation.stop()
      cancelAnimationFrame(rafId)
    }
  }, [parseResult, dimensions])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 300,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ display: 'block' }}
      />

      {!parseResult && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            color: 'rgba(224, 224, 224, 0.5)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontSize: 56, opacity: 0.3 }}>🫧</div>
          <div style={{ fontSize: 16, fontFamily: 'monospace', letterSpacing: 1 }}>
            输入代码后点击「解析并可视化」
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            支持变量声明、函数、箭头函数、条件、循环等
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          fontSize: 11,
          fontFamily: 'monospace',
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <span
          style={{
            color: perf.fps >= 55 ? '#10b981' : perf.fps >= 45 ? '#f59e0b' : '#ef4444',
          }}
        >
          FPS: {perf.fps}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ color: 'rgba(224,224,224,0.8)' }}>节点: {perf.nodeCount}</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ color: 'rgba(224,224,224,0.8)' }}>{perf.renderTime}ms</span>
      </div>

      {parseResult && (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8,
            fontSize: 10,
            fontFamily: 'monospace',
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: '70%',
          }}
        >
          {[
            { type: 'VariableDeclaration', label: '变量' },
            { type: 'FunctionDeclaration', label: '函数' },
            { type: 'ArrowFunction', label: '箭头' },
            { type: 'IfStatement', label: '条件' },
            { type: 'ForStatement', label: '循环' },
            { type: 'ExpressionStatement', label: '表达式' },
          ].map(item => (
            <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: getNodeColor(item.type as any),
                  boxShadow: `0 0 6px ${getNodeColor(item.type as any)}`,
                }}
              />
              <span style={{ color: 'rgba(224,224,224,0.8)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

Visualizer.displayName = 'Visualizer'

export default Visualizer
