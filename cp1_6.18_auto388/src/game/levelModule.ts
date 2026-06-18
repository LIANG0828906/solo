import { LevelMap, Platform, Block, PressurePlate, MovingPlatform, Trap, Door, ExitPortal, Vec2 } from './types';
import { v4 as uuidv4 } from 'uuid';

const LEVELS: (() => LevelMap)[] = [createLevel1, createLevel2, createLevel3];

export function getLevelCount(): number {
  return LEVELS.length;
}

export function loadLevel(index: number): LevelMap | null {
  if (index < 1 || index > LEVELS.length) return null;
  return LEVELS[index - 1]();
}

function plat(x: number, y: number, w: number, h: number, id?: string): Platform {
  return { id: id || uuidv4(), pos: { x, y }, width: w, height: h };
}

function block(x: number, y: number, w: number, h: number): Block {
  return { id: uuidv4(), pos: { x, y }, vel: { x: 0, y: 0 }, width: w, height: h, isGrounded: false };
}

function plate(x: number, y: number, w: number, h: number, linkedDoorId: string): PressurePlate {
  return { id: uuidv4(), pos: { x, y }, width: w, height: h, activated: false, linkedDoorId };
}

function movingPlatform(x1: number, y1: number, x2: number, y2: number, w: number, h: number, speed: number): MovingPlatform {
  return { id: uuidv4(), pos: { x: x1, y: y1 }, width: w, height: h, startPos: { x: x1, y: y1 }, endPos: { x: x2, y: y2 }, speed, progress: 0, direction: 1 };
}

function trap(x: number, y: number, w: number, h: number): Trap {
  return { id: uuidv4(), pos: { x, y }, width: w, height: h };
}

function door(x: number, y: number, w: number, h: number, id: string): Door {
  return { id, pos: { x, y }, width: w, height: h, open: false };
}

function exitP(x: number, y: number): ExitPortal {
  return { id: uuidv4(), pos: { x, y }, radius: 20 };
}

function createLevel1(): LevelMap {
  const doorId1 = 'door1';
  const doorId2 = 'door2';
  return {
    id: 1,
    name: '影桥初现',
    width: 800,
    height: 600,
    playerStart: { x: 60, y: 460 },
    platforms: [
      plat(0, 520, 200, 80, 'p1'),
      plat(350, 520, 100, 80, 'p2'),
      plat(600, 520, 200, 80, 'p3'),
      plat(200, 380, 80, 20, 'p4'),
      plat(0, 0, 800, 20, 'ceil'),
    ],
    blocks: [
      block(100, 480, 30, 30),
    ],
    pressurePlates: [
      plate(380, 500, 40, 10, doorId1),
    ],
    movingPlatforms: [
      movingPlatform(280, 520, 280, 300, 60, 15, 80),
    ],
    traps: [
      trap(220, 560, 120, 20),
    ],
    doors: [
      door(550, 460, 20, 60, doorId1),
    ],
    exitPortal: exitP(720, 490),
  };
}

function createLevel2(): LevelMap {
  const doorId1 = 'door1';
  const doorId2 = 'door2';
  return {
    id: 2,
    name: '双影同辉',
    width: 800,
    height: 600,
    playerStart: { x: 60, y: 460 },
    platforms: [
      plat(0, 520, 150, 80, 'p1'),
      plat(250, 520, 120, 80, 'p2'),
      plat(450, 520, 120, 80, 'p3'),
      plat(650, 520, 150, 80, 'p4'),
      plat(0, 0, 800, 20, 'ceil'),
      plat(350, 350, 100, 15, 'bridge'),
    ],
    blocks: [
      block(80, 480, 30, 30),
      block(500, 480, 30, 30),
    ],
    pressurePlates: [
      plate(270, 500, 40, 10, doorId1),
      plate(470, 500, 40, 10, doorId2),
    ],
    movingPlatforms: [
      movingPlatform(150, 450, 250, 450, 60, 15, 80),
    ],
    traps: [
      trap(160, 560, 80, 20),
      trap(380, 560, 60, 20),
    ],
    doors: [
      door(600, 460, 20, 60, doorId1),
      door(625, 460, 20, 60, doorId2),
    ],
    exitPortal: exitP(720, 490),
  };
}

