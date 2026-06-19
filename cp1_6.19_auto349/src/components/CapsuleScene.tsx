import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { useDiaryStore, type Mood, type WeeklyCapsule, type DiaryEntry } from '../store/useDiaryStore'
import { audioPlayer } from '../utils/audioPlayer'

const MOOD_COLORS: Record<Mood, string> = {
  happy: '#ffd93d',
  calm: '#6bcb77',
  sad: '#4d96ff',
  nostalgic: '#ff6b6b',
  energetic: '#c471ed',
}

const MOOD_LABELS: Record<Mood, { label: string; emoji: string }> = {
  happy:     { label: '高兴', emoji: '😄' },
  calm:      { label: '平静', emoji: '🧘' },
  sad:       { label: '忧郁', emoji: '😢' },
  nostalgic: { label: '怀念', emoji: '💭' },
  energetic: { label: '活力', emoji: '⚡' },
}

interface Props {
  open: boolean
  onClose: () => void
}

interface Fragment {
  mesh: THREE.Mesh
  entry: DiaryEntry
  basePos: THREE.Vector3
  baseScale: number
}

function formatDateShort(s: string) {
  const d = new Date(s)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export default function CapsuleScene({ open, onClose }: Props) {
  const generate = useDiaryStore((s) => s.generateWeeklyCapsule)
  const [capsule, setCapsule] = useState<WeeklyCapsule | null>(null)
  const threeContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    fragments: Fragment[]
    raycaster: THREE.Raycaster
    mouse: THREE.Vector2
    hovered: THREE.Mesh | null
    isDragging: boolean
    lastX: number
    lastY: number
    rotationY: number
    rotationX: number
    raf: number
  } | null>(null)
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; entry: DiaryEntry } | null>(null)
  const [chartHover, setChartHover] = useState<{ x: number; y: number; label: string; mood: Mood } | null>(null)

  useEffect(() => {
    if (open) {
      const c = generate()
      setCapsule(c)
    }
  }, [open, generate])

  useEffect(() => {
    if (!open || !capsule || !threeContainerRef.current) return

    const container = threeContainerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0f0f0f')
    scene.fog = new THREE.Fog('#0f0f0f', 3, 9)

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100)
    camera.position.set(0, 0, 5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    container.appendChild(renderer.domElement)
    renderer.domElement.style.touchAction = 'none'

    const ambient = new THREE.AmbientLight(0xffffff, 0.55)
    scene.add(ambient)

    const pointLight = new THREE.PointLight(0x667eea, 1.2, 15)
    pointLight.position.set(3, 3, 4)
    scene.add(pointLight)

    const pointLight2 = new THREE.PointLight(0x764ba2, 0.9, 15)
    pointLight2.position.set(-3, -2, 3)
    scene.add(pointLight2)

    const sphereGroup = new THREE.Group()
    scene.add(sphereGroup)

    const coreGeo = new THREE.SphereGeometry(1.3, 48, 48)
    const coreMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a2e,
      transparent: true,
      opacity: 0.35,
      shininess: 120,
      emissive: 0x2a1f4e,
      emissiveIntensity: 0.4,
    })
    const core = new THREE.Mesh(coreGeo, coreMat)
    sphereGroup.add(core)

    const wireGeo = new THREE.SphereGeometry(1.32, 32, 32)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x667eea,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    })
    const wire = new THREE.Mesh(wireGeo, wireMat)
    sphereGroup.add(wire)

    const fragments: Fragment[] = []
    const entries = capsule.entries.slice(0, 50)
    const seedRand = (i: number) => {
      const x = Math.sin(i * 999.123) * 10000
      return x - Math.floor(x)
    }

    entries.forEach((entry, i) => {
      const phi = Math.acos(2 * seedRand(i * 2 + 1) - 1)
      const theta = 2 * Math.PI * seedRand(i * 3 + 7)
      const r = 1.52 + 0.12 * seedRand(i * 5 + 3)
      const basePos = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      )

      const geoType = i % 3
      let geo: THREE.BufferGeometry
      if (geoType === 0) geo = new THREE.BoxGeometry(0.16, 0.16, 0.16)
      else if (geoType === 1) geo = new THREE.SphereGeometry(0.1, 14, 14)
      else geo = new THREE.OctahedronGeometry(0.13)

      const color = new THREE.Color(MOOD_COLORS[entry.mood])
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.35,
        roughness: 0.3,
        emissive: color,
        emissiveIntensity: 0.45,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.copy(basePos)
      mesh.lookAt(new THREE.Vector3(0, 0, 0))
      const baseScale = 0.9 + seedRand(i * 11) * 0.4
      mesh.scale.setScalar(baseScale)
      ;(mesh as unknown as { userData: { index: number } }).userData = { index: i }
      sphereGroup.add(mesh)
      fragments.push({ mesh, entry, basePos: basePos.clone(), baseScale })
    })

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()

    const state = {
      scene,
      camera,
      renderer,
      fragments,
      raycaster,
      mouse,
      hovered: null as THREE.Mesh | null,
      isDragging: false,
      lastX: 0,
      lastY: 0,
      rotationY: 0,
      rotationX: 0,
      raf: 0,
    }
    sceneRef.current = state

    const dom = renderer.domElement
    const onPointerDown = (e: PointerEvent) => {
      state.isDragging = true
      state.lastX = e.clientX
      state.lastY = e.clientY
      dom.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      if (state.isDragging) {
        const dx = e.clientX - state.lastX
        const dy = e.clientY - state.lastY
        state.rotationY += dx * 0.008
        state.rotationX += dy * 0.008
        state.rotationX = Math.max(-0.8, Math.min(0.8, state.rotationX))
        state.lastX = e.clientX
        state.lastY = e.clientY
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      state.isDragging = false
      try {
        dom.releasePointerCapture(e.pointerId)
      } catch { /* noop */ }
    }
    const onClick = (e: PointerEvent) => {
      if (Math.abs(e.clientX - state.lastX) > 4) return
      raycaster.setFromCamera(mouse, camera)
      const meshes = fragments.map((f) => f.mesh)
      const hits = raycaster.intersectObjects(meshes)
      if (hits.length > 0) {
        const frag = fragments.find((f) => f.mesh === hits[0].object)
        if (frag) {
          audioPlayer.play(frag.entry.song, 6000)
        }
      }
    }
    dom.addEventListener('pointerdown', onPointerDown)
    dom.addEventListener('pointermove', onPointerMove)
    dom.addEventListener('pointerup', onPointerUp)
    dom.addEventListener('click', onClick)

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', handleResize)

    const clock = new THREE.Clock()
    const animate = () => {
      const delta = clock.getDelta()
      if (!state.isDragging) {
        state.rotationY += delta * 0.25
      }
      sphereGroup.rotation.y = state.rotationY
      sphereGroup.rotation.x = state.rotationX

      fragments.forEach((f, i) => {
        const t = clock.getElapsedTime() * 1.6 + i * 0.4
        f.mesh.position.copy(f.basePos)
        f.mesh.position.multiplyScalar(1 + Math.sin(t) * 0.04)
        f.mesh.rotation.x += delta * 0.3
        f.mesh.rotation.y += delta * 0.2
      })

      raycaster.setFromCamera(mouse, camera)
      const meshes = fragments.map((f) => f.mesh)
      const hits = raycaster.intersectObjects(meshes)
      const newHovered = hits.length > 0 ? (hits[0].object as THREE.Mesh) : null
      if (state.hovered && state.hovered !== newHovered) {
        const idx = fragments.findIndex((f) => f.mesh === state.hovered)
        if (idx >= 0) {
          const f = fragments[idx]
          ;(f.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.45
          f.mesh.scale.setScalar(f.baseScale)
        }
        if (state.hovered === newHovered) {
          // noop
        }
      }
      if (newHovered && newHovered !== state.hovered) {
        const idx = fragments.findIndex((f) => f.mesh === newHovered)
        if (idx >= 0) {
          const f = fragments[idx]
          ;(f.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1
          f.mesh.scale.setScalar(f.baseScale * 1.3)
          dom.style.cursor = 'pointer'
        }
      } else if (!newHovered && state.hovered) {
        dom.style.cursor = 'grab'
      } else if (!newHovered) {
        dom.style.cursor = state.isDragging ? 'grabbing' : 'grab'
      }
      state.hovered = newHovered

      if (newHovered) {
        const idx = fragments.findIndex((f) => f.mesh === newHovered)
        if (idx >= 0) {
          const rect = dom.getBoundingClientRect()
          setHoverInfo({
            x: ((state.mouse.x + 1) / 2) * rect.width,
            y: ((-state.mouse.y + 1) / 2) * rect.height,
            entry: fragments[idx].entry,
          })
        }
      } else {
        setHoverInfo(null)
      }

      renderer.render(scene, camera)
      state.raf = requestAnimationFrame(animate)
    }
    state.raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(state.raf)
      window.removeEventListener('resize', handleResize)
      dom.removeEventListener('pointerdown', onPointerDown)
      dom.removeEventListener('pointermove', onPointerMove)
      dom.removeEventListener('pointerup', onPointerUp)
      dom.removeEventListener('click', onClick)
      renderer.dispose()
      coreGeo.dispose(); coreMat.dispose()
      wireGeo.dispose(); wireMat.dispose()
      fragments.forEach((f) => {
        f.mesh.geometry.dispose()
        ;(f.mesh.material as THREE.Material).dispose()
      })
      if (dom.parentNode) dom.parentNode.removeChild(dom)
    }
  }, [open, capsule])

  useEffect(() => {
    if (!open || !capsule || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio, 2)

    const draw = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      const W = rect.width
      const H = rect.height
      ctx.clearRect(0, 0, W, H)

      const moodsOrder: Mood[] = ['happy', 'calm', 'sad', 'nostalgic', 'energetic']
      const padding = { l: 32, r: 20, t: 24, b: 36 }
      const plotW = W - padding.l - padding.r
      const plotH = H - padding.t - padding.b

      ctx.strokeStyle = 'rgba(255,255,255,0.06)'
      ctx.lineWidth = 1
      for (let i = 0; i <= 4; i++) {
        const y = padding.t + (plotH * i) / 4
        ctx.beginPath()
        ctx.moveTo(padding.l, y)
        ctx.lineTo(W - padding.r, y)
        ctx.stroke()
      }

      const weekDays = 7
      const maxCount = Math.max(1, ...moodsOrder.map((m) => capsule.moodCounts[m] || 0))

      const pointsByMood: Record<Mood, Array<{ x: number; y: number; count: number }>> = {
        happy: [], calm: [], sad: [], nostalgic: [], energetic: [],
      }

      const sortedEntries = [...capsule.entries].sort((a, b) => a.date.localeCompare(b.date))
      const moodColorMap: Record<Mood, string> = { ...MOOD_COLORS }

      moodsOrder.forEach((mood) => {
        const color = moodColorMap[mood]
        const counts: number[] = []
        const total = capsule.moodCounts[mood] || 0
        const evenStep = weekDays / Math.max(1, total)
        for (let i = 0; i < total; i++) {
          counts.push(Math.floor(i * evenStep + evenStep / 2))
        }
        for (let d = 0; d < weekDays; d++) {
          const c = counts.filter((v) => v === d).length + (d === 3 && mood === 'calm' ? 0 : 0)
          const x = padding.l + (plotW * d) / Math.max(1, weekDays - 1)
          const y = padding.t + plotH - (plotH * c) / maxCount
          pointsByMood[mood].push({ x, y, count: c })
        }

        const pts = pointsByMood[mood]
        ctx.strokeStyle = color
        ctx.lineWidth = 2.5
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        pts.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y)
          else {
            const prev = pts[i - 1]
            const cx = (prev.x + p.x) / 2
            ctx.bezierCurveTo(cx, prev.y, cx, p.y, p.x, p.y)
          }
        })
        ctx.stroke()

        ctx.shadowBlur = 12
        ctx.shadowColor = color
        pts.forEach((p) => {
          ctx.fillStyle = color
          ctx.beginPath()
          ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2)
          ctx.fill()
        })
        ctx.shadowBlur = 0
      })

      const dayLabels = ['一', '二', '三', '四', '五', '六', '日']
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.font = '11px -apple-system, sans-serif'
      ctx.textAlign = 'center'
      for (let d = 0; d < weekDays; d++) {
        const x = padding.l + (plotW * d) / Math.max(1, weekDays - 1)
        ctx.fillText(dayLabels[d], x, H - 14)
      }
    }

    draw()
    const ob = new ResizeObserver(draw)
    ob.observe(canvas)

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const padding = { l: 32, r: 20, t: 24, b: 36 }
      const plotW = rect.width - padding.l - padding.r
      const weekDays = 7
      let found: { x: number; y: number; label: string; mood: Mood } | null = null
      const moodsOrder: Mood[] = ['happy', 'calm', 'sad', 'nostalgic', 'energetic']
      for (const mood of moodsOrder) {
        const counts: number[] = []
        const total = capsule.moodCounts[mood] || 0
        const evenStep = weekDays / Math.max(1, total)
        for (let i = 0; i < total; i++) counts.push(Math.floor(i * evenStep + evenStep / 2))
        for (let d = 0; d < weekDays; d++) {
          const c = counts.filter((v) => v === d).length
          const x = padding.l + (plotW * d) / Math.max(1, weekDays - 1)
          const maxCount = Math.max(1, ...moodsOrder.map((m) => capsule.moodCounts[m] || 0))
          const plotH = rect.height - padding.t - padding.b
          const y = padding.t + plotH - (plotH * c) / maxCount
          if (Math.hypot(x - mx, y - my) < 12) {
            found = { x, y, label: `周${['一','二','三','四','五','六','日'][d]} · ${MOOD_LABELS[mood].label} ${c}次`, mood }
            break
          }
        }
        if (found) break
      }
      // 简化：显示每天主要心情
      if (!found && mx >= padding.l && mx <= rect.width - padding.r) {
        const dIdx = Math.round(((mx - padding.l) / plotW) * (weekDays - 1))
        const startDate = new Date(capsule.startDate)
        const curDate = new Date(startDate)
        curDate.setDate(startDate.getDate() + dIdx)
        const curDateStr = curDate.toISOString().slice(0, 10)
        const dayEntry = sortedEntries.find((e) => e.date === curDateStr)
        const x = padding.l + (plotW * dIdx) / Math.max(1, weekDays - 1)
        const maxCount = Math.max(1, ...moodsOrder.map((m) => capsule.moodCounts[m] || 0))
        const plotH = rect.height - padding.t - padding.b
        if (dayEntry) {
          const c = 1
          const y = padding.t + plotH - (plotH * c) / maxCount
          found = {
            x, y,
            label: `${formatDateShort(curDateStr)} ${MOOD_LABELS[dayEntry.mood].emoji} ${MOOD_LABELS[dayEntry.mood].label}`,
            mood: dayEntry.mood,
          }
        }
      }
      setChartHover(found)
    }
    const onMouseLeave = () => setChartHover(null)
    canvas.addEventListener('mousemove', onMouseMove)
    canvas.addEventListener('mouseleave', onMouseLeave)

    return () => {
      ob.disconnect()
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [open, capsule])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 150,
            background: '#0f0f0f',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* 顶部栏 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
                本周音乐胶囊 ✨
              </div>
              <div style={{ fontSize: 13, color: '#888' }}>
                {capsule ? `${capsule.startDate} ~ ${capsule.endDate} · 共 ${capsule.entries.length} 条记录` : ''}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 20,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="关闭"
            >
              ×
            </button>
          </div>

          {/* 主体 */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              padding: '0 24px 24px',
              maxWidth: 1100,
              width: '100%',
              margin: '0 auto',
              overflow: 'hidden',
            }}
          >
            {/* 3D 场景 */}
            <div
              ref={threeContainerRef}
              style={{
                flex: '1 1 50%',
                minHeight: 320,
                borderRadius: 20,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid rgba(102,126,234,0.15)',
              }}
            >
              {hoverInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    position: 'absolute',
                    left: Math.min(Math.max(hoverInfo.x, 80), 1000),
                    top: Math.max(hoverInfo.y - 60, 10),
                    transform: 'translate(-50%, 0)',
                    pointerEvents: 'none',
                    background: 'rgba(26,26,46,0.95)',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1px solid ${MOOD_COLORS[hoverInfo.entry.mood]}66`,
                    fontSize: 12,
                    color: '#fff',
                    zIndex: 2,
                    backdropFilter: 'blur(8px)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {MOOD_LABELS[hoverInfo.entry.mood].emoji} {hoverInfo.entry.song.title}
                  </div>
                  <div style={{ color: '#aaa', fontSize: 11 }}>
                    {formatDateShort(hoverInfo.entry.date)} · {hoverInfo.entry.song.artist}
                  </div>
                </motion.div>
              )}
              {!capsule?.entries.length && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: 14,
                  }}
                >
                  本周还没有记录～
                </div>
              )}
            </div>

            {/* 折线图 */}
            <div
              style={{
                flex: '0 0 auto',
                minHeight: 240,
                background: 'rgba(26,26,46,0.8)',
                borderRadius: 16,
                padding: '16px 16px 12px',
                position: 'relative',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                  paddingLeft: 12,
                  paddingRight: 8,
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>
                  一周心情曲线
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {(Object.keys(MOOD_COLORS) as Mood[]).map((m) => (
                    <div
                      key={m}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 11,
                        color: '#aaa',
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: MOOD_COLORS[m],
                          boxShadow: `0 0 6px ${MOOD_COLORS[m]}`,
                        }}
                      />
                      {MOOD_LABELS[m].label}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ position: 'relative', width: '100%', height: 180 }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '100%', display: 'block' }}
                />
                {chartHover && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      left: chartHover.x,
                      top: chartHover.y - 36,
                      transform: 'translate(-50%, -100%)',
                      pointerEvents: 'none',
                      background: `${MOOD_COLORS[chartHover.mood]}ee`,
                      padding: '6px 10px',
                      borderRadius: 8,
                      color: '#111',
                      fontSize: 11,
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {chartHover.label}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
