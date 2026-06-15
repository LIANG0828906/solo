import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { easeOutQuad } from '../utils/animations'

export type MaterialType = 'khana' | 'toono' | 'uni' | 'felt' | 'rope'
export type MaterialState = 'idle' | 'dragging' | 'snapping' | 'placed'
export type StepType = 'select_site' | 'lay_floor' | 'erect_khana' | 'install_toono' | 'insert_uni' | 'cover_felt' | 'tie_ropes'

export interface Material {
  id: string
  type: MaterialType
  position: [number, number, number]
  target: [number, number, number]
  state: MaterialState
  emissive: number
}

export interface BuildingStepRef {
  selectMaterial: (id: string) => void
  dragMaterial: (id: string, position: [number, number, number]) => void
  releaseMaterial: (id: string) => void
  reset: () => void
  getMaterials: () => Material[]
  getProgress: () => { currentStep: number; totalProgress: number; stepProgress: number }
}

export interface BuildingStepProps {
  onProgressChange?: (currentStep: number, totalProgress: number, stepProgress: number) => void
  onStepComplete?: (step: StepType, stepIndex: number) => void
  onSnap?: (material: Material) => void
  children?: (props: { materials: Material[]; currentStep: StepType; stepIndex: number }) => React.ReactNode
}

interface StepConfig { type: StepType; materialType: MaterialType | null; totalItems: number }

const STEPS: StepConfig[] = [
  { type: 'select_site', materialType: null, totalItems: 1 },
  { type: 'lay_floor', materialType: null, totalItems: 1 },
  { type: 'erect_khana', materialType: 'khana', totalItems: 8 },
  { type: 'install_toono', materialType: 'toono', totalItems: 1 },
  { type: 'insert_uni', materialType: 'uni', totalItems: 60 },
  { type: 'cover_felt', materialType: 'felt', totalItems: 1 },
  { type: 'tie_ropes', materialType: 'rope', totalItems: 10 },
]

const SNAP_RADIUS = 1.5
const SNAP_DURATION = 200
const VIBRATION_AMP = 0.05

const dist3D = (a: [number, number, number], b: [number, number, number]) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2)

const lerp3D = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

function genTargets(type: MaterialType, count: number): [number, number, number][] {
  const positions: [number, number, number][] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2
    switch (type) {
      case 'khana': positions.push([Math.cos(angle) * 4, 0, Math.sin(angle) * 4]); break
      case 'toono': positions.push([0, 5, 0]); break
      case 'uni': positions.push([Math.cos(angle) * 2, 4.5, Math.sin(angle) * 2]); break
      case 'felt': positions.push([0, 3, 0]); break
      case 'rope': positions.push([Math.cos(angle) * 5, 0.5, Math.sin(angle) * 5]); break
    }
  }
  return positions
}

function playClick(): void {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 800; osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1)
  } catch { /* ignore */ }
}

