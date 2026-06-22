import { v4 as uuidv4 } from 'uuid';
import type {
  Position,
  Tile,
  Creature,
  CombatResult,
  ChestReward,
  TileType
} from '../types';
import {
  MAP_SIZE,
  EVOLUTION_KILLS_REQUIRED