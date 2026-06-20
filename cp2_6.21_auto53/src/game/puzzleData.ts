import { LevelData } from '../types';

export const puzzleLevels: LevelData[] = [
  {
    gridSize: 8,
    obstacles: [],
    blocks: [
      { type: 'I3', position: { x: 2, y: 2 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 5, width: 3, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [],
    blocks: [
      { type: 'SQUARE', position: { x: 3, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 5, width: 2, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 4, y: 7 },
      { x: 5, y: 7 },
    ],
    blocks: [
      { type: 'L3', position: { x: 2, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 5, y: 5, width: 3, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 5 },
      { x: 3, y: 6 },
    ],
    blocks: [
      { type: 'I4', position: { x: 1, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 4, y: 4, width: 4, height: 4 },
  },
  {
    gridSize: 8,
    obstacles: [],
    blocks: [
      { type: 'I3', position: { x: 1, y: 2 }, rotation: 0 },
      { type: 'L3', position: { x: 5, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 4, y: 4 },
    ],
    blocks: [
      { type: 'T4', position: { x: 2, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 2, y: 6 },
      { x: 3, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    blocks: [
      { type: 'Z4', position: { x: 2, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 4, width: 3, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 0, y: 7 },
      { x: 1, y: 7 },
      { x: 6, y: 7 },
      { x: 7, y: 7 },
    ],
    blocks: [
      { type: 'L4', position: { x: 1, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 3 },
      { x: 4, y: 3 },
    ],
    blocks: [
      { type: 'SQUARE', position: { x: 1, y: 1 }, rotation: 0 },
      { type: 'I3', position: { x: 5, y: 1 }, rotation: 90 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 2, y: 5 },
      { x: 5, y: 5 },
    ],
    blocks: [
      { type: 'I4', position: { x: 0, y: 1 }, rotation: 0 },
      { type: 'T4', position: { x: 4, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 1, y: 6, width: 6, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
    ],
    blocks: [
      { type: 'L4', position: { x: 1, y: 1 }, rotation: 0 },
      { type: 'L3', position: { x: 5, y: 1 }, rotation: 90 },
    ],
    targetArea: { x: 1, y: 6, width: 6, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 2, y: 3 },
      { x: 5, y: 3 },
      { x: 2, y: 6 },
      { x: 5, y: 6 },
    ],
    blocks: [
      { type: 'Z4', position: { x: 0, y: 1 }, rotation: 0 },
      { type: 'I3', position: { x: 5, y: 1 }, rotation: 0 },
    ],
    targetArea: { x: 3, y: 4, width: 2, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 0, y: 4 },
      { x: 7, y: 4 },
      { x: 1, y: 4 },
      { x: 6, y: 4 },
    ],
    blocks: [
      { type: 'T4', position: { x: 2, y: 0 }, rotation: 0 },
      { type: 'SQUARE', position: { x: 4, y: 1 }, rotation: 0 },
      { type: 'L3', position: { x: 1, y: 6 }, rotation: 180 },
    ],
    targetArea: { x: 2, y: 5, width: 4, height: 3 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 3, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
    ],
    blocks: [
      { type: 'I4', position: { x: 0, y: 0 }, rotation: 0 },
      { type: 'I4', position: { x: 5, y: 0 }, rotation: 90 },
      { type: 'Z4', position: { x: 0, y: 6 }, rotation: 0 },
    ],
    targetArea: { x: 2, y: 3, width: 4, height: 2 },
  },
  {
    gridSize: 8,
    obstacles: [
      { x: 1, y: 1 },
      { x: 6, y: 1 },
      { x: 1, y: 6 },
      { x: 6, y: 6 },
      { x: 3, y: 3 },
      { x: 4, y: 3 },
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ],
    blocks: [
      { type: 'L4', position: { x: 2, y: 0 }, rotation: 0 },
      { type: 'T4', position: { x: 4, y: 0 }, rotation: 0 },
      { type: 'SQUARE', position: { x: 0, y: 3 }, rotation: 0 },
      { type: 'I3', position: { x: 6, y: 3 }, rotation: 90 },
    ],
    targetArea: { x: 2, y: 6, width: 4, height: 2 },
  },
];
