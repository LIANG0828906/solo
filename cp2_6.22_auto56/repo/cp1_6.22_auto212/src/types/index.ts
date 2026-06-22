export type SecondaryStructure = 'helix' | 'sheet' | 'coil'

export type RenderStyle = 'cartoon' | 'wireframe' | 'ballstick'

export interface AminoAcid {
  id: number
  name: string
  threeLetterCode: string
  oneLetterCode: string
  secondaryStructure: SecondaryStructure
  atoms: Atom[]
  position: { x: number; y: number; z: number }
  caAtom?: Atom
}

export interface Atom {
  name: string
  element: string
  position: { x: number; y: number; z: number }
  residueId: number
  isSideChain: boolean
}

export interface PDBData {
  id: string
  name: string
  sequence: AminoAcid[]
  atoms: Atom[]
  boundingBox: {
    min: { x: number; y: number; z: number }
    max: { x: number; y: number; z: number }
    center: { x: number; y: number; z: number }
  }
}

export interface ViewerState {
  selectedPdbId: string
  pdbData: PDBData | null
  selectedResidueId: number | null
  renderStyle: RenderStyle
  showSideChains: boolean
  ssaoIntensity: number
  backgroundColor: string
  facingResidueRange: { start: number; end: number } | null
  setSelectedPdbId: (id: string) => void
  setPdbData: (data: PDBData | null) => void
  setSelectedResidueId: (id: number | null) => void
  setRenderStyle: (style: RenderStyle) => void
  setShowSideChains: (show: boolean) => void
  setSsaoIntensity: (intensity: number) => void
  setBackgroundColor: (color: string) => void
  setFacingResidueRange: (range: { start: number; end: number } | null) => void
}

export const COLORS = {
  helix: '#FF6B6B',
  sheet: '#4ECDC4',
  coil: '#95A5A6',
  highlight: '#FFFFFF',
  selection: '#FBBF24',
  background: '#0F172A',
  panel: 'rgba(30, 41, 59, 0.9)',
}
