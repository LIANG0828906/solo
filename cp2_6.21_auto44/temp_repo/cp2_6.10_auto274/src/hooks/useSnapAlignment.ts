import { useCallback, useEffect, useRef } from 'react';
import { useFragmentStore } from '../store/useFragmentStore';
import { calculateMatch } from '../api/fragments';
import type { Fragment, PlacedFragment } from '../types';

type Edge = 'top' | 'right' | 'bottom' | 'left';

interface SnapResult {
  shouldSnap: boolean;
  targetFragment: PlacedFragment | null;
  edge: Edge | null;
  snapPosition: { x: number; y: number };
  score: number;
}

interface SnapAlignmentFunctions {
  checkSnapPosition: (
    fragment: Fragment | PlacedFragment,
    x: number,
    y: number,
    threshold?: number
  ) => SnapResult;
  calculateSnapPosition: (
    fragment: Fragment | PlacedFragment,
    targetFragment: PlacedFragment,
    edge: Edge
  ) => { x: number; y: number };
  snapToGrid: (x: number, y: number, gridSize?: number) => { x: number; y: number };
  findBestMatchPosition: (
    fragment: Fragment | PlacedFragment,
    x: number,
    y: number
  ) => Promise<{ x: number; y: number; score: number } | null>;
  isNearEdge: (
    fragment: Fragment | PlacedFragment,
    x: number,
    y: number,
    workspaceRect: DOMRect
  ) => { edge: Edge | null; distance: number };
  executeSnap: (fragmentId: string, x: number, y: number) => void;
}

const getOppositeEdge = (edge: Edge): Edge => {
  const opposites: Record<Edge, Edge> = {
    top: 'bottom',
    bottom: 'top',
    left: 'right',
    right: 'left',
  };
  return opposites[edge];
};

const calculateEdgeSimilarity = (
  edge1: number[],
  edge2: number[]
): number => {
  if (edge1.length !== edge2.length) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < edge1.length; i++) {
    dotProduct += edge1[i] * edge2[i];
    norm1 += edge1[i] * edge1[i];
    norm2 += edge2[i] * edge2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (norm1 * norm2);
};

export function useSnapAlignment(): SnapAlignmentFunctions {
  const { placedFragments, updateFragmentPosition } = useFragmentStore();
  const calculateSnapPositionRef = useRef<((
    fragment: Fragment | PlacedFragment,
    targetFragment: PlacedFragment,
    edge: Edge
  ) => { x: number; y: number }) | null>(null);

  const getEdgeDistance = useCallback(
    (
      fragment: Fragment | PlacedFragment,
      targetFragment: PlacedFragment,
      x: number,
      y: number
    ): { edge: Edge; distance: number }[] => {
      const distances: { edge: Edge; distance: number }[] = [];

      const fragmentWidth = fragment.width;
      const fragmentHeight = fragment.height;
      const targetWidth = targetFragment.width;
      const targetHeight = targetFragment.height;

      const topDistance = Math.abs(
        y + fragmentHeight - targetFragment.y
      );
      distances.push({ edge: 'top', distance: topDistance });

      const bottomDistance = Math.abs(
        y - (targetFragment.y + targetHeight)
      );
      distances.push({ edge: 'bottom', distance: bottomDistance });

      const leftDistance = Math.abs(
        x + fragmentWidth - targetFragment.x
      );
      distances.push({ edge: 'left', distance: leftDistance });

      const rightDistance = Math.abs(
        x - (targetFragment.x + targetWidth)
      );
      distances.push({ edge: 'right', distance: rightDistance });

      return distances.sort((a, b) => a.distance - b.distance);
    },
    []
  );

  const calculateSnapPosition = useCallback(
    (
      fragment: Fragment | PlacedFragment,
      targetFragment: PlacedFragment,
      edge: Edge
    ): { x: number; y: number } => {
      const fragmentWidth = fragment.width;
      const fragmentHeight = fragment.height;
      const targetWidth = targetFragment.width;
      const targetHeight = targetFragment.height;

      switch (edge) {
        case 'top':
          return {
            x: targetFragment.x + (targetWidth - fragmentWidth) / 2,
            y: targetFragment.y - fragmentHeight,
          };
        case 'bottom':
          return {
            x: targetFragment.x + (targetWidth - fragmentWidth) / 2,
            y: targetFragment.y + targetHeight,
          };
        case 'left':
          return {
            x: targetFragment.x - fragmentWidth,
            y: targetFragment.y + (targetHeight - fragmentHeight) / 2,
          };
        case 'right':
          return {
            x: targetFragment.x + targetWidth,
            y: targetFragment.y + (targetHeight - fragmentHeight) / 2,
          };
        default:
          return { x: targetFragment.x, y: targetFragment.y };
      }
    },
    []
  );

  useEffect(() => {
    calculateSnapPositionRef.current = calculateSnapPosition;
  }, [calculateSnapPosition]);

  const checkSnapPosition = useCallback(
    (
      fragment: Fragment | PlacedFragment,
      x: number,
      y: number,
      threshold = 40
    ): SnapResult => {
      let bestResult: SnapResult = {
        shouldSnap: false,
        targetFragment: null,
        edge: null,
        snapPosition: { x, y },
        score: 0,
      };

      let minDistance = Infinity;

      for (const targetFragment of placedFragments) {
        if (targetFragment.id === fragment.id) continue;

        const edgeDistances = getEdgeDistance(
          fragment,
          targetFragment,
          x,
          y
        );

        const closestEdge = edgeDistances[0];
        if (closestEdge.distance < threshold && closestEdge.distance < minDistance) {
          minDistance = closestEdge.distance;
          const snapPos = calculateSnapPositionRef.current
            ? calculateSnapPositionRef.current(
                fragment,
                targetFragment,
                closestEdge.edge
              )
            : { x, y };

          const edgeKey = closestEdge.edge;
          const fragmentEdge = fragment.edges[edgeKey];
          const targetEdgeKey = getOppositeEdge(closestEdge.edge);
          const targetEdge = targetFragment.edges[targetEdgeKey];
          const score = calculateEdgeSimilarity(fragmentEdge, targetEdge);

          bestResult = {
            shouldSnap: true,
            targetFragment,
            edge: closestEdge.edge,
            snapPosition: snapPos,
            score,
          };
        }
      }

      return bestResult;
    },
    [placedFragments, getEdgeDistance]
  );

  const snapToGrid = useCallback(
    (x: number, y: number, gridSize = 10): { x: number; y: number } => {
      return {
        x: Math.round(x / gridSize) * gridSize,
        y: Math.round(y / gridSize) * gridSize,
      };
    },
    []
  );

  const findBestMatchPosition = useCallback(
    async (
      fragment: Fragment | PlacedFragment,
      x: number,
      y: number
    ): Promise<{ x: number; y: number; score: number } | null> => {
      try {
        const baseFragment: Fragment = 'zIndex' in fragment
          ? (({ x, y, zIndex, isPlaced, matchScore, ...rest }) => rest)(fragment)
          : fragment;

        const response = await calculateMatch(baseFragment, placedFragments);

        if (response.bestMatch) {
          const { suggestedPosition, score } = response.bestMatch;
          return {
            x: suggestedPosition.x,
            y: suggestedPosition.y,
            score,
          };
        }

        const snapResult = checkSnapPosition(fragment, x, y);
        if (snapResult.shouldSnap) {
          return {
            x: snapResult.snapPosition.x,
            y: snapResult.snapPosition.y,
            score: snapResult.score,
          };
        }

        return null;
      } catch {
        return null;
      }
    },
    [placedFragments, checkSnapPosition]
  );

  const isNearEdge = useCallback(
    (
      fragment: Fragment | PlacedFragment,
      x: number,
      y: number,
      workspaceRect: DOMRect
    ): { edge: Edge | null; distance: number } => {
      const fragmentWidth = fragment.width;
      const fragmentHeight = fragment.height;

      const edges: { edge: Edge; distance: number }[] = [
        { edge: 'left', distance: Math.abs(x) },
        {
          edge: 'right',
          distance: Math.abs(x + fragmentWidth - workspaceRect.width),
        },
        { edge: 'top', distance: Math.abs(y) },
        {
          edge: 'bottom',
          distance: Math.abs(y + fragmentHeight - workspaceRect.height),
        },
      ];

      const closest = edges.reduce((prev, curr) =>
        prev.distance < curr.distance ? prev : curr
      );

      return closest;
    },
    []
  );

  const executeSnap = useCallback(
    (fragmentId: string, x: number, y: number): void => {
      updateFragmentPosition(fragmentId, x, y);
    },
    [updateFragmentPosition]
  );

  return {
    checkSnapPosition,
    calculateSnapPosition,
    snapToGrid,
    findBestMatchPosition,
    isNearEdge,
    executeSnap,
  } as const;
}

export type UseSnapAlignmentReturn = ReturnType<typeof useSnapAlignment>;
