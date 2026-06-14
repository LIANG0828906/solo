import type { DialogueTree, DialogueNode } from '../types';
import { NODE_WIDTH } from '../types';

export function safeStringify(obj: unknown, space = 2): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    obj,
    (_key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    },
    space
  );
}

export function exportToJson(tree: DialogueTree): string {
  return safeStringify(tree, 2);
}

export function downloadJsonFile(content: string, filename = 'dialogue-tree.json'): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importFromJson(jsonStr: string): DialogueTree {
  const parsed = JSON.parse(jsonStr) as DialogueTree;
  if (!parsed || !Array.isArray(parsed.characters) || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.connections)) {
    throw new Error('无效的对话树JSON文件');
  }
  return parsed;
}

export function readJsonFile(file: File): Promise<DialogueTree> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const tree = importFromJson(text);
        resolve(tree);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

export function autoLayoutNodes(
  tree: DialogueTree,
  canvasWidth: number,
  canvasHeight: number
): DialogueNode[] {
  const { nodes, connections, rootNodeId } = tree;
  if (nodes.length === 0) return nodes;

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const incoming = new Map<string, number>();
  nodes.forEach((n) => incoming.set(n.id, 0));
  connections.forEach((c) => {
    if (incoming.has(c.targetId)) {
      incoming.set(c.targetId, (incoming.get(c.targetId) || 0) + 1);
    }
  });

  const levels = new Map<string, number>();
  const queue: string[] = [];
  nodes.forEach((n) => {
    if ((incoming.get(n.id) || 0) === 0) {
      levels.set(n.id, 0);
      queue.push(n.id);
    }
  });
  if (rootNodeId && !levels.has(rootNodeId)) {
    levels.set(rootNodeId, 0);
    queue.push(rootNodeId);
  }

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curLevel = levels.get(cur) || 0;
    connections
      .filter((c) => c.sourceId === cur)
      .forEach((c) => {
        const t = c.targetId;
        const existing = levels.get(t);
        if (existing === undefined || existing < curLevel + 1) {
          levels.set(t, curLevel + 1);
          queue.push(t);
        }
      });
  }

  nodes.forEach((n) => {
    if (!levels.has(n.id)) {
      levels.set(n.id, 0);
    }
  });

  const maxLevel = Math.max(...Array.from(levels.values()));
  const levelNodes = new Map<number, DialogueNode[]>();
  for (let l = 0; l <= maxLevel; l++) {
    levelNodes.set(l, nodes.filter((n) => levels.get(n.id) === l));
  }

  const levelGap = NODE_WIDTH + 140;
  const nodeGap = 60;
  const nodeHeight = 200;

  const levelWidths = Array.from(levelNodes.values()).map(
    (arr) => arr.length * NODE_WIDTH + Math.max(0, arr.length - 1) * nodeGap
  );
  const totalWidth = Math.max(...levelWidths, 200);
  const totalHeight = (maxLevel + 1) * nodeHeight + maxLevel * nodeGap;

  const offsetX = Math.max(40, (canvasWidth - totalWidth) / 2);
  const offsetY = Math.max(40, (canvasHeight - totalHeight) / 2);

  return nodes.map((n) => {
    const lvl = levels.get(n.id) || 0;
    const arr = levelNodes.get(lvl) || [];
    const idx = arr.findIndex((x) => x.id === n.id);
    const lvlWidth = levelWidths[lvl] || 0;
    const lvlOffsetX = offsetX + (totalWidth - lvlWidth) / 2;
    const x = lvlOffsetX + idx * (NODE_WIDTH + nodeGap);
    const y = offsetY + lvl * (nodeHeight + nodeGap);
    return { ...nodeMap.get(n.id)!, x, y };
  });
}
