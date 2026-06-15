import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react'
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
  radius: number
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

const MAX_WARMUP_ITERATIONS = 200
const TARGET_FPS = 60
const MIN_FPS_THRESHOLD = 55

const Visualizer = forwardRef<VisualizerHandle, VisualizerProps>(({ parseResult, onNodeSelect }, ref) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<D3NodeData, D3LinkData> | null>(null)
  const nodesDataRef = useRef<D3NodeData[]>([])
  const linksDataRef = useRef<D3LinkData[]>([])
  const initialPositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map())
  const frameCountRef = useRef<number>(0)
  const lastFpsTimeRef = useRef<number>(performance.now())
  const rafIdRef = useRef<number | null>(null)
  const linkPathRef = useRef<d3.Selection<SVGPathElement, D3LinkData, SVGGElement, unknown> | null>(null)
  const nodeGRef = useRef<d3.Selection<SVGGElement, D3NodeData, SVGGElement, unknown> | null>(null)

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [perf, setPerf] = useState<PerfMetrics>({ fps: 60, nodeCount: 0, renderTime: 0 })

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

  const measureFps = useCallback(() => {
    frameCountRef.current++
    const now = performance.now()
    if (now - lastFpsTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastFpsTimeRef.current))
      setPerf(p => ({ ...p, fps: Math.min(fps, TARGET_FPS) }))
      frameCountRef.current = 0
      lastFpsTimeRef.current = now

      if (fps < MIN_FPS_THRESHOLD && nodesDataRef.current.length > 50) {
        if (simulationRef.current) {
          simulationRef.current.alphaDecay(0.05).velocityDecay(0.5)
        }
      }
    }
  }, [])

  useEffect(() => {
    const loop = () => {
      measureFps()
      rafIdRef.current = requestAnimationFrame(loop)
    }
    rafIdRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [measureFps])

  useImperativeHandle(ref, () => ({
    resetLayout: () => {
      const simulation = simulationRef.current
      const nodes = nodesDataRef.current
      if (!simulation || nodes.length === 0) return

      const initialPositions = initialPositionsRef.current

      nodes.forEach(node => {
        const initPos = initialPositions.get(node.id)
        if (initPos) {
          node.fx = initPos.x
          node.fy = initPos.y
        }
      })

      simulation.alpha(1).restart()

      setTimeout(() => {
        nodes.forEach(node => {
          node.fx = null
          node.fy = null
        })
        simulation.alpha(0.8).restart()
      }, 1000)
    },
    exportImage: () => {
      if (!svgRef.current) return

      const renderStartTime = performance.now()
      const svg = svgRef.current
      const { width, height } = dimensions

      const serializer = new XMLSerializer()
      const svgClone = svg.cloneNode(true) as SVGSVGElement

      svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      svgClone.setAttribute('width', String(width))
      svgClone.setAttribute('height', String(height))
      svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`)

      const firstChild = svgClone.firstChild
      const bgDefs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
      const bgGrad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
      bgGrad.setAttribute('id', 'exportBgGrad')
      bgGrad.setAttribute('x1', '0%')
      bgGrad.setAttribute('y1', '0%')
      bgGrad.setAttribute('x2', '100%')
      bgGrad.setAttribute('y2', '100%')
      const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop1.setAttribute('offset', '0%')
      stop1.setAttribute('style', 'stop-color:#1a1a2e;stop-opacity:1')
      const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
      stop2.setAttribute('offset', '100%')
      stop2.setAttribute('style', 'stop-color:#16213e;stop-opacity:1')
      bgGrad.appendChild(stop1)
      bgGrad.appendChild(stop2)
      bgDefs.appendChild(bgGrad)

      const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
      bgRect.setAttribute('width', '100%')
      bgRect.setAttribute('height', '100%')
      bgRect.setAttribute('fill', 'url(#exportBgGrad)')

      svgClone.insertBefore(bgDefs, firstChild)
      svgClone.insertBefore(bgRect, firstChild)

      const perfElems = svgClone.querySelectorAll('[data-perf-monitor]')
      perfElems.forEach(el => el.remove())

      const img = new Image()
      img.crossOrigin = 'anonymous'

      const svgString = serializer.serializeToString(svgClone)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      img.onload = () => {
        const scale = 2
        const canvas = document.createElement('canvas')
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

      img.onerror = () => {
        URL.revokeObjectURL(url)
      }

      img.src = url
    },
  }))

  useEffect(() => {
    if (!parseResult || !svgRef.current || dimensions.width === 0) return

    const setupStartTime = performance.now()
    const svg = d3.select(svgRef.current)
    const { width, height } = dimensions

    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    svg.selectAll('*').remove()

    const { nodes, parentMap } = parseResult

    const d3Nodes: D3NodeData[] = nodes.map((n, i) => ({
      ...n,
      radius: calculateNodeRadius(n.childCount),
      x: width / 2 + (Math.random() - 0.5) * Math.min(width * 0.6, 300),
      y: height / 2 + (Math.random() - 0.5) * Math.min(height * 0.6, 200),
      vx: 0,
      vy: 0,
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
      initialPositions.set(n.id, { x: n.x || width / 2, y: n.y || height / 2 })
    })
    initialPositionsRef.current = initialPositions

    const rootG = svg.append('g').attr('class', 'root-group')
    const defs = rootG.append('defs')

    d3Nodes.forEach((node, i) => {
      const color = getNodeColor(node.type)
      const gradientId = `grad-${node.id}-${i}`

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
      const filter = defs.append('filter').attr('id', filterId).attr('x', '-60%').attr('y', '-60%').attr('width', '220%').attr('height', '220%')
      filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur')
      const merge = filter.append('feMerge')
      merge.append('feMergeNode').attr('in', 'coloredBlur')
      merge.append('feMergeNode').attr('in', 'SourceGraphic')
    })

    const linkGroup = rootG.append('g').attr('class', 'links')
    const nodeGroup = rootG.append('g').attr('class', 'nodes')

    const link = linkGroup
      .selectAll<SVGPathElement, D3LinkData>('path.link')
      .data(d3Links)
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(180, 180, 200, 0.5)')
      .attr('stroke-width', 1.5)
      .attr('stroke-linecap', 'round')

    linkPathRef.current = link

    const nodeG = nodeGroup
      .selectAll<SVGGElement, D3NodeData>('g.node')
      .data(d3Nodes, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'grab')
      .style('opacity', 0)

    nodeGRef.current = nodeG

    nodeG
      .append('circle')
      .attr('class', 'node-hit')
      .attr('r', d => d.radius + 6)
      .attr('fill', 'transparent')
      .attr('stroke', 'none')

    nodeG
      .append('circle')
      .attr('class', 'node-visual')
      .attr('r', d => d.radius)
      .attr('fill', (_, i) => `url(#grad-${d3Nodes[i].id}-${i})`)
      .attr('filter', (_, i) => `url(#glow-${d3Nodes[i].id}-${i})`)
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1)
      .style('pointer-events', 'none')

    nodeG
      .append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#ffffff')
      .attr('font-family', "'Consolas', 'Monaco', 'Courier New', monospace")
      .attr('font-size', 12)
      .attr('font-weight', 500)
      .style('pointer-events', 'none')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.6)')
      .text(d => {
        const r = d.radius
        const maxChars = Math.max(4, Math.floor(r / 7))
        return d.label.length > maxChars ? d.label.slice(0, maxChars) + '…' : d.label
      })

    nodeG.transition().duration(500).delay((_, i) => i * 25).style('opacity', 1)

    const simulation = d3
      .forceSimulation<D3NodeData>(d3Nodes)
      .force(
        'link',
        d3
          .forceLink<D3NodeData, D3LinkData>(d3Links)
          .id((d: any) => d.id)
          .distance(130)
          .strength(0.55)
      )
      .force('charge', d3.forceManyBody().strength((d: any) => -60 * (d.radius / 40)))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.12))
      .force('collision', d3.forceCollide<D3NodeData>().radius(d => d.radius + 14).iterations(2))
      .force('x', d3.forceX<D3NodeData>(width / 2).strength(0.05))
      .force('y', d3.forceY<D3NodeData>(height / 2).strength(0.05))
      .alphaDecay(0.028)
      .velocityDecay(0.38)
      .stop()

    const warmupIters = Math.min(MAX_WARMUP_ITERATIONS, Math.ceil(d3Nodes.length * 4))
    for (let i = 0; i < warmupIters; i++) {
      simulation.tick()
    }

    d3Nodes.forEach(n => {
      const initPos = initialPositions.get(n.id)
      if (initPos) {
        initPos.x = n.x || width / 2
        initPos.y = n.y || height / 2
      }
    })

    function bezierPath(d: D3LinkData): string {
      const source = d.source as D3NodeData
      const target = d.target as D3NodeData
      const sx = source.x ?? 0
      const sy = source.y ?? 0
      const tx = target.x ?? 0
      const ty = target.y ?? 0
      const sr = (source as D3NodeData).radius || 30
      const tr = (target as D3NodeData).radius || 30

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
      const perpX = -ny * dist * 0.08
      const perpY = nx * dist * 0.08

      return `M ${startX} ${startY} Q ${mx + perpX} ${my + perpY} ${endX} ${endY}`
    }

    simulation.on('tick.render', () => {
      link.attr('d', bezierPath as any)
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    simulation.on('end', () => {
      link.attr('d', bezierPath as any)
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    simulation.alpha(1).restart()

    let isDragging = false
    let dragStartPos: { x: number; y: number } | null = null

    const drag = d3
      .drag<SVGGElement, D3NodeData>()
      .on('start', function (event, d) {
        isDragging = true
        dragStartPos = { x: event.x, y: event.y }
        if (!event.active) {
          simulation.alphaTarget(0.45).restart()
        }
        d.fx = d.x
        d.fy = d.y
        d3.select(this)
          .attr('cursor', 'grabbing')
          .select('.node-visual')
          .attr('stroke', 'rgba(255,255,255,0.65)')
          .attr('stroke-width', 2)
          .transition()
          .duration(120)
          .attr('r', d.radius * 1.06)
      })
      .on('drag', function (event, d) {
        const margin = 20
        d.fx = Math.max(margin, Math.min(width - margin, event.x))
        d.fy = Math.max(margin, Math.min(height - margin, event.y))
      })
      .on('end', function (event, d) {
        isDragging = false
        if (!event.active) {
          simulation.alphaTarget(0)
        }
        d.fx = null
        d.fy = null
        d3.select(this)
          .attr('cursor', 'grab')
          .select('.node-visual')
          .attr('stroke', 'rgba(255,255,255,0.2)')
          .attr('stroke-width', 1)
          .transition()
          .duration(300)
          .ease(d3.easeElasticOut.amplitude(1.2).period(0.45))
          .attr('r', d.radius)

        simulation.alpha(0.25).restart()
      })

    nodeG.call(drag as any)

    nodeG.on('pointerdown', function (event) {
      dragStartPos = { x: event.clientX, y: event.clientY }
    })

    nodeG.on('pointerup', function (event, d) {
      if (!dragStartPos) return
      const dx = Math.abs(event.clientX - dragStartPos.x)
      const dy = Math.abs(event.clientY - dragStartPos.y)
      if (dx < 5 && dy < 5 && !isDragging) {
        onNodeSelect(d)
      }
      dragStartPos = null
    })

    simulationRef.current = simulation

    const setupTime = performance.now() - setupStartTime
    setPerf({ fps: 60, nodeCount: d3Nodes.length, renderTime: Math.round(setupTime) })

    console.info(`[CodeMosaic] 可视化初始化: ${d3Nodes.length}节点, ${setupTime.toFixed(0)}ms`)

    return () => {
      simulation.stop()
      simulationRef.current = null
    }
  }, [parseResult, dimensions, onNodeSelect])

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
        data-perf-monitor="true"
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          padding: '6px 12px',
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(10px)',
          borderRadius: 8,
          fontSize: 11,
          fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
          pointerEvents: 'none',
          border: '1px solid rgba(255,255,255,0.08)',
          zIndex: 10,
        }}
      >
        <span
          style={{
            color: perf.fps >= 55 ? '#10b981' : perf.fps >= 45 ? '#f59e0b' : '#ef4444',
            fontWeight: 700,
          }}
        >
          {perf.fps} FPS
        </span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ color: 'rgba(224,224,224,0.85)' }}>{perf.nodeCount} 节点</span>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>|</span>
        <span style={{ color: 'rgba(224,224,224,0.85)' }}>{perf.renderTime}ms</span>
      </div>

      {parseResult && (
        <div
          data-perf-monitor="true"
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            padding: '8px 12px',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(10px)',
            borderRadius: 8,
            fontSize: 10,
            fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
            pointerEvents: 'none',
            border: '1px solid rgba(255,255,255,0.08)',
            maxWidth: '72%',
            zIndex: 10,
          }}
        >
          {[
            { type: 'VariableDeclaration' as const, label: '变量' },
            { type: 'FunctionDeclaration' as const, label: '函数' },
            { type: 'ArrowFunction' as const, label: '箭头' },
            { type: 'IfStatement' as const, label: '条件' },
            { type: 'ForStatement' as const, label: '循环' },
            { type: 'WhileStatement' as const, label: 'While' },
            { type: 'ExpressionStatement' as const, label: '表达式' },
          ].map(item => (
            <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getNodeColor(item.type),
                  boxShadow: `0 0 5px ${getNodeColor(item.type)}80`,
                }}
              />
              <span style={{ color: 'rgba(224,224,224,0.85)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

Visualizer.displayName = 'Visualizer'

export default Visualizer
