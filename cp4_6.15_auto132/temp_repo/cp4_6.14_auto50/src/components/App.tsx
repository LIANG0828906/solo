import React, { useState, useEffect, useCallback, useRef } from 'react';
import MoleculeCanvas from './MoleculeCanvas';
import MoleculeViewer from './MoleculeViewer';
import { Molecule, Atom, ComparisonResult } from '../types';
import { MOLECULE_LIBRARY, getMoleculeById } from '../utils/molecules';
import { centerMolecule } from '../utils/parser';
import ComparerWorker from '../workers/comparer.worker?worker';
import '../styles/App.css';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  atom: Atom | null;
  source: 'A' | 'B' | null;
}

const App: React.FC = () => {
  const [selectedA, setSelectedA] = useState<Molecule | null>(null);
  const [selectedB, setSelectedB] = useState<Molecule | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showComparePanel, setShowComparePanel] = useState(false);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    atom: null,
    source: null,
  });

  const tooltipTimerRef = useRef<number | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    const defaultMol = getMoleculeById('water');
    if (defaultMol) {
      setSelectedA(centerMolecule(defaultMol));
    }
  }, []);

  useEffect(() => {
    workerRef.current = new ComparerWorker();

    workerRef.current.onmessage = (e: MessageEvent) => {
      if (e.data.type === 'result') {
        setComparisonResult(e.data.result);
        setIsComparing(false);
        setShowComparePanel(true);
      } else if (e.data.type === 'error') {
        console.error('Worker error:', e.data.error);
        setIsComparing(false);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleSelectMolecule = useCallback((molecule: Molecule) => {
    const centered = centerMolecule(molecule);

    if (!selectedA || (selectedA && selectedB)) {
      setSelectedA(centered);
      setSelectedB(null);
      setComparisonResult(null);
      setShowComparePanel(false);
    } else {
      if (selectedA.id === molecule.id) {
        setSelectedB(null);
      } else {
        setSelectedB(centered);
      }
      setComparisonResult(null);
      setShowComparePanel(false);
    }
  }, [selectedA, selectedB]);

  const handleCompare = useCallback(() => {
    if (!selectedA || !selectedB || !workerRef.current) return;

    setIsComparing(true);
    setComparisonResult(null);

    setTimeout(() => {
      if (workerRef.current) {
        workerRef.current.postMessage({
          type: 'compare',
          moleculeA: selectedA,
          moleculeB: selectedB,
        });
      }
    }, 100);
  }, [selectedA, selectedB]);

  const handleCloseComparePanel = useCallback(() => {
    setShowComparePanel(false);
  }, []);

  const showTooltipDelayed = useCallback((atom: Atom | null, source: 'A' | 'B') => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }

    if (atom) {
      tooltipTimerRef.current = window.setTimeout(() => {
        setTooltip((prev) => ({
          ...prev,
          visible: true,
          atom,
          source,
        }));
      }, 100);
    } else {
      setTooltip((prev) => ({
        ...prev,
        visible: false,
        atom: null,
        source: null,
      }));
    }
  }, []);

  const handleAtomHoverA = useCallback((atom: Atom | null) => {
    showTooltipDelayed(atom, 'A');
  }, [showTooltipDelayed]);

  const handleAtomHoverB = useCallback((atom: Atom | null) => {
    showTooltipDelayed(atom, 'B');
  }, [showTooltipDelayed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX + 10,
        y: e.clientY + 10,
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="app">
      <div className="app-main">
        <MoleculeViewer
          selectedMoleculeA={selectedA}
          selectedMoleculeB={selectedB}
          comparisonResult={comparisonResult}
          isComparing={isComparing}
          showComparePanel={showComparePanel}
          onSelectMolecule={handleSelectMolecule}
          onCompare={handleCompare}
          onCloseComparePanel={handleCloseComparePanel}
        />

        <MoleculeCanvas
          moleculeA={selectedA}
          moleculeB={selectedB}
          comparisonResult={comparisonResult}
          isComparing={isComparing}
          onAtomHoverA={handleAtomHoverA}
          onAtomHoverB={handleAtomHoverB}
        />
      </div>

      <div className={`app-tooltip ${tooltip.visible && tooltip.atom ? 'visible' : ''}`}>
        {tooltip.atom && (
          <>
            <div className="tooltip-title">
              {tooltip.atom.name} ({tooltip.source === 'A' ? '分子A' : '分子B'})
            </div>
            <div className="tooltip-coord">
              X: {tooltip.atom.position[0].toFixed(3)}
              &nbsp;&nbsp;Y: {tooltip.atom.position[1].toFixed(3)}
              &nbsp;&nbsp;Z: {tooltip.atom.position[2].toFixed(3)}
            </div>
          </>
        )}
      </div>

      {isComparing && (
        <div className="loading-indicator">正在计算分子比对...</div>
      )}
    </div>
  );
};

export default App;