function createLevel3(): LevelMap {
  const doorId1 = 'door1';
  return {
    id: 3,
    name: '影渊渡劫',
    width: 800,
    height: 600,
    playerStart: { x: 60, y: 260 },
    platforms: [
      plat(0, 320, 120, 20, 'p1'),
      plat(300, 400, 80, 20, 'p2'),
      plat(500, 320, 80, 20, 'p3'),
      plat(680, 250, 120, 20, 'p4'),
      plat(0, 580, 800, 20, 'floor'),
      plat(0, 0, 800, 20, 'ceil'),
      plat(200, 250, 60, 15, 'mid1'),
      plat(400, 180, 60, 15, 'mid2'),
    ],
    blocks: [
      block(50, 280, 30, 30),
    ],
    pressurePlates: [
      plate(310, 388, 40, 10, doorId1),
    ],
    movingPlatforms: [
      movingPlatform(120, 320, 300, 400, 60, 15, 80),
      movingPlatform(380, 180, 500, 320, 60, 15, 60),
    ],
    traps: [
      trap(150, 560, 80, 20),
      trap(350, 560, 80, 20),
      trap(550, 560, 80, 20),
    ],
    doors: [
      door(600, 190, 20, 60, doorId1),
    ],
    exitPortal: exitP(740, 220),
  };
}

export function processCollisionEvents(
  events: { type: string; entityId?: string; targetId?: string }[],
  pressurePlates: PressurePlate[],
  shadows: { id: string; shadowRect: { x: number; y: number; width: number; height: number } }[],
  blocks: Block[],
  playerPos: Vec2,
  playerRadius: number
): { plates: { id: string; activated: boolean }[]; doors: { id: string; open: boolean }[]; playerDied: boolean; playerExited: boolean } {
  let playerDied = false;
  let playerExited = false;
  const updatedPlates: { id: string; activated: boolean }[] = [];
  const updatedDoors: { id: string; open: boolean }[] = [];

  for (const e of events) {
    if (e.type === 'player_trap') playerDied = true;
    if (e.type === 'player_exit') playerExited = true;
  }

  for (const plate of pressurePlates) {
    let activated = false;

    for (const shadow of shadows) {
      const sr = shadow.shadowRect;
      if (sr.x < plate.pos.x + plate.width && sr.x + sr.width > plate.pos.x &&
          sr.y < plate.pos.y + plate.height && sr.y + sr.height > plate.pos.y) {
        activated = true;
        break;
      }
    }

    if (!activated) {
      for (const block of blocks) {
        if (block.pos.x < plate.pos.x + plate.width && block.pos.x + block.width > plate.pos.x &&
            block.pos.y < plate.pos.y + plate.height && block.pos.y + block.height > plate.pos.y) {
          activated = true;
          break;
        }
      }
    }

    if (!activated) {
      const dx = playerPos.x - (plate.pos.x + plate.width / 2);
      const dy = playerPos.y - (plate.pos.y + plate.height / 2);
      if (Math.abs(dx) < plate.width / 2 + playerRadius && Math.abs(dy) < plate.height / 2 + playerRadius) {
        activated = true;
      }
    }

    updatedPlates.push({ id: plate.id, activated });
  }

  const doorPlateMap = new Map<string, string[]>();
  for (const plate of pressurePlates) {
    const existing = doorPlateMap.get(plate.linkedDoorId) || [];
    existing.push(plate.id);
    doorPlateMap.set(plate.linkedDoorId, existing);
  }

  for (const [doorId, plateIds] of doorPlateMap) {
    const allActivated = plateIds.every((pid) => {
      const p = updatedPlates.find((up) => up.id === pid);
      return p?.activated ?? false;
    });
    updatedDoors.push({ id: doorId, open: allActivated });
  }

  return { plates: updatedPlates, doors: updatedDoors, playerDied, playerExited };
}
