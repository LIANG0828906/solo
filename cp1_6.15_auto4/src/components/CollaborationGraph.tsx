import { useEffect, useRef, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Network, X, ZoomIn, ZoomOut, Star } from 'lucide-react'
import type { Skill } from '@/utils/recommendationEngine'

interface Node { id: string; name: string; x: number; y: number; vx: number; vy: number; radius: number; color: string; glow: string }
interface Edge { source: string; target: string; weight: number }

const DOMAINS: { name: string; color: string; glow: string; skills: string[] }[] = [
  { name: '前端', color: '#f472b6', glow: '#f9a8d4', skills: ['React', 'Vue', 'TypeScript', 'CSS', 'HTML', 'JavaScript', 'Angular', 'Svelte', 'Next'] },
  { name: '后端', color: '#818cf8', glow: '#a5b4fc', skills: ['Node.js', 'Java', 'Spring', 'Python', 'Django', 'Go', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'Express', 'Nest'] },
  { name: '数据/AI', color: '#fbbf24', glow: '#fcd34d', skills: ['DataAnalysis', 'MachineLearning', 'AI', 'DeepLearning'] },
  { name: 'DevOps/云', color: '#2dd4bf', glow: '#5eead4', skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'DevOps', 'Linux', 'Azure', 'GCP'] },
  { name: '设计/产品', color: '#c084fc', glow: '#d8b4fe', skills: ['UI Design', 'Figma', 'UX', 'ProductManagement', 'Agile', 'Prototyping'] },
  { name: '测试/QA', color: '#fb7185', glow: '#fda4af', skills: ['QA', 'Selenium', 'Jest', 'Testing', 'Cypress', 'Playwright'] },
]

function getDomainColor(skills: Skill[]) {
  const counts = DOMAINS.map(d => ({ d, c: skills.filter(s => d.skills.some(ds => s.name.toLowerCase().includes(ds.toLowerCase()))).length }))
  counts.sort((a, b) => b.c - a.c)
  return counts[0].c > 0 ? { color: counts[0].d.color, glow: counts[0].d.glow } : { color: '#4aedc4', glow: '#6ff7d3' }
}

