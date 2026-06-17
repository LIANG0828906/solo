import { useEffect, useRef, useCallback } from 'react'
import { MoleculeRenderer } from '@/renderer/MoleculeRenderer'
import { useStore } from '@/store/useStore'
import MoleculePanel from '@/components/MoleculePanel'
import InfoTooltip from '@/components/InfoTooltip'
import ControlBar from '@/components/ControlBar'
import type { Atom, Bond } from '@/models/Molecule'

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<MoleculeRenderer | null>(null)

  const currentMolecule = useStore((s) => s.currentMolecule)
  const autoRotate = useStore((s) => s.autoRotate)
  const clipPlaneY = useStore((s) => s.clipPlaneY)
  const clipEnabled = useStore((s) => s.clipEnabled)
  const setHoverInfo = useStore((s) => s.setHoverInfo)
  const clearHover = useStore((s) => s.clearHover)

  const onHoverAtom = useCallback(
    (atom: Atom | null, screenX: number, screenY: number) => {
      if (atom) {
        setHoverInfo({ atom, bond: null, screenX, screenY })
      } else {
        clearHover()
      }
    },
    [setHoverInfo, clearHover],
  )

  const onHoverBond = useCallback(
    (bond: Bond | null, screenX: number, screenY: number) => {
      if (bond) {
        setHoverInfo({ atom: null, bond, screenX, screenY })
      } else {
        clearHover()
      }
    },
    [setHoverInfo, clearHover],
  )

  useEffect(() => {
    if (!containerRef.current) return
    const renderer = new MoleculeRenderer(containerRef.current, {
      onHoverAtom,
      onHoverBond,
    })
    rendererRef.current = renderer
    renderer.loadMolecule(currentMolecule)
    renderer.createClipPlaneVisual(clipPlaneY)

    return () => {
      renderer.dispose()
      rendererRef.current = null
    }
  }, [])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.loadMolecule(currentMolecule)
    }
  }, [currentMolecule])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setAutoRotate(autoRotate)
    }
  }, [autoRotate])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setClipPlaneY(clipPlaneY)
    }
  }, [clipPlaneY])

  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateClipEnabled(clipEnabled)
    }
  }, [clipEnabled])

  return (
    <div className="app-root">
      <div ref={containerRef} className="canvas-container" />
      <MoleculePanel />
      <InfoTooltip />
      <ControlBar />
      <div className="app-title">分子探针</div>
    </div>
  )
}
