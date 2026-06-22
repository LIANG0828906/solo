<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'

interface Skill {
  name: string
  level: number
}

const props = withDefaults(
  defineProps<{
    skills: Skill[]
    gradientColors: [string, string]
  }>(),
  {
    skills: () => [],
    gradientColors: () => ['#6366f1', '#06b6d4'] as [string, string]
  }
)

const svgRef = ref<SVGSVGElement | null>(null)

const size = 280
const cx = size / 2
const cy = size / 2
const radius = 110
const levels = 5
const levelStep = 20
const labelOffset = 16

function angleSlice(i: number, total: number): number {
  return (Math.PI * 2 * i) / total - Math.PI / 2
}

function pointOnAxis(i: number, total: number, value: number): [number, number] {
  const angle = angleSlice(i, total)
  const r = radius * (value / 100)
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
}

function polygonPoints(total: number, value: number): string {
  return Array.from({ length: total }, (_, i) => {
    const [x, y] = pointOnAxis(i, total, value)
    return `${x},${y}`
  }).join(' ')
}

function ensureGroup(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, cls: string) {
  let g = svg.select<SVGGElement>(`g.${cls}`)
  if (g.empty()) {
    g = svg.append('g').attr('class', cls)
  }
  return g
}

function ensureDefs(svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) {
  let defs = svg.select<SVGDefsElement>('defs')
  if (defs.empty()) {
    defs = svg.append('defs')
  }
  return defs
}

function updateGradient(defs: d3.Selection<SVGDefsElement, unknown, null, undefined>) {
  let grad = defs.select<SVGLinearGradientElement>('#radar-grad')
  if (grad.empty()) {
    grad = defs
      .append('linearGradient')
      .attr('id', 'radar-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
  }

  const stops = grad.selectAll<SVGStopElement, { offset: string; color: string }>('stop').data([
    { offset: '0%', color: props.gradientColors[0] },
    { offset: '100%', color: props.gradientColors[1] }
  ])

  stops
    .enter()
    .append('stop')
    .merge(stops as d3.Selection<SVGStopElement, { offset: string; color: string }, SVGLinearGradientElement, unknown>)
    .attr('offset', (d) => d.offset)
    .attr('stop-color', (d) => d.color)

  stops.exit().remove()
}

function updateGrid(g: d3.Selection<SVGGElement, unknown, null, undefined>, total: number) {
  const gridValues = Array.from({ length: levels }, (_, i) => (i + 1) * levelStep)

  const polys = g.selectAll<SVGPolygonElement, number>('polygon.grid-ring').data(gridValues)

  polys
    .enter()
    .append('polygon')
    .attr('class', 'grid-ring')
    .merge(polys)
    .attr('points', (d) => polygonPoints(total, d))
    .attr('fill', 'none')
    .attr('stroke', '#e1e5eb')
    .attr('stroke-width', 1)

  polys.exit().remove()
}

function updateAxes(g: d3.Selection<SVGGElement, unknown, null, undefined>, total: number) {
  const axes = g.selectAll<SVGLineElement, Skill>('line.axis-line').data(props.skills, (d: Skill) => d.name)

  axes
    .enter()
    .append('line')
    .attr('class', 'axis-line')
    .merge(axes)
    .attr('x1', cx)
    .attr('y1', cy)
    .attr('x2', (_, i) => pointOnAxis(i, total, 100)[0])
    .attr('y2', (_, i) => pointOnAxis(i, total, 100)[1])
    .attr('stroke', '#e1e5eb')
    .attr('stroke-width', 1)

  axes.exit().remove()
}

function updateLabels(g: d3.Selection<SVGGElement, unknown, null, undefined>, total: number) {
  const labels = g.selectAll<SVGTextElement, Skill>('text.axis-label').data(props.skills, (d: Skill) => d.name)

  const entered = labels
    .enter()
    .append('text')
    .attr('class', 'axis-label')
    .attr('font-size', '12px')
    .attr('fill', 'var(--theme-text)')

  entered
    .merge(labels)
    .attr('x', (_, i) => {
      const angle = angleSlice(i, total)
      const offset = Math.cos(angle) * labelOffset
      return pointOnAxis(i, total, 100)[0] + offset
    })
    .attr('y', (_, i) => {
      const angle = angleSlice(i, total)
      const offset = Math.sin(angle) * labelOffset
      return pointOnAxis(i, total, 100)[1] + offset
    })
    .attr('text-anchor', (_, i) => {
      const cos = Math.cos(angleSlice(i, total))
      if (Math.abs(cos) < 0.15) return 'middle'
      return cos > 0 ? 'start' : 'end'
    })
    .attr('dominant-baseline', (_, i) => {
      const sin = Math.sin(angleSlice(i, total))
      if (sin < -0.5) return 'auto'
      if (sin > 0.5) return 'hanging'
      return 'central'
    })
    .text((d) => d.name)

  labels.exit().remove()
}

function updateArea(g: d3.Selection<SVGGElement, unknown, null, undefined>, total: number) {
  let poly = g.select<SVGPolygonElement>('polygon.skill-area')
  if (poly.empty()) {
    poly = g.append('polygon').attr('class', 'skill-area')
  }

  const pts = props.skills
    .map((s, i) => {
      const [x, y] = pointOnAxis(i, total, s.level)
      return `${x},${y}`
    })
    .join(' ')

  poly
    .attr('points', pts)
    .attr('fill', 'url(#radar-grad)')
    .attr('fill-opacity', 0.3)
    .attr('stroke', 'url(#radar-grad)')
    .attr('stroke-opacity', 0.8)
    .attr('stroke-width', 2)
}

function updateDots(g: d3.Selection<SVGGElement, unknown, null, undefined>, total: number) {
  const dots = g.selectAll<SVGCircleElement, Skill>('circle.data-dot').data(props.skills, (d: Skill) => d.name)

  dots
    .enter()
    .append('circle')
    .attr('class', 'data-dot')
    .attr('r', 4)
    .merge(dots)
    .attr('cx', (d, i) => pointOnAxis(i, total, d.level)[0])
    .attr('cy', (d, i) => pointOnAxis(i, total, d.level)[1])
    .attr('fill', props.gradientColors[0])

  dots.exit().remove()
}

function drawChart() {
  if (!svgRef.value || props.skills.length < 3) return

  const svg = d3.select(svgRef.value)
  const total = props.skills.length

  updateGradient(ensureDefs(svg))
  updateGrid(ensureGroup(svg, 'grid-group'), total)
  updateAxes(ensureGroup(svg, 'axis-group'), total)
  updateLabels(ensureGroup(svg, 'label-group'), total)
  updateArea(ensureGroup(svg, 'area-group'), total)
  updateDots(ensureGroup(svg, 'dots-group'), total)
}

onMounted(() => {
  drawChart()
})

watch([() => props.skills, () => props.gradientColors], () => {
  drawChart()
}, { deep: true })
</script>

<template>
  <div class="radar-chart-container">
    <svg ref="svgRef" :width="size" :height="size" style="overflow: visible"></svg>
  </div>
</template>

<style scoped>
.radar-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
