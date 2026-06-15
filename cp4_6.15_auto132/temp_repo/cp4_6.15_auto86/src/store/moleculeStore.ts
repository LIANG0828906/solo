import { createContext, useContext, useState, useCallback } from 'react';
import { Molecule, VibrationMode, MoleculeStoreState } from '../types/molecule';

export const MoleculeContext = createContext<MoleculeStoreState | undefined>(undefined);

export function useMoleculeStore(): MoleculeStoreState {
  const context = useContext(MoleculeContext);
  if (context === undefined) {
    throw new Error('useMoleculeStore must be used within a MoleculeProvider');
  }
  return context;
}

export function createStoreState(): MoleculeStoreState {
  const [currentMolecule, setCurrentMoleculeState] = useState<Molecule | null>(null);
  const [selectedAtoms, setSelectedAtomsState] = useState<string[]>([]);
  const [vibrationMode, setVibrationModeState] = useState<VibrationMode | null>(null);
  const [vibrationAmplitude, setVibrationAmplitudeState] = useState<number>(0.5);
  const [isVibrating, setIsVibrating] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(false);
  const [atomInfoCard, setAtomInfoCardState] = useState<{
    atomId: string;
    position: { x: number; y: number };
  } | null>(null);
  const [moleculeKey, setMoleculeKey] = useState<number>(0);

  const setCurrentMolecule = useCallback((molecule: Molecule | null) => {
    setCurrentMoleculeState(molecule);
    setSelectedAtomsState([]);
    setAtomInfoCardState(null);
    setMoleculeKey((prev) => prev + 1);
  }, []);

  const setSelectedAtoms = useCallback((atoms: string[]) => {
    setSelectedAtomsState(atoms);
  }, []);

  const addSelectedAtom = useCallback((atomId: string) => {
    setSelectedAtomsState((prev) => (prev.includes(atomId) ? prev : [...prev, atomId]));
  }, []);

  const removeSelectedAtom = useCallback((atomId: string) => {
    setSelectedAtomsState((prev) => prev.filter((id) => id !== atomId));
  }, []);

  const clearSelectedAtoms = useCallback(() => {
    setSelectedAtomsState([]);
  }, []);

  const setVibrationMode = useCallback((mode: VibrationMode | null) => {
    setVibrationModeState(mode);
    if (!mode) {
      setIsVibrating(false);
    }
  }, []);

  const setVibrationAmplitude = useCallback((amplitude: number) => {
    setVibrationAmplitudeState(Math.max(0, Math.min(1, amplitude)));
  }, []);

  const setAtomInfoCard = useCallback(
    (card: { atomId: string; position: { x: number; y: number } } | null) => {
      setAtomInfoCardState(card);
    },
    []
  );

  return {
    currentMolecule,
    selectedAtoms,
    vibrationMode,
    vibrationAmplitude,
    isVibrating,
    isRecording,
    isPanelCollapsed,
    atomInfoCard,
    moleculeKey,
    setCurrentMolecule,
    setSelectedAtoms,
    addSelectedAtom,
    removeSelectedAtom,
    clearSelectedAtoms,
    setVibrationMode,
    setVibrationAmplitude,
    setIsVibrating,
    setIsRecording,
    setIsPanelCollapsed,
    setAtomInfoCard,
  };
}
