import { createContext, useContext, useState, useRef, type ReactNode } from 'react'
import type { MoleculeData } from '../data/molecules'
import { MOLECULES } from '../data/molecules'

export type InteractionMode = 'select' | 'measure' | 'disassemble'
export type DisplayMode = 'ball-stick' | 'space-fill' | 'wireframe'

interface MoleculeContextType {
  currentMolecule: MoleculeData
  setCurrentMolecule: (m: MoleculeData) => void
  mode: InteractionMode
  setMode: (m: InteractionMode) => void
  displayMode: DisplayMode
  setDisplayMode: (m: DisplayMode) => void
  selectedAtoms: string[]
  setSelectedAtoms: (a: string[]) => void
  measuredAtoms: string[]
  setMeasuredAtoms: (a: string[]) => void
  disassembledAtoms: string[]
  setDisassembledAtoms: (a: string[]) => void
  cameraAzimuthRef: React.MutableRefObject<number>
  resetViewFnRef: React.MutableRefObject<(() => void) | null>
  moleculeKey: number
}

const MoleculeContext = createContext<MoleculeContextType | null>(null)

export function useMoleculeContext(): MoleculeContextType {
  const ctx = useContext(MoleculeContext)
  if (!ctx) throw new Error('useMoleculeContext must be used within MoleculeProvider')
  return ctx
}

export function MoleculeProvider({ children }: { children: ReactNode }) {
  const [currentMolecule, setCurrentMoleculeRaw] = useState<MoleculeData>(MOLECULES.h2o)
  const [mode, setMode] = useState<InteractionMode>('select')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('ball-stick')
  const [selectedAtoms, setSelectedAtoms] = useState<string[]>([])
  const [measuredAtoms, setMeasuredAtoms] = useState<string[]>([])
  const [disassembledAtoms, setDisassembledAtoms] = useState<string[]>([])
  const [moleculeKey, setMoleculeKey] = useState(0)
  const cameraAzimuthRef = useRef(0)
  const resetViewFnRef = useRef<(() => void) | null>(null)

  const setCurrentMolecule = (m: MoleculeData) => {
    setCurrentMoleculeRaw(m)
    setSelectedAtoms([])
    setMeasuredAtoms([])
    setDisassembledAtoms([])
    setMoleculeKey(k => k + 1)
  }

  return (
    <MoleculeContext.Provider
      value={{
        currentMolecule,
        setCurrentMolecule,
        mode,
        setMode,
        displayMode,
        setDisplayMode,
        selectedAtoms,
        setSelectedAtoms,
        measuredAtoms,
        setMeasuredAtoms,
        disassembledAtoms,
        setDisassembledAtoms,
        cameraAzimuthRef,
        resetViewFnRef,
        moleculeKey,
      }}
    >
      {children}
    </MoleculeContext.Provider>
  )
}
