import { useEffect, useRef, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import { useTaskStore, TaskStatus } from '../hooks/useTaskStore'

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  name: string
  status: TaskStatus
  x: number
  y: number
  fx?: number | null
  fy?: number | null
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: string
  source: GraphNode | string
  target: GraphNode | string
}

interface DependencyGraphProps {
  width: number
  height: number
}

const statusColors: Record<TaskStatus, string> = {
  todo: '#f59e0b',
  'in-progress': '#3b82f6',
  done: '#10b981',
}

export function DependencyGraph({ width, height }: DependencyGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const linksRef = useRef<GraphLink[]>([])

  const tasks = useTaskStore((s) => s.tasks)
  const dependencies = useTaskStore((s) => s.dependencies)
  const updateTask = useTaskStore((s) => s.updateTask)
  const removeDependency = useTaskStore((s) => s.removeDependency)
  const setHighlightedTask = useTaskStore((s) => s.setHighlightedTask)
  const highlightedTaskId = useTaskStore((s) => s.highlightedTaskId)
  const getDownstreamTasks = useTaskStore((s) => s.getDownstreamTasks)
  const getUpstreamTasks = useTaskStore((s) => s.getUpstreamTasks)
  const statusFilter = useTaskStore((s) => s.statusFilter)
  const searchQuery = useTaskStore((s) => s.searchQuery)
  const detectCycles = useTaskStore((s) => s.detectCycles)

  const filteredTaskIds = useMemo(() => {
    const ids = new Set<string>()
    tasks.forEach((t) => {
      const matchesSearch =
        !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter
      if (matchesSearch && matchesStatus) {
        ids.add(t.id)
      }
    })
    return ids
  }, [tasks, searchQuery, statusFilter])

  const downstreamIds = useMemo(() => {
    if (!highlightedTaskId) return new Set<string>()
    return new Set(getDownstreamTasks(highlightedTaskId))
  }, [highlightedTaskId, getDownstreamTasks])

  const upstreamIds = useMemo(() => {
    if (!highlightedTaskId) return new Set<string>()
    return new Set(getUpstreamTasks(highlightedTaskId))
  }, [highlightedTaskId, getUpstreamTasks])

  const cycleIds = useMemo(() => {
    return new Set(detectCycles())
  }, [detectCycles])

  const visibleDependencies = useMemo(() => {
    return dependencies.filter(
      (d) => filteredTaskIds.has(d.source) && filteredTaskIds.has(d.target)
    )
  }, [dependencies, filteredTaskIds])

  useEffect(() => {
    if (!svgRef.current || width === 0 || height === 0) return

    nodesRef.current = tasks
      .filter((t) => filteredTaskIds.has(t.id))
      .map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        x: t.x,
        y: t.y,
      }))

    linksRef.current = visibleDependencies.map((d) => ({
      id: d.id,
      source: d.source,
      target: d.target,
    }))

    const svg = d3.select(svgRef.current)

    svg.selectAll('*').remove()

    svg.attr('width', width).attr('height', height)

    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#0f9b8e')

    defs
      .append('marker')
      .attr('id', 'arrowhead-highlighted')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 28)
      .attr('refY', 0)
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#3b82f6')

    const container = svg.append('g').attr('class', 'graph-container')

    const linkGroup = container.append('g').attr('class', 'links')
    const nodeGroup = container.append('g').attr('class', 'nodes')

    const drag = d3
      .drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (!event.active && simulationRef.current) {
          simulationRef.current.alphaTarget(0.3).restart()
        }
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active && simulationRef.current) {
          simulationRef.current.alphaTarget(0)
        }
        updateTask(d.id, { x: d.x || 0, y: d.y || 0 })
        d.fx = null
        d.fy = null
      })

    const updateGraph = () => {
      const link = linkGroup
        .selectAll<SVGPathElement, GraphLink>('path.link')
        .data(linksRef.current, (d: any) => d.id)

      link.exit().remove()

      const linkEnter = link
        .enter()
        .append('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', '#0f9b8e')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', 'url(#arrowhead)')
        .style('cursor', 'pointer')
        .style('transition', 'all 0.3s ease')
        .on('contextmenu', (event, d) => {
          event.preventDefault()
          if (confirm('确定要删除这条依赖关系吗？')) {
            removeDependency(d.id)
          }
        })
        .on('mouseenter', function () {
          d3.select(this)
            .attr('stroke-width', 4)
            .attr('stroke-opacity', 1)
        })
        .on('mouseleave', function (event, d) {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source
          const targetId = typeof d.target === 'object' ? d.target.id : d.target
          const isHighlighted =
            highlightedTaskId &&
            (sourceId === highlightedTaskId ||
              targetId === highlightedTaskId ||
              downstreamIds.has(targetId) ||
              upstreamIds.has(sourceId))
          d3.select(this)
            .attr('stroke-width', isHighlighted ? 3 : 2)
            .attr('stroke-opacity', isHighlighted ? 1 : 0.6)
        })

      const node = nodeGroup
        .selectAll<SVGGElement, GraphNode>('g.node')
        .data(nodesRef.current, (d) => d.id)

      node.exit().remove()

      const nodeEnter = node
        .enter()
        .append('g')
        .attr('class', 'node')
        .style('cursor', 'grab')
        .call(drag)
        .on('click', (event, d) => {
          event.stopPropagation()
          if (highlightedTaskId === d.id) {
            setHighlightedTask(null)
          } else {
            setHighlightedTask(d.id)
          }
        })

      nodeEnter
        .append('rect')
        .attr('class', 'node-rect')
        .attr('rx', 8)
        .attr('ry', 8)
        .attr('x', -80)
        .attr('y', -30)
        .attr('width', 160)
        .attr('height', 60)
        .attr('fill', 'rgba(255, 255, 255, 0.05)')
        .attr('stroke', '#0f9b8e')
        .attr('stroke-width', 1.5)
        .style('backdrop-filter', 'blur(10px)')
        .style(
          'transition',
          'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
        )

      nodeEnter
        .append('text')
        .attr('class', 'node-text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-5')
        .attr('fill', '#fff')
        .attr('font-size', '13')
        .attr('font-weight', '500')
        .style('pointer-events', 'none')
        .text((d) => d.name)

      nodeEnter
        .append('circle')
        .attr('class', 'status-dot')
        .attr('r', 6)
        .attr('cx', 0)
        .attr('cy', 15)
        .attr('fill', (d) => statusColors[d.status])

      const allNodes = nodeEnter.merge(node as any)
      const allLinks = linkEnter.merge(link as any)

      allNodes
        .select('.node-rect')
        .attr('stroke', (d) => {
          if (cycleIds.has(d.id)) return '#ef4444'
          if (d.id === highlightedTaskId) return '#0f9b8e'
          if (downstreamIds.has(d.id)) return '#3b82f6'
          if (upstreamIds.has(d.id)) return '#f97316'
          return '#0f9b8e'
        })
        .attr('stroke-width', (d) => {
          if (
            d.id === highlightedTaskId ||
            downstreamIds.has(d.id) ||
            upstreamIds.has(d.id) ||
            cycleIds.has(d.id)
          ) {
            return 3
          }
          return 1.5
        })
        .attr('filter', (d) => {
          if (
            d.id === highlightedTaskId ||
            downstreamIds.has(d.id) ||
            upstreamIds.has(d.id)
          ) {
            return 'drop-shadow(0 0 10px rgba(15, 155, 142, 0.5))'
          }
          return 'none'
        })

      allLinks
        .attr('stroke', (d) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source
          const targetId = typeof d.target === 'object' ? d.target.id : d.target
          if (
            sourceId === highlightedTaskId ||
            targetId === highlightedTaskId
          ) {
            return '#3b82f6'
          }
          if (downstreamIds.has(targetId) && upstreamIds.has(sourceId)) {
            return '#3b82f6'
          }
          return '#0f9b8e'
        })
        .attr('stroke-width', (d) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source
          const targetId = typeof d.target === 'object' ? d.target.id : d.target
          if (
            sourceId === highlightedTaskId ||
            targetId === highlightedTaskId
          ) {
            return 3
          }
          return 2
        })
        .attr('stroke-opacity', (d) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source
          const targetId = typeof d.target === 'object' ? d.target.id : d.target
          if (
            sourceId === highlightedTaskId ||
            targetId === highlightedTaskId
          ) {
            return 1
          }
          return 0.6
        })
        .attr('marker-end', (d) => {
          const sourceId = typeof d.source === 'object' ? d.source.id : d.source
          const targetId = typeof d.target === 'object' ? d.target.id : d.target
          if (
            sourceId === highlightedTaskId ||
            targetId === highlightedTaskId
          ) {
            return 'url(#arrowhead-highlighted)'
          }
          return 'url(#arrowhead)'
        })

      simulationRef.current = d3
        .forceSimulation(nodesRef.current)
        .force(
          'link',
          d3
            .forceLink(linksRef.current)
            .id((d: any) => d.id)
            .distance(180)
            .strength(0.6)
        )
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(90))
        .alphaDecay(0.02)
        .on('tick', () => {
          allLinks.attr('d', (d: any) => {
            const sx = d.source.x
            const sy = d.source.y
            const tx = d.target.x
            const ty = d.target.y
            const dx = tx - sx
            const dy = ty - sy
            const dr = Math.sqrt(dx * dx + dy * dy) * 2
            return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`
          })

          allNodes.attr('transform', (d: any) => `translate(${d.x},${d.y})`)
        })
    }

    updateGraph()

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom)

    svg.on('click', () => {
      setHighlightedTask(null)
    })

    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }
  }, [
    tasks,
    visibleDependencies,
    width,
    height,
    highlightedTaskId,
    downstreamIds,
    upstreamIds,
    cycleIds,
    updateTask,
    removeDependency,
    setHighlightedTask,
  ])

  const handleContainerDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleContainerDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return (
    <div
      ref={containerRef}
      className="dependency-graph-container"
      onDragOver={handleContainerDragOver}
      onDrop={handleContainerDrop}
    >
      <svg ref={svgRef} className="dependency-graph-svg" />
      <div className="graph-legend">
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#3b82f6' }}
          ></span>
          <span>下游依赖</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#f97316' }}
          ></span>
          <span>上游依赖</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#ef4444' }}
          ></span>
          <span>循环依赖</span>
        </div>
        <div className="legend-item">
          <span
            className="legend-dot"
            style={{ background: '#0f9b8e' }}
          ></span>
          <span>正常</span>
        </div>
      </div>
    </div>
  )
}