const BuildingStep = forwardRef<BuildingStepRef, BuildingStepProps>(function BuildingStep(
  { onProgressChange, onStepComplete, onSnap, children }, ref
) {
  const [stepIdx, setStepIdx] = useState(0)
  const [materials, setMaterials] = useState<Material[]>([])
  const animRef = useRef<number | null>(null)
  const materialsRef = useRef<Material[]>([])

  useEffect(() => { materialsRef.current = materials }, [materials])

  const step = STEPS[stepIdx]
  const completed = materials.filter(m => m.state === 'placed').length
  const stepProgress = step.totalItems > 0 ? completed / step.totalItems : 0
  const totalProgress = (stepIdx + stepProgress) / STEPS.length

  const initMaterials = useCallback((idx: number) => {
    const s = STEPS[idx]
    if (!s.materialType) { setMaterials([]); return }
    const targets = genTargets(s.materialType, s.totalItems)
    setMaterials(targets.map((target, i) => ({
      id: `${s.materialType}-${i}`, type: s.materialType!,
      position: [-10, -5, 0] as [number, number, number], target,
      state: 'idle', emissive: 0,
    })))
  }, [])

  useEffect(() => { initMaterials(stepIdx) }, [stepIdx, initMaterials])

  useEffect(() => {
    let start: number | null = null
    const fadeIn = (ts: number) => {
      if (!start) start = ts
      const t = Math.min(1, (ts - start) / 500)
      setMaterials(prev => prev.map(m => ({
        ...m, position: [-10 + t * 10, -5 + t * 5, 0] as [number, number, number]
      })))
      if (t < 1) animRef.current = requestAnimationFrame(fadeIn)
    }
    animRef.current = requestAnimationFrame(fadeIn)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [stepIdx])

  useEffect(() => { onProgressChange?.(stepIdx, totalProgress, stepProgress) },
    [stepIdx, totalProgress, stepProgress, onProgressChange])

  useEffect(() => {
    if (stepProgress >= 1 && stepIdx < STEPS.length - 1) {
      let start: number | null = null
      const highlight = (ts: number) => {
        if (!start) start = ts
        const t = Math.min(1, (ts - start) / 600)
        const emissive = t < 0.5 ? t : 1 - t
        setMaterials(prev => prev.map(m => ({ ...m, emissive })))
        if (t < 1) animRef.current = requestAnimationFrame(highlight)
        else {
          setMaterials(prev => prev.map(m => ({ ...m, emissive: 0 })))
          onStepComplete?.(step.type, stepIdx)
          setTimeout(() => setStepIdx(i => i + 1), 100)
        }
      }
      animRef.current = requestAnimationFrame(highlight)
      return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
    }
  }, [stepProgress, stepIdx, step.type, onStepComplete])

  const snapMaterial = useCallback((id: string) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, state: 'snapping' } : m))
    let start: number | null = null
    const mat = materialsRef.current.find(m => m.id === id)
    if (!mat) return
    const startPos = [...mat.position] as [number, number, number]
    const targetPos = mat.target

    const animate = (ts: number) => {
      if (!start) start = ts
      const t = easeOutQuad(Math.min(1, (ts - start) / SNAP_DURATION))
      const vibrate = t < 1 ? Math.sin(t * Math.PI * 10) * VIBRATION_AMP * (1 - t) : 0
      const newPos = lerp3D(startPos, targetPos, t)
      newPos[0] += vibrate; newPos[2] += vibrate
      setMaterials(prev => prev.map(m =>
        m.id === id ? { ...m, position: newPos, state: t >= 1 ? 'placed' : 'snapping' } : m
      ))
      if (t >= 1) {
        playClick()
        onSnap?.({ ...mat, position: targetPos, state: 'placed' })
      } else {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }, [onSnap])

  useImperativeHandle(ref, () => ({
    selectMaterial: (id: string) => setMaterials(prev =>
      prev.map(m => m.id === id ? { ...m, state: 'dragging' } : m)),
    dragMaterial: (id: string, position: [number, number, number]) => setMaterials(prev =>
      prev.map(m => m.id === id ? { ...m, position } : m)),
    releaseMaterial: (id: string) => {
      const mat = materialsRef.current.find(m => m.id === id)
      if (!mat) return
      dist3D(mat.position, mat.target) <= SNAP_RADIUS
        ? snapMaterial(id)
        : setMaterials(prev => prev.map(m => m.id === id ? { ...m, state: 'idle' } : m))
    },
    reset: () => { setStepIdx(0); initMaterials(0) },
    getMaterials: () => materialsRef.current,
    getProgress: () => ({ currentStep: stepIdx, totalProgress, stepProgress }),
  }), [snapMaterial, initMaterials, stepIdx, totalProgress, stepProgress])

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  return children ? <>{children({ materials, currentStep: step.type, stepIndex: stepIdx })}</> : null
})

export default BuildingStep
