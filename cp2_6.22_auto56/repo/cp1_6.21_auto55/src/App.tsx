import { useState, useEffect, useCallback, useRef } from 'react';
import MoleculeViewer from './components/MoleculeViewer';
import UIOverlay from './components/UIOverlay';
import ReactionSimulator from './components/ReactionSimulator';
import { fetchMoleculeList, fetchMolecule, calculateEnergy } from './api';
import type { Molecule, MoleculeInfo, Atom, EnergyResponse } from './api';

export interface EnergyPoint {
  step: number;
  energy: number;
  timestamp: number;
}

function App() {
  const [moleculeList, setMoleculeList] = useState<MoleculeInfo[]>([]);
  const [currentMolecule, setCurrentMolecule] = useState<Molecule | null>(null);
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('h2o');
  const [atoms, setAtoms] = useState<Atom[]>([]);
  const [energyHistory, setEnergyHistory] = useState<EnergyPoint[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [reactionStep, setReactionStep] = useState(0);
  const [brokenBonds, setBrokenBonds] = useState<Set<string>>(new Set());
  const [reactionMessage, setReactionMessage] = useState<string>('选择分子开始探索');
  const stepCounterRef = useRef(0);

  useEffect(() => {
    const loadMoleculeList = async () => {
      try {
        const list = await fetchMoleculeList();
        setMoleculeList(list);
      } catch (error) {
        console.error('Failed to load molecule list:', error);
      }
    };
    loadMoleculeList();
  }, []);

  const loadMolecule = useCallback(async (id: string) => {
    setIsTransitioning(true);
    setBrokenBonds(new Set());
    setEnergyHistory([]);
    stepCounterRef.current = 0;
    setReactionStep(0);
    setReactionMessage('加载分子中...');

    try {
      const molecule = await fetchMolecule(id);
      setCurrentMolecule(molecule);
      setAtoms(JSON.parse(JSON.stringify(molecule.atoms)));

      setTimeout(() => {
        setIsTransitioning(false);
        setReactionMessage(`${molecule.name} (${molecule.formula}) 已加载`);
      }, 500);
    } catch (error) {
      console.error('Failed to load molecule:', error);
      setIsTransitioning(false);
      setReactionMessage('加载失败，请重试');
    }
  }, []);

  useEffect(() => {
    if (selectedMoleculeId) {
      loadMolecule(selectedMoleculeId);
    }
  }, [selectedMoleculeId, loadMolecule]);

  const lastEnergyRequestRef = useRef(0);
  const energyRequestTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleAtomPositionUpdate = useCallback(
    async (updatedAtoms: Atom[]) => {
      setAtoms(updatedAtoms);

      if (currentMolecule) {
        const now = Date.now();
        if (now - lastEnergyRequestRef.current < 500) {
          if (energyRequestTimeoutRef.current) {
            clearTimeout(energyRequestTimeoutRef.current);
          }
          energyRequestTimeoutRef.current = setTimeout(async () => {
            try {
              const response: EnergyResponse = await calculateEnergy(
                currentMolecule.id,
                updatedAtoms
              );
              stepCounterRef.current += 1;
              const newPoint: EnergyPoint = {
                step: stepCounterRef.current,
                energy: response.energy,
                timestamp: response.timestamp,
              };
              setEnergyHistory((prev) => [...prev.slice(-49), newPoint]);
              setReactionStep(stepCounterRef.current);
              lastEnergyRequestRef.current = Date.now();
            } catch (error) {
              console.error('Energy calculation failed:', error);
            }
          }, 500);
          return;
        }

        lastEnergyRequestRef.current = now;
        try {
          const response: EnergyResponse = await calculateEnergy(
            currentMolecule.id,
            updatedAtoms
          );
          stepCounterRef.current += 1;
          const newPoint: EnergyPoint = {
            step: stepCounterRef.current,
            energy: response.energy,
            timestamp: response.timestamp,
          };
          setEnergyHistory((prev) => [...prev.slice(-49), newPoint]);
          setReactionStep(stepCounterRef.current);
        } catch (error) {
          console.error('Energy calculation failed:', error);
        }
      }
    },
    [currentMolecule]
  );

  const handleBondBreak = useCallback((bondId: string) => {
    setBrokenBonds((prev) => new Set(prev).add(bondId));
    setReactionMessage('化学键断裂！');
  }, []);

  const handleBondForm = useCallback((bondId: string) => {
    setBrokenBonds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(bondId);
      return newSet;
    });
    setReactionMessage('化学键重新形成');
  }, []);

  const handleReset = useCallback(() => {
    if (currentMolecule) {
      loadMolecule(currentMolecule.id);
      setReactionMessage('分子已重置');
    }
  }, [currentMolecule, loadMolecule]);

  const handleMoleculeChange = useCallback((id: string) => {
    setSelectedMoleculeId(id);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelCollapsed((prev) => !prev);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.sceneContainer}>
        <MoleculeViewer
          molecule={currentMolecule}
          atoms={atoms}
          setAtoms={setAtoms}
          brokenBonds={brokenBonds}
          isTransitioning={isTransitioning}
        />
        <ReactionSimulator
          molecule={currentMolecule}
          atoms={atoms}
          onAtomsUpdate={handleAtomPositionUpdate}
          onBondBreak={handleBondBreak}
          onBondForm={handleBondForm}
        />
      </div>
      <UIOverlay
        moleculeList={moleculeList}
        selectedMoleculeId={selectedMoleculeId}
        onMoleculeChange={handleMoleculeChange}
        energyHistory={energyHistory}
        currentEnergy={energyHistory.length > 0 ? energyHistory[energyHistory.length - 1].energy : 0}
        reactionStep={reactionStep}
        reactionMessage={reactionMessage}
        onReset={handleReset}
        isCollapsed={isPanelCollapsed}
        onToggleCollapse={togglePanel}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'linear-gradient(135deg, #0a0a2e 0%, #1a1a3e 100%)',
  },
  sceneContainer: {
    width: '90%',
    height: '100%',
    position: 'relative',
  },
};

export default App;
