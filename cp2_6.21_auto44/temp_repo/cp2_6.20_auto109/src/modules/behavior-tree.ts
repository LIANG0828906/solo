import { v4 as uuidv4 } from 'uuid';

export type NodeType = 'condition' | 'sequence' | 'selector' | 'action';

export type ConditionType = 'target_in_range' | 'hp_below_30' | 'hp_below_50' | 'has_target' | 'enemy_nearby';

export type ActionType = 'move_to_target' | 'attack_target' | 'guard' | 'chase_nearest_enemy' | 'flee';

export interface BTNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  children?: string[];
  condition?: ConditionType;
  actionType?: ActionType;
  targetType?: 'nearest_enemy' | 'lowest_hp_enemy' | 'self';
}

export interface BehaviorTree {
  id: string;
  name: string;
  rootId: string | null;
  nodes: Record<string, BTNode>;
}

export type NodeStatus = 'success' | 'failure' | 'running';

export const NODE_CONFIGS: Record<NodeType, { name: string; color: string; hasChildren: boolean }> = {
  condition: { name: '条件节点', color: '#ffa940', hasChildren: false },
  sequence: { name: '序列节点', color: '#597ef7', hasChildren: true },
  selector: { name: '选择节点', color: '#73d13d', hasChildren: true },
  action: { name: '行动节点', color: '#f759ab', hasChildren: false },
};

export const CONDITION_OPTIONS: { value: ConditionType; label: string }[] = [
  { value: 'target_in_range', label: '目标在射程内' },
  { value: 'hp_below_30', label: '生命值低于30%' },
  { value: 'hp_below_50', label: '生命值低于50%' },
  { value: 'has_target', label: '存在目标' },
  { value: 'enemy_nearby', label: '敌人在附近' },
];

export const ACTION_OPTIONS: { value: ActionType; label: string }[] = [
  { value: 'move_to_target', label: '移动至目标' },
  { value: 'attack_target', label: '攻击目标' },
  { value: 'guard', label: '守卫当前位置' },
  { value: 'chase_nearest_enemy', label: '追击最近敌人' },
  { value: 'flee', label: '逃跑' },
];

export const TARGET_OPTIONS: { value: string; label: string }[] = [
  { value: 'nearest_enemy', label: '最近敌人' },
  { value: 'lowest_hp_enemy', label: '最低血量敌人' },
  { value: 'self', label: '自身' },
];

export function createNode(type: NodeType, position: { x: number; y: number }): BTNode {
  const config = NODE_CONFIGS[type];
  const id = uuidv4();

  const node: BTNode = {
    id,
    type,
    name: config.name,
    position,
  };

  if (config.hasChildren) {
    node.children = [];
  }

  if (type === 'condition') {
    node.condition = 'target_in_range';
  }

  if (type === 'action') {
    node.actionType = 'move_to_target';
    node.targetType = 'nearest_enemy';
  }

  return node;
}

export function createBehaviorTree(name: string): BehaviorTree {
  return {
    id: uuidv4(),
    name,
    rootId: null,
    nodes: {},
  };
}

export function serializeBehaviorTree(tree: BehaviorTree): string {
  return JSON.stringify(tree);
}

export function deserializeBehaviorTree(json: string): BehaviorTree {
  return JSON.parse(json) as BehaviorTree;
}

export function addChildNode(parentId: string, childId: string, tree: BehaviorTree): BehaviorTree {
  const parent = tree.nodes[parentId];
  if (!parent || !parent.children) {
    return tree;
  }

  const newNodes = { ...tree.nodes };
  const newParent = { ...parent, children: [...parent.children, childId] };
  newNodes[parentId] = newParent;

  return { ...tree, nodes: newNodes };
}

export function removeChildNode(parentId: string, childId: string, tree: BehaviorTree): BehaviorTree {
  const parent = tree.nodes[parentId];
  if (!parent || !parent.children) {
    return tree;
  }

  const newNodes = { ...tree.nodes };
  const newParent = {
    ...parent,
    children: parent.children.filter((id) => id !== childId),
  };
  newNodes[parentId] = newParent;

  return { ...tree, nodes: newNodes };
}

export function deleteNode(nodeId: string, tree: BehaviorTree): BehaviorTree {
  const newNodes = { ...tree.nodes };
  const node = newNodes[nodeId];

  if (!node) return tree;

  if (node.children && node.children.length > 0) {
    for (const childId of node.children) {
      const result = deleteNode(childId, { ...tree, nodes: newNodes });
      Object.assign(newNodes, result.nodes);
    }
  }

  delete newNodes[nodeId];

  for (const id of Object.keys(newNodes)) {
    const n = newNodes[id];
    if (n.children && n.children.includes(nodeId)) {
      newNodes[id] = {
        ...n,
        children: n.children.filter((cid) => cid !== nodeId),
      };
    }
  }

  let newRootId = tree.rootId;
  if (tree.rootId === nodeId) {
    newRootId = null;
  }

  return { ...tree, nodes: newNodes, rootId: newRootId };
}

export function updateNodePosition(
  nodeId: string,
  position: { x: number; y: number },
  tree: BehaviorTree
): BehaviorTree {
  const node = tree.nodes[nodeId];
  if (!node) return tree;

  const newNodes = { ...tree.nodes };
  newNodes[nodeId] = { ...node, position };

  return { ...tree, nodes: newNodes };
}

export function updateNodeProps(
  nodeId: string,
  props: Partial<BTNode>,
  tree: BehaviorTree
): BehaviorTree {
  const node = tree.nodes[nodeId];
  if (!node) return tree;

  const newNodes = { ...tree.nodes };
  newNodes[nodeId] = { ...node, ...props };

  return { ...tree, nodes: newNodes };
}

