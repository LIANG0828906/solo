import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { type HazardZone, type LevelState, type Platform, type Spike, type TrajectoryPoint, type SelectionTarget } from '@/types/shared';
import { calculateTrajectory } from '@/utils/trajectory';
import { detectHazards } from '@/utils/collision';
import { v4 as uuidv4 } from 'uuid';

interface EditorProps {
  onHazardsChange: (hazards: HazardZone[]) => void;
}

type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const ROTATIONS: Spike['rotation'][] = [0, 45, 90, 135, 180, 225, 270, 315];

function nextRotation(cur: Spike['rotation']): Spike['rotation'] {
  const idx = ROTATIONS.indexOf(cur);
  return ROTATIONS[(idx + 1) % ROTATIONS.length];
}

function getTriangleVerticesLocal(centerX: number, centerY: number, size: number, rotationDeg: number): [number, number][] {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(