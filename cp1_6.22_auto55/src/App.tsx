import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Molecule, ReactionResult } from '@/types';
import { useMoleculeData } from '@/hooks/useMoleculeData';
import MoleculeViewer from '@/components/MoleculeViewer';
import MoleculePanel from '@/components/MoleculePanel';

const App: React.FC = () => {
  const { molecules, loading, error, react } = useMoleculeData();
  const [primaryMolecule, setPrimaryMolecule] = useState<Molecule | null>(null);
  const [secondaryMolecule, setSecondaryMolecule] = useState<Molecule | null>(null);
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string | null>(null);
  const [selectedAtom, setSelectedAtom] = useState<{ moleculeId: string; atomId: string } | null>(null);
  const [isReacting, setIsReacting] = useState(false);
  const [reactionProgress, setReactionProgress] = useState(0);
  const [reactionResult, setReactionResult] = useState<ReactionResult | null>(null);
  const [dragMolecule, setDragMolecule] = useState<Molecule | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSelectMolecule = useCallback((molecule: Molecule) => {
    if (isReacting) return;

    if (!primaryMolecule) {
      setPrimaryMolecule(molecule);
      setSelectedMoleculeId(molecule.id);
      setReactionResult(null);
      setReactionProgress(0);
    } else if (!secondaryMolecule && molecule.id !== primaryMolecule.id) {
      setSecondaryMolecule(molecule);
    } else {
      setPrimaryMolecule(molecule);
      setSecondaryMolecule(null);
      setSelectedMoleculeId(molecule.id);
      setReactionResult(null);
      setReactionProgress(0);
    }
    setSelectedAtom(null);
  }, [primaryMolecule, secondaryMolecule, isReacting]);

  const handleDragStart = useCallback((molecule: Molecule, e: React.DragEvent) => {
    if (isReacting) return;
    setDragMolecule(molecule);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', molecule.id);
  }, [isReacting]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!dragMolecule) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDragPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, [dragMolecule]);

  const handleDrop = useCallback((position: { x: number; y: number }) => {
    if (dragMolecule && primaryMolecule && dragMolecule.id !== primaryMolecule.id && !secondaryMolecule) {
      setSecondaryMolecule(dragMolecule);
    } else if (dragMolecule && !primaryMolecule) {
      setPrimaryMolecule(dragMolecule);
      setSelectedMoleculeId(dragMolecule.id);
    }
    setDragMolecule(null);
    setDragPosition(null);
  }, [dragMolecule, primaryMolecule, secondaryMolecule]);

  const handleDragEnd = useCallback(() => {
    setDragMolecule(null);
    setDragPosition(null);
  }, []);

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      if (dragMolecule) {
        e.preventDefault();
      }
    };
    const handleGlobalDrop = () => {
      handleDragEnd();
    };
    window.addEventListener('dragover', handleGlobalDragOver);
    window.addEventListener('drop', handleGlobalDrop);
    return () => {
      window.removeEventListener('dragover', handleGlobalDragOver);
      window.removeEventListener('drop', handleGlobalDrop);
    };
  }, [dragMolecule, handleDragEnd]);

  const handleAtomClick = useCallback((moleculeId: string, atomId: string) => {
    setSelectedAtom(prev =>
      prev?.moleculeId === moleculeId && prev?.atomId === atomId
        ? null
        : { moleculeId, atomId }
    );
  }, []);

  const handleReact = useCallback(async () => {
    if (!primaryMolecule || !secondaryMolecule || isReacting) return;

    const result = await react(primaryMolecule.id, secondaryMolecule.id);
    if (!result) return;

    setIsReacting(true);
    setReactionProgress(0);

    const startTime = performance.now();
    const duration = 2000;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);

      setReactionProgress(progress);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsReacting(false);
        setReactionResult(result);
        setPrimaryMolecule(result.product);
        setSecondaryMolecule(null);
        setSelectedMoleculeId(result.product.id);
        setSelectedAtom(null);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [primaryMolecule, secondaryMolecule, isReacting, react]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleReset = useCallback(() => {
    setPrimaryMolecule(null);
    setSecondaryMolecule(null);
    setSelectedMoleculeId(null);
    setSelectedAtom(null);
    setReactionResult(null);
    setReactionProgress(0);
    setIsReacting(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const displayMolecule = reactionResult && reactionProgress >= 1
    ? reactionResult.product
    : primaryMolecule;

  const canReact = primaryMolecule && secondaryMolecule && !isReacting && !reactionResult;

  return (
    <div className="flex h-full w-full bg-[#1a1a2e] overflow-hidden" onDragOver={handleDragOver}>
      <MoleculePanel
        molecules={molecules}
        onSelectMolecule={handleSelectMolecule}
        onDragStart={handleDragStart}
        selectedMoleculeId={selectedMoleculeId}
        isMobile={isMobile}
      />

      <div className="flex-1 relative">
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-3">
          {canReact && (
            <button
              onClick={handleReact}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-[#0f3460] to-[#1a4a8a] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                animation: 'pulse 2s infinite',
              }}
            >
              {loading ? '反应中...' : '⚗️ 开始反应'}
            </button>
          )}

          {displayMolecule && (
            <div className="bg-black/60 backdrop-blur-sm rounded-xl p-4 min-w-[200px]">
              <h3 className="text-white font-bold text-lg mb-2">
                {reactionResult ? '反应产物' : '当前分子'}
              </h3>
              <div className="space-y-1 text-sm">
                <p className="text-gray-300">
                  <span className="text-gray-500">名称:</span> {displayMolecule.name}
                </p>
                <p className="text-gray-300 font-mono text-lg">
                  <span className="text-gray-500 font-sans">化学式:</span> {displayMolecule.formula}
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500">分子量:</span> {displayMolecule.molecularWeight} g/mol
                </p>
                <p className="text-gray-300">
                  <span className="text-gray-500">原子数:</span> {displayMolecule.atoms.length}
                </p>
              </div>
              {(secondaryMolecule || reactionResult) && (
                <button
                  onClick={handleReset}
                  className="mt-3 w-full px-3 py-2 bg-[#16213e] text-gray-300 text-sm rounded-lg hover:bg-[#0f3460] transition-colors"
                >
                  重置场景
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-900/60 backdrop-blur-sm rounded-xl p-3 text-red-200 text-sm">
              {error}
            </div>
          )}
        </div>

        <MoleculeViewer
          primaryMolecule={primaryMolecule}
          secondaryMolecule={secondaryMolecule}
          reactionResult={reactionResult}
          isReacting={isReacting}
          reactionProgress={reactionProgress}
          dragPreviewMolecule={dragMolecule}
          dragPosition={dragPosition}
          onDrop={handleDrop}
          onAtomClick={handleAtomClick}
          selectedAtom={selectedAtom}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(15, 52, 96, 0.7); }
          50% { box-shadow: 0 0 0 10px rgba(15, 52, 96, 0); }
        }
      `}</style>
    </div>
  );
};

export default App;