export interface ExecutionContext {
  unit: {
    id: string;
    hp: number;
    maxHp: number;
    position: { x: number; y: number };
    attackRange: number;
    team: 'red' | 'blue';
  };
  enemies: Array<{
    id: string;
    position: { x: number; y: number };
    hp: number;
    maxHp: number;
  }>;
  grid: {
    width: number;
    height: number;
    isPassable: (x: number, y: number) => boolean;
    getDistance: (x1: number, y1: number, x2: number, y2: number) => number;
  };
}

export function executeBehaviorTree(
  tree: BehaviorTree,
  context: ExecutionContext
): { action: ActionType | null; targetId: string | null; status: NodeStatus } {
  if (!tree.rootId || !tree.nodes[tree.rootId]) {
    return { action: null, targetId: null, status: 'failure' };
  }

  return executeNode(tree.rootId, tree, context);
}

function executeNode(
  nodeId: string,
  tree: BehaviorTree,
  context: ExecutionContext
): { action: ActionType | null; targetId: string | null; status: NodeStatus } {
  const node = tree.nodes[nodeId];
  if (!node) {
    return { action: null, targetId: null, status: 'failure' };
  }

  switch (node.type) {
    case 'sequence':
      return executeSequence(node, tree, context);
    case 'selector':
      return executeSelector(node, tree, context);
    case 'condition':
      return executeCondition(node, context);
    case 'action':
      return executeAction(node, context);
    default:
      return { action: null, targetId: null, status: 'failure' };
  }
}

function executeSequence(
  node: BTNode,
  tree: BehaviorTree,
  context: ExecutionContext
): { action: ActionType | null; targetId: string | null; status: NodeStatus } {
  if (!node.children || node.children.length === 0) {
    return { action: null, targetId: null, status: 'success' };
  }

  for (const childId of node.children) {
    const result = executeNode(childId, tree, context);
    if (result.status === 'failure') {
      return { action: null, targetId: null, status: 'failure' };
    }
    if (result.status === 'running' || result.action) {
      return result;
    }
  }

  return { action: null, targetId: null, status: 'success' };
}

function executeSelector(
  node: BTNode,
  tree: BehaviorTree,
  context: ExecutionContext
): { action: ActionType | null; targetId: string | null; status: NodeStatus } {
  if (!node.children || node.children.length === 0) {
    return { action: null, targetId: null, status: 'failure' };
  }

  for (const childId of node.children) {
    const result = executeNode(childId, tree, context);
    if (result.status === 'success') {
      return result;
    }
    if (result.status === 'running' || result.action) {
      return result;
    }
  }

  return { action: null, targetId: null, status: 'failure' };
}

function executeCondition(
  node: BTNode,
  context: ExecutionContext
): { action: ActionType | null; targetId: string | null; status: NodeStatus } {
  const condition = node.condition;
  if (!condition) {
    return { action: null, targetId: null, status: 'failure' };
  }

  let result = false;

  switch (condition) {
    case 'target_in_range': {
      const target = findNearestEnemy(context);
      if (target) {
        const dist = context.grid.getDistance(
          context.unit.position.x,
          context.unit.position.y,
          target.position.x,
          target.position.y
        );
        result = dist <= context.unit.attackRange;
      }
      break;
    }
    case 'hp_below_30':
      result = context.unit.hp / context.unit.maxHp < 0.3;
      break;
    case 'hp_below_50':
      result = context.unit.hp / context.unit.maxHp < 0.5;
      break;
    case 'has_target':
      result = context.enemies.length > 0;
      break;
    case 'enemy_nearby': {
      const target = findNearestEnemy(context);
      if (target) {
        const dist = context.grid.getDistance(
          context.unit.position.x,
          context.unit.position.y,
          target.position.x,
          target.position.y
        );
        result = dist <= 3;
      }
      break;
    }
    default:
      result = false;
  }

  return {
    action: null,
    targetId: null,
    status: result ? 'success' : 'failure',
  };
}

function executeAction(
  node: BTNode,
  context: ExecutionContext
): { action: ActionType | null; targetId: string | null; status: NodeStatus } {
  const actionType = node.actionType;
  if (!actionType) {
    return { action: null, targetId: null, status: 'failure' };
  }

  let targetId: string | null = null;

  if (node.targetType === 'nearest_enemy') {
    const target = findNearestEnemy(context);
    if (target) targetId = target.id;
  } else if (node.targetType === 'lowest_hp_enemy') {
    const target = findLowestHpEnemy(context);
    if (target) targetId = target.id;
  } else if (node.targetType === 'self') {
    targetId = context.unit.id;
  }

  return {
    action: actionType,
    targetId,
    status: 'success',
  };
}

function findNearestEnemy(
  context: ExecutionContext
): { id: string; position: { x: number; y: number }; hp: number; maxHp: number } | null {
  if (context.enemies.length === 0) return null;

  let nearest = context.enemies[0];
  let minDist = context.grid.getDistance(
    context.unit.position.x,
    context.unit.position.y,
    nearest.position.x,
    nearest.position.y
  );

  for (const enemy of context.enemies) {
    const dist = context.grid.getDistance(
      context.unit.position.x,
      context.unit.position.y,
      enemy.position.x,
      enemy.position.y
    );
    if (dist < minDist) {
      minDist = dist;
      nearest = enemy;
    }
  }

  return nearest;
}

function findLowestHpEnemy(
  context: ExecutionContext
): { id: string; position: { x: number; y: number }; hp: number; maxHp: number } | null {
  if (context.enemies.length === 0) return null;

  let lowest = context.enemies[0];

  for (const enemy of context.enemies) {
    if (enemy.hp < lowest.hp) {
      lowest = enemy;
    }
  }

  return lowest;
}
