import { v4 as uuidv4 } from 'uuid';
import type { NetworkNode } from '../types';

const NODE_NAMES: string[] = [
  '入口节点',
  '代理服务器',
  '数据库节点',
  '认证服务器',
  '核心数据库',
  '网关路由',
  '防火墙节点',
  '内部交换机',
  '终端节点',
  '备份服务器',
  '主服务器',
  '边缘节点',
  '负载均衡器',
  '加密节点',
  '控制中心',
];

export function generateNetwork(
  canvasWidth: number,
  canvasHeight: number
): {
  nodes: Map<string, NetworkNode>;
  entryId: string;
  targetId: string;
} {
  const nodes = new Map<string, NetworkNode>();
  const totalNodes = Math.floor(Math.random() * 5) + 6;

  const levels: number = Math.ceil(Math.sqrt(totalNodes));
  const nodesPerLevel: number[] = [];
  let remaining = totalNodes - 2;

  for (let i = 0; i < levels; i++) {
    if (i === 0) {
      nodesPerLevel.push(1);
    } else if (i === levels - 1) {
      nodesPerLevel.push(1);
    } else {
      const minForRemaining = levels - 1 - i;
      const maxForThis = Math.max(1, remaining - minForRemaining);
      const count = Math.min(maxForThis, Math.floor(Math.random() * 3) + 2);
      nodesPerLevel.push(count);
      remaining -= count;
    }
  }

  while (remaining > 0) {
    for (let i = 1; i < levels - 1 && remaining > 0; i++) {
      nodesPerLevel[i]++;
      remaining--;
    }
  }

  const usedNames = new Set<string>();
  const pickName = (): string => {
    const available = NODE_NAMES.filter((n) => !usedNames.has(n));
    const name = available[Math.floor(Math.random() * available.length)];
    usedNames.add(name);
    return name;
  };

  const getDefenseLevel = (defense: number): 'low' | 'medium' | 'high' => {
    if (defense < 40) return 'low';
    if (defense <= 70) return 'medium';
    return 'high';
  };

  const levelNodeIds: string[][] = [];
  let entryId = '';
  let targetId = '';

  for (let levelIdx = 0; levelIdx < levels; levelIdx++) {
    const count = nodesPerLevel[levelIdx];
    const levelIds: string[] = [];
    const ySpacing = canvasHeight / (levels + 1);
    const y = ySpacing * (levelIdx + 1);
    const xStart = 80;
    const xEnd = canvasWidth - 80;
    const xSpacing = count > 1 ? (xEnd - xStart) / (count - 1) : 0;

    const isEntry = levelIdx === 0;
    const isTarget = levelIdx === levels - 1;
    const defenseBase = 20 + (levelIdx / (levels - 1)) * 60;

    for (let j = 0; j < count; j++) {
      const id = uuidv4();
      const x = count === 1 ? (isEntry ? 80 : canvasWidth * 0.85) : xStart + xSpacing * j;
      const nodeY = isEntry ? canvasHeight * 0.2 : y;

      let defense: number;
      if (isTarget) {
        defense = Math.floor(Math.random() * 21) + 80;
      } else if (isEntry) {
        defense = 20;
      } else {
        const variation = Math.random() * 20 - 10;
        defense = Math.max(20, Math.min(100, Math.floor(defenseBase + variation)));
      }

      const node: NetworkNode = {
        id,
        name: isEntry ? '入口节点' : isTarget ? '核心数据库' : pickName(),
        x,
        y: nodeY,
        defense,
        parentId: null,
        childrenIds: [],
        status: isEntry ? 'entry' : 'locked',
        defenseLevel: getDefenseLevel(defense),
      };

      nodes.set(id, node);
      levelIds.push(id);

      if (isEntry) entryId = id;
      if (isTarget) targetId = id;
    }

    levelNodeIds.push(levelIds);
  }

  for (let levelIdx = 0; levelIdx < levels - 1; levelIdx++) {
    const currentLevel = levelNodeIds[levelIdx];
    const nextLevel = levelNodeIds[levelIdx + 1];

    if (nextLevel.length >= currentLevel.length) {
      const base = Math.floor(nextLevel.length / currentLevel.length);
      const extra = nextLevel.length % currentLevel.length;
      let nextIdx = 0;

      for (let i = 0; i < currentLevel.length; i++) {
        const childCount = base + (i < extra ? 1 : 0);
        const parent = nodes.get(currentLevel[i])!;

        for (let k = 0; k < childCount && nextIdx < nextLevel.length; k++) {
          const childId = nextLevel[nextIdx];
          const child = nodes.get(childId)!;
          parent.childrenIds.push(childId);
          child.parentId = currentLevel[i];
          nextIdx++;
        }
      }
    } else {
      let nextIdx = 0;
      for (let i = 0; i < currentLevel.length; i++) {
        const parent = nodes.get(currentLevel[i])!;
        if (nextIdx < nextLevel.length) {
          const childId = nextLevel[nextIdx];
          const child = nodes.get(childId)!;
          parent.childrenIds.push(childId);
          child.parentId = currentLevel[i];
          nextIdx++;
        }

        if (i === currentLevel.length - 1) {
          while (nextIdx < nextLevel.length) {
            const childId = nextLevel[nextIdx];
            const child = nodes.get(childId)!;
            parent.childrenIds.push(childId);
            child.parentId = currentLevel[i];
            nextIdx++;
          }
        }
      }
    }
  }

  return { nodes, entryId, targetId };
}
