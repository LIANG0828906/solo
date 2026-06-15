import { create } from 'zustand';
import {
  CampState,
  Tile,
  Outpost,
  Caravan,
  Resources,
  Position,
  CargoType,
  GameEvent,
  Particle,
  MAP_WIDTH,
  MAP_HEIGHT,
  TILE_PX,
} from '@/types';
import { findRoute } from '@/logic/route';
import { applyDailyResourceTick, calcTradeProfit } from '@/logic/resource';
import {
  shouldTriggerEvent,
  generateEvent,
  applySandstorm,
  applyDrought,
  applyBandits,
} from '@/logic/event';

function createInitialMap(): Tile[][] {
  const map: Tile[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({
        type: 'sand',
        pos: { x, y },
        inSandstorm: false,
        hasFog: true,
      });
    }
    map.push(row);
  }

  const oases = [
    { x: 15, y: 20, r: 3 },
    { x: 45, y: 10, r: 2 },
    { x: 40, y: 30, r: 2 },
    { x: 30, y: 18, r: 2 },
  ];
  for (const o of oases) {
    for (let dy = -o.r - 1; dy <= o.r + 1; dy++) {
      for (let dx = -o.r - 1; dx <= o.r + 1; dx++) {
        const nx = o.x + dx;
        const ny = o