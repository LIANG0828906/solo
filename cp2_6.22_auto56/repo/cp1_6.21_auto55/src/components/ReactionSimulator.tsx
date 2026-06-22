import { useEffect, useRef, useCallback } from 'react';
import type { Molecule, Atom } from '../api';

interface ReactionSimulatorProps {
  molecule: Molecule | null;
  atoms: Atom[];
  onAtomsUpdate: (atoms: Atom[]) => void;
  onBondBreak: (bondId: string) => void;
  onBondForm: (bondId: string) => void;
}

interface AnimationState {
  atomId: string;
  startPosition: [number, number, number];
  targetPosition: [number, number, number];
  startTime: number;
  duration: number;
  type: 'spring' | 'linear';
}

const distance = (p1: [number, number, number], p2: [number, number, number]): number => {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const lerp = (
  start: [number, number, number],
  end: [number, number, number],
  t: number
): [number, number, number] => {
  return [
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  ];
};

const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

function ReactionSimulator({
  molecule,
  atoms,
  onAtomsUpdate,
  onBondBreak,
  onBondForm,
}: ReactionSimulatorProps) {
  const atomsRef = useRef<Atom[]>(atoms);
  const moleculeRef = useRef<Molecule | null>(molecule);
  const animationsRef = useRef<Map<string, AnimationState>>(new Map());
  const brokenBondsRef = useRef<Set<string>>(new Set());
  const draggingAtomRef = useRef<string | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    atomsRef.current = atoms;
  }, [atoms]);

  useEffect(() => {
    moleculeRef.current = molecule;
  }, [molecule]);

  const getOriginalPosition = useCallback(
    (atomId: string): [number, number, number] | null => {
      const originalAtom = moleculeRef.current?.atoms.find((a) => a.id === atomId);
      return originalAtom ? originalAtom.position : null;
    },
    []
  );

  const getBondForAtom = useCallback(
    (atomId: string) => {
      return moleculeRef.current?.bonds.find(
        (b) => b.atom1Id === atomId || b.atom2Id === atomId
      );
    },
    []
  );

  const startAnimation = useCallback(
    (
      atomId: string,
      targetPosition: [number, number, number],
      duration: number,
      type: 'spring' | 'linear'
    ) => {
      const currentAtom = atomsRef.current.find((a) => a.id === atomId);
      if (!currentAtom) return;

      animationsRef.current.set(atomId, {
        atomId,
        startPosition: [...currentAtom.position] as [number, number, number],
        targetPosition,
        startTime: performance.now(),
        duration,
        type,
      });
    },
    []
  );

  const updateAnimations = useCallback(() => {
    const now = performance.now();
    const updatedAtoms = [...atomsRef.current];
    let hasChanges = false;

    animationsRef.current.forEach((anim, atomId) => {
      const elapsed = now - anim.startTime;
      const progress = Math.min(elapsed / anim.duration, 1);

      const easedProgress =
        anim.type === 'spring' ? easeOutElastic(progress) : easeInOutQuad(progress);

      const newPosition = lerp(anim.startPosition, anim.targetPosition, easedProgress);

      const atomIndex = updatedAtoms.findIndex((a) => a.id === atomId);
      if (atomIndex !== -1) {
        updatedAtoms[atomIndex] = {
          ...updatedAtoms[atomIndex],
          position: newPosition,
        };
        hasChanges = true;
      }

      if (progress >= 1) {
        animationsRef.current.delete(atomId);
      }
    });

    if (hasChanges) {
      atomsRef.current = updatedAtoms;

      if (now - lastUpdateRef.current >= 500 && draggingAtomRef.current) {
        onAtomsUpdate(updatedAtoms);
        lastUpdateRef.current = now;
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAnimations);
  }, [onAtomsUpdate]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(updateAnimations);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateAnimations]);

  useEffect(() => {
    if (!molecule || molecule.id !== 'c6h6') return;

    const currentDraggingAtom = atoms.find(
      (a) => a.element === 'H' && animationsRef.current.has(a.id) === false
    );

    if (currentDraggingAtom && !draggingAtomRef.current) {
      const originalPos = getOriginalPosition(currentDraggingAtom.id);
      const bond = getBondForAtom(currentDraggingAtom.id);

      if (originalPos && bond) {
        const currentDist = distance(currentDraggingAtom.position, originalPos);
        const threshold = bond.bondLength * 1.5;

        if (currentDist > threshold && !brokenBondsRef.current.has(bond.id)) {
          onBondBreak(bond.id);
          brokenBondsRef.current.add(bond.id);

          const direction: [number, number, number] = [
            currentDraggingAtom.position[0] - originalPos[0],
            currentDraggingAtom.position[1] - originalPos[1],
            currentDraggingAtom.position[2] - originalPos[2],
          ];
          const length = Math.sqrt(
            direction[0] ** 2 + direction[1] ** 2 + direction[2] ** 2
          );
          const normalized: [number, number, number] = [
            direction[0] / length,
            direction[1] / length,
            direction[2] / length,
          ];

          const extendDist = currentDist - threshold;
          const target: [number, number, number] = [
            currentDraggingAtom.position[0] + normalized[0] * extendDist * 0.5,
            currentDraggingAtom.position[1] + normalized[1] * extendDist * 0.5,
            currentDraggingAtom.position[2] + normalized[2] * extendDist * 0.5,
          ];

          startAnimation(currentDraggingAtom.id, target, 300, 'linear');
          draggingAtomRef.current = currentDraggingAtom.id;
        }
      }
    }

    if (draggingAtomRef.current) {
      const atom = atoms.find((a) => a.id === draggingAtomRef.current);
      if (!atom) {
        draggingAtomRef.current = null;
      }
    }
  }, [atoms, molecule, getOriginalPosition, getBondForAtom, onBondBreak, startAnimation]);

  useEffect(() => {
    if (!molecule || molecule.id !== 'c6h6') return;

    const checkBondReform = () => {
      if (!draggingAtomRef.current) return;

      const atom = atomsRef.current.find((a) => a.id === draggingAtomRef.current);
      const originalPos = getOriginalPosition(draggingAtomRef.current);
      const bond = getBondForAtom(draggingAtomRef.current);

      if (!atom || !originalPos || !bond) return;

      if (animationsRef.current.has(atom.id)) return;

      const currentDist = distance(atom.position, originalPos);

      if (currentDist <= bond.bondLength * 1.2) {
        if (brokenBondsRef.current.has(bond.id)) {
          onBondForm(bond.id);
          brokenBondsRef.current.delete(bond.id);
        }
        startAnimation(atom.id, originalPos, 400, 'spring');
        draggingAtomRef.current = null;
      }
    };

    const interval = setInterval(checkBondReform, 50);
    return () => clearInterval(interval);
  }, [molecule, getOriginalPosition, getBondForAtom, onBondForm, startAnimation]);

  useEffect(() => {
    if (!molecule) return;

    const sendEnergyUpdate = () => {
      if (
        !draggingAtomRef.current &&
        animationsRef.current.size === 0 &&
        atomsRef.current.length > 0
      ) {
        const now = performance.now();
        if (now - lastUpdateRef.current >= 1000) {
          onAtomsUpdate([...atomsRef.current]);
          lastUpdateRef.current = now;
        }
      }
    };

    const interval = setInterval(sendEnergyUpdate, 1000);
    return () => clearInterval(interval);
  }, [molecule, onAtomsUpdate]);

  useEffect(() => {
    return () => {
      animationsRef.current.clear();
      brokenBondsRef.current.clear();
      draggingAtomRef.current = null;
    };
  }, []);

  return null;
}

export default ReactionSimulator;