export default function CollaborationGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const animRef = useRef(0)
  const zoomRef = useRef({ scale: 1, tx: 0, ty: 0 })
  const dragRef = useRef<{ type: 'node' | 'pan' | null; nodeId: string | null; sx: number; sy: number; ox: number; oy: number }>({ type: null, nodeId: null, sx: 0, sy: 0, ox: 0, oy: 0 })
  const hoverRef = useRef<{ nodeId: string | null; sx: number; sy: number }>({ nodeId: null, sx: 0, sy: 0 })
  const [, tick] = useState(0)

  const { members, collaborations, highlightMemberId, setHighlightMemberId, selectedMember, setSelectedMember } = useAppStore()

  useEffect(() => {
    if (!members.length || !canvasRef.current || !containerRef.current) return
    const canvas = canvasRef.current, container = containerRef.current, ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    let rect = container.getBoundingClientRect(), width = rect.width, height = rect.height
    const setup = () => { rect = container.getBoundingClientRect(); width = rect.width; height = rect.height; canvas.width = width * dpr; canvas.height = height * dpr; canvas.style.width = width + 'px'; canvas.style.height = height + 'px'; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr) }
    setup()

    nodesRef.current = members.map((m, i) => {
      const a = (i / members.length) * Math.PI * 2, r = Math.min(width, height) * 0.3
      const { color, glow } = getDomainColor(m.skills)
      return { id: m.id, name: m.name, x: width / 2 + Math.cos(a) * r, y: height / 2 + Math.sin(a) * r, vx: 0, vy: 0, radius: 22 + Math.min(m.skills.length * 1.5, 12), color, glow }
    })
    edgesRef.current = collaborations.map(c => ({ source: c.memberIdA, target: c.memberIdB, weight: c.projectCount }))
    const getNode = (id: string) => nodesRef.current.find(n => n.id === id)
    const s2w = (sx: number, sy: number) => { const z = zoomRef.current; return { x: (sx - z.tx) / z.scale, y: (sy - z.ty) / z.scale } }
    const hit = (wx: number, wy: number) => { for (let i = nodesRef.current.length - 1; i >= 0; i--) { const n = nodesRef.current[i], dx = wx - n.x, dy = wy - n.y; if (dx * dx + dy * dy <= n.radius * n.radius) return n } return null }

    const simulate = () => {
      const nodes = nodesRef.current, edges = edgesRef.current
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1
        const f = 2000 / (d * d), fx = (dx / d) * f, fy = (dy / d) * f
        a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy
      }
      for (const e of edges) {
        const a = getNode(e.source), b = getNode(e.target); if (!a || !b) continue
        const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1
        const td = 120 - Math.min(e.weight * 10, 60), f = (d - td) * 0.02, fx = (dx / d) * f, fy = (dy / d) * f
        a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy
      }
      for (const n of nodes) { n.vx += (width / 2 - n.x) * 0.003; n.vy += (height / 2 - n.y) * 0.003 }
      const dragId = dragRef.current.type === 'node' ? dragRef.current.nodeId : null
      for (const n of nodes) {
        if (n.id === dragId) { n.vx = 0; n.vy = 0; continue }
        n.vx *= 0.85; n.vy *= 0.85; n.x += n.vx; n.y += n.vy
        n.x = Math.max(n.radius + 10, Math.min(width - n.radius - 10, n.x))
        n.y = Math.max(n.radius + 10, Math.min(height - n.radius - 10, n.y))
      }
    }

    const draw = () => {
      ctx.clearRect(0, 0, width, height)
      const z = zoomRef.current; ctx.save(); ctx.translate(z.tx, z.ty); ctx.scale(z.scale, z.scale)
      const nodes = nodesRef.current, edges = edgesRef.current, maxW = Math.max(...edges.map(e => e.weight), 1)
      const dragId = dragRef.current.type === 'node' ? dragRef.current.nodeId : null
      const hid = highlightMemberId || selectedMember?.id || hoverRef.current.nodeId
      for (const e of edges) {
        const a = getNode(e.source), b = getNode(e.target); if (!a || !b) continue
        const hi = hid && (e.source === hid || e.target === hid)
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y)
        ctx.strokeStyle = hi ? 'rgba(74,237,196,0.7)' : `rgba(156,168,195,${0.1 + (e.weight / maxW) * 0.25})`
        ctx.lineWidth = hi ? 2.5 : 1 + (e.weight / maxW) * 2; ctx.stroke()
        if (hi) { ctx.fillStyle = 'rgba(74,237,196,0.9)'; ctx.font = 'bold 11px DM Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e.weight + '次', (a.x + b.x) / 2, (a.y + b.y) / 2 - 8) }
      }
      for (const n of nodes) {
        const sel = selectedMember?.id === n.id, hi = highlightMemberId === n.id || sel, dr = dragId === n.id, hv = hoverRef.current.nodeId === n.id && !dr
        const R = dr ? n.radius * 1.15 : n.radius
        if (dr || hi) {
          ctx.beginPath(); ctx.arc(n.x, n.y, R + 12, 0, Math.PI * 2)
          const g = ctx.createRadialGradient(n.x, n.y, R, n.x, n.y, R + 22), gc = dr ? '#5eead4' : n.glow
          g.addColorStop(0, gc + '55'); g.addColorStop(1, gc + '00'); ctx.fillStyle = g; ctx.fill()
        }
        if (hv && !hi) { ctx.beginPath(); ctx.arc(n.x, n.y, R + 6, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1.5; ctx.stroke() }
        ctx.beginPath(); ctx.arc(n.x, n.y, R, 0, Math.PI * 2)
        const g = ctx.createLinearGradient(n.x - R, n.y - R, n.x + R, n.y + R)
        g.addColorStop(0, hi || dr ? n.glow : n.color); g.addColorStop(1, hi || dr ? n.color : n.glow)
        ctx.fillStyle = g; ctx.fill()
        ctx.strokeStyle = hi || dr ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.18)'
        ctx.lineWidth = hi || dr ? 2.5 : 1; ctx.stroke()
        ctx.fillStyle = '#0a1628'; ctx.font = `bold ${R * 0.8}px Outfit`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(n.name.charAt(0).toUpperCase(), n.x, n.y)
        ctx.fillStyle = hi ? '#4aedc4' : '#e8ecf4'; ctx.font = hi ? '600 12px DM Sans' : '500 12px DM Sans'; ctx.textAlign = 'center'
        ctx.fillText(n.name, n.x, n.y + R + 14)
      }
      ctx.restore()
    }
    const loop = () => { simulate(); draw(); animRef.current = requestAnimationFrame(loop) }; loop()

    const onResize = () => setup()
    const onWheel = (e: WheelEvent) => {
      e.preventDefault(); const z = zoomRef.current, ns = Math.max(0.4, Math.min(2.5, z.scale * (e.deltaY > 0 ? 0.9 : 1.1)))
      const r = canvas.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, k = ns / z.scale
      z.tx = mx - (mx - z.tx) * k; z.ty = my - (my - z.ty) * k; z.scale = ns
    }
    const onDown = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top
      const { x: wx, y: wy } = s2w(sx, sy), h = hit(wx, wy)
      dragRef.current = h ? { type: 'node', nodeId: h.id, sx, sy, ox: 0, oy: 0 } : { type: 'pan', nodeId: null, sx, sy, ox: zoomRef.current.tx, oy: zoomRef.current.ty }
      canvas.style.cursor = 'grabbing'
    }
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top
      if (dragRef.current.type === 'node' && dragRef.current.nodeId) {
        const { x: wx, y: wy } = s2w(sx, sy), n = getNode(dragRef.current.nodeId); if (n) { n.x = wx; n.y = wy }
      } else if (dragRef.current.type === 'pan') {
        zoomRef.current.tx = dragRef.current.ox + (sx - dragRef.current.sx); zoomRef.current.ty = dragRef.current.oy + (sy - dragRef.current.sy)
      } else {
        const { x: wx, y: wy } = s2w(sx, sy), h = hit(wx, wy), nh = h ? h.id : null, oh = hoverRef.current.nodeId
        hoverRef.current = { nodeId: nh, sx, sy }
        if (nh !== oh) { if (!highlightMemberId && !selectedMember) setHighlightMemberId(nh); tick(v => v + 1) }
        canvas.style.cursor = h ? 'grab' : 'default'
      }
    }
    const onUp = (e: MouseEvent) => {
      const dt = dragRef.current.type, dn = dragRef.current.nodeId
      dragRef.current = { type: null, nodeId: null, sx: 0, sy: 0, ox: 0, oy: 0 }
      if (dt === 'node' && dn) {
        const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top
        const { x: wx, y: wy } = s2w(sx, sy), n = getNode(dn)
        if (n) { const dx = wx - n.x, dy = wy - n.y; if (dx * dx + dy * dy < 4) { const mm = members.find(m => m.id === dn); if (mm) setSelectedMember(mm) } }
      }
      const r = canvas.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top
      const { x: wx, y: wy } = s2w(sx, sy); canvas.style.cursor = hit(wx, wy) ? 'grab' : 'default'
    }
    const onLeave = () => {
      hoverRef.current = { nodeId: null, sx: 0, sy: 0 }
      if (!highlightMemberId && !selectedMember) setHighlightMemberId(null)
      dragRef.current = { type: null, nodeId: null, sx: 0, sy: 0, ox: 0, oy: 0 }; canvas.style.cursor = 'default'
    }
    window.addEventListener('resize', onResize)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('mousedown', onDown); canvas.addEventListener('mousemove', onMove); canvas.addEventListener('mouseup', onUp); canvas.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize)
      canvas.removeEventListener('wheel', onWheel); canvas.removeEventListener('mousedown', onDown); canvas.removeEventListener('mousemove', onMove); canvas.removeEventListener('mouseup', onUp); canvas.removeEventListener('mouseleave', onLeave)
    }
  }, [members, collaborations])

  const hoveredM = hoverRef.current.nodeId ? members.find(m => m.id === hoverRef.current.nodeId) : null
  const selNode = selectedMember ? nodesRef.current.find(n => n.id === selectedMember.id) : null
  const crect = containerRef.current?.getBoundingClientRect()
  const popupPos = (() => {
    if (!selNode || !crect) return null
    const z = zoomRef.current, sx = selNode.x * z.scale + z.tx, sy = selNode.y * z.scale + z.ty
    const gap = selNode.radius * z.scale + 16; let left = sx + gap, top = sy - 80
    if (left + 280 > crect.width) left = sx - 280 - gap
    if (top < 8) top = 8; if (top + 320 > crect.height) top = crect.height - 328
    return { left, top }
  })()
  const stats = selectedMember ? (() => {
    const list = collaborations.filter(c => c.memberIdA === selectedMember.id || c.memberIdB === selectedMember.id)
    const tot = list.reduce((s, c) => s + c.projectCount, 0)
    return { count: list.length, freq: tot >= 15 ? '高频' : tot >= 5 ? '普通' : '低频' }
  })() : null

  const zoomBtn = (in_ : boolean) => {
    const z = zoomRef.current; if (!crect) return
    const mx = crect.width / 2, my = crect.height / 2, ns = Math.max(0.4, Math.min(2.5, z.scale * (in_ ? 1.2 : 0.8))), k = ns / z.scale
    z.tx = mx - (mx - z.tx) * k; z.ty = my - (my - z.ty) * k; z.scale = ns; tick(v => v + 1)
  }

  return (
    <div className="glass-card h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,.2),rgba(167,139,250,.1))' }}><Network size={22} style={{ color: '#a78bfa' }} /></div>
        <div><h2 className="text-xl font-bold">协作关系图</h2><p className="text-sm text-[color:var(--text-muted)]">{members.length} 位成员 · {collaborations.length} 条协作记录</p></div>
      </div>
      <div ref={containerRef} className="flex-1 relative rounded-xl overflow-hidden" style={{ background: 'rgba(10,22,40,.35)', minHeight: '320px' }}>
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          <button onClick={e => { e.stopPropagation(); zoomBtn(true) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white" style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.08)' }}><ZoomIn size={16} /></button>
          <button onClick={e => { e.stopPropagation(); zoomBtn(false) }} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/70 hover:text-white" style={{ background: 'rgba(255,255,255,.06)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,.08)' }}><ZoomOut size={16} /></button>
          <div className="text-[10px] text-white/40 text-center mt-1 font-mono">{(zoomRef.current.scale * 100).toFixed(0)}%</div>
        </div>
        {hoveredM && !selectedMember && hoverRef.current.sx > 0 && (
          <div className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg text-xs whitespace-nowrap" style={{ left: hoverRef.current.sx + 14, top: hoverRef.current.sy + 14, background: 'rgba(10,22,40,.92)', border: '1px solid rgba(74,237,196,.25)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,.35)' }}>
            <div className="font-semibold text-white/95">{hoveredM.name}</div><div className="text-white/55 mt-0.5">技能: {hoveredM.skills.length} 项</div>
          </div>
        )}
        {selectedMember && popupPos && stats && (
          <div className="absolute z-30 rounded-2xl p-4 w-[280px]" style={{ left: popupPos.left, top: popupPos.top, background: 'rgba(18,32,56,.78)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 12px 40px rgba(0,0,0,.45)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedMember(null)} className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10"><X size={15} /></button>
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-[#0a1628]" style={{ background: selNode ? `linear-gradient(135deg,${selNode.glow},${selNode.color})` : 'linear-gradient(135deg,#4aedc4,#2dd4a8)' }}>{selectedMember.name.charAt(0).toUpperCase()}</div>
              <div><div className="font-bold text-white text-[15px]">{selectedMember.name}</div><div className="text-xs text-white/50 mt-0.5">{selectedMember.skills.length} 项技能</div></div>
            </div>
            <div className="mb-3.5">
              <div className="text-[11px] uppercase tracking-wider text-white/40 font-semibold mb-1.5">技能</div>
              <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {selectedMember.skills.slice(0, 8).map(s => (
                  <div key={s.name} className="flex items-center justify-between text-xs"><span className="text-white/80 truncate">{s.name}</span><div className="flex gap-0.5 ml-2 shrink-0">{[1,2,3,4,5].map(n => <Star key={n} size={10} style={{ fill: n <= s.proficiency ? '#fbbf24' : 'none', color: n <= s.proficiency ? '#fbbf24' : 'rgba(255,255,255,.15)' }} />)}</div></div>
                ))}
                {selectedMember.skills.length > 8 && <div className="text-[10px] text-white/35">+{selectedMember.skills.length - 8} 更多...</div>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,.07)' }}>
              <div className="rounded-lg p-2" style={{ background: 'rgba(74,237,196,.08)' }}><div className="text-[10px] text-white/45">协作项目</div><div className="text-[15px] font-bold text-[#4aedc4] mt-0.5">{stats.count} <span className="text-[10px] font-normal text-white/45">个</span></div></div>
              <div className="rounded-lg p-2" style={{ background: 'rgba(167,139,250,.08)' }}><div className="text-[10px] text-white/45">协作频次</div><div className="text-[15px] font-bold text-[#a78bfa] mt-0.5">{stats.freq}</div></div>
            </div>
          </div>
        )}
        {!members.length && <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><Network size={48} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} /><p className="text-sm text-[color:var(--text-muted)]">暂无成员数据</p></div></div>}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[color:var(--text-secondary)]">
        {DOMAINS.map(d => <div key={d.name} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg,${d.color},${d.glow})` }} /><span>{d.name}</span></div>)}
        <div className="flex items-center gap-2"><span className="w-6 h-[2px] rounded bg-[color:var(--text-secondary)] opacity-40" /><span>协作连线</span></div>
      </div>
    </div>
  )
}
