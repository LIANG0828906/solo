import { useRef, useEffect, useCallback } from 'react'
import { useMoleculeContext } from '../utils/context'

export default function MiniMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentMolecule, cameraAzimuthRef } = useMoleculeContext()

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = 120
    const h = 120
    canvas.width = w
    canvas.height = h

    ctx.clearRect(0, 0, w, h)

    ctx.fillStyle = '#0F172A'
    ctx.beginPath()
    ctx.roundRect(0, 0, w, h, 12)
    ctx.fill()

    const atoms = currentMolecule.atoms
    if (atoms.length === 0) return

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity
    atoms.forEach(a => {
      minX = Math.min(minX, a.position[0])
      maxX = Math.max(maxX, a.position[0])
      minZ = Math.min(minZ, a.position[2])
      maxZ = Math.max(maxZ, a.position[2])
    })
    const rangeX = maxX - minX || 1
    const rangeZ = maxZ - minZ || 1
    const scale = Math.min((w - 30) / rangeX, (h - 30) / rangeZ)
    const cx = w / 2
    const cy = h / 2
    const offsetX = (minX + maxX) / 2
    const offsetZ = (minZ + maxZ) / 2

    const bonds = currentMolecule.bonds
    const atomsMap: Record<string, typeof atoms[0]> = {}
    atoms.forEach(a => { atomsMap[a.id] = a })

    ctx.lineWidth = 1
    ctx.strokeStyle = 'rgba(136, 153, 170, 0.5)'
    bonds.forEach(b => {
      const a1 = atomsMap[b.atom1Id]
      const a2 = atomsMap[b.atom2Id]
      if (!a1 || !a2) return
      ctx.beginPath()
      ctx.moveTo(cx + (a1.position[0] - offsetX) * scale, cy + (a1.position[2] - offsetZ) * scale)
      ctx.lineTo(cx + (a2.position[0] - offsetX) * scale, cy + (a2.position[2] - offsetZ) * scale)
      ctx.stroke()
    })

    atoms.forEach(a => {
      const x = cx + (a.position[0] - offsetX) * scale
      const y = cy + (a.position[2] - offsetZ) * scale
      const r = Math.max(2, a.radius * scale * 0.4)
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fillStyle = a.color
      ctx.fill()
    })

    const azimuth = cameraAzimuthRef.current
    const ringRadius = 15
    const ringCx = w / 2
    const ringCy = h / 2

    ctx.beginPath()
    ctx.arc(ringCx, ringCy, ringRadius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'
    ctx.lineWidth = 2
    ctx.stroke()

    const arrowX = ringCx + Math.sin(azimuth) * ringRadius
    const arrowY = ringCy - Math.cos(azimuth) * ringRadius
    ctx.beginPath()
    ctx.arc(arrowX, arrowY, 4, 0, Math.PI * 2)
    ctx.fillStyle = '#3B82F6'
    ctx.fill()
  }, [currentMolecule, cameraAzimuthRef])

  useEffect(() => {
    let animId: number
    const animate = () => {
      draw()
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [draw])

  return (
    <div style={{
      position: 'absolute',
      right: 16,
      bottom: 16,
      zIndex: 10,
    }}>
      <canvas
        ref={canvasRef}
        width={120}
        height={120}
        style={{
          width: 120,
          height: 120,
          borderRadius: 12,
          boxShadow: '0 2px 15px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  )
}
