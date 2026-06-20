import { v4 as uuidv4 } from 'uuid';
import type { StarNode, Fleet, Ship, Owner, ShipType } from '../types';
import { SHIP_CONFIGS, NODE_RADIUS } from '../types';

export interface AIDecision {
  fleetId: string;
  targetNodeId: string;
  action: 'move' | 'attack';
}

function getDistance(n1: StarNode, n2: StarNode): number {
  const dx = n1.x - n2.x;
  const dy = n1.y - n2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getNodeById(nodes: StarNode[], id: string): StarNode | undefined {
  return nodes.find((n) => n.id === id);
}

function getFleetsOnNode(fleets: Fleet[], nodeId: string, owner?: Owner): Fleet[] {
  return fleets.filter((f) => f.nodeId === nodeId && (owner === undefined || f.owner === owner));
}

function getFleetMoveRange(fleet: Fleet): number {
  if (fleet.ships.length === 0) return 0;
  return Math.min(...fleet.ships.map((s) => s.move));
}

function getFleetAttackRange(fleet: Fleet): number {
  if (fleet.ships.length === 0) return 0;
  return Math.max(...fleet.ships.map((s) => s.range));
}

function isNodeInRange(
  fromNode: StarNode,
  toNode: StarNode,
  range: number,
  nodes: StarNode[]
): boolean {
  const visited = new Set<string>();
  const queue: { nodeId: string; steps: number }[] = [{ nodeId: fromNode.id, steps: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const currentNode = getNodeById(nodes, current.nodeId);
    if (!currentNode) continue;

    if (current.nodeId === toNode.id && current.steps <= range) {
      return true;
    }

    if (current.steps < range) {
      for (const connId of currentNode.connections) {
        if (!visited.has(connId)) {
          queue.push({ nodeId: connId, steps: current.steps + 1 });
        }
      }
    }
  }

  return false;
}

function getNodesInRange(
  fromNode: StarNode,
  range: number,
  nodes: StarNode[]
): StarNode[] {
  const result: StarNode[] = [];
  const visited = new Set<string>();
  const queue: { nodeId: string; steps: number }[] = [{ nodeId: fromNode.id, steps: 0 }];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    const currentNode = getNodeById(nodes, current.nodeId);
    if (!currentNode) continue;

    if (current.steps > 0 && current.steps <= range) {
      result.push(currentNode);
    }

    if (current.steps < range) {
      for (const connId of currentNode.connections) {
        if (!visited.has(connId)) {
          queue.push({ nodeId: connId, steps: current.steps + 1 });
        }
      }
    }
  }

  return result;
}

function getFleetPower(fleet: Fleet): number {
  return fleet.ships.reduce((sum, s) => sum + s.attack + s.hp, 0);
}

export function makeAIDecision(
  nodes: StarNode[],
  fleets: Fleet[],
  aiFleet: Fleet
): AIDecision | null {
  if (aiFleet.ships.length === 0) return null;

  const currentNode = getNodeById(nodes, aiFleet.nodeId);
  if (!currentNode) return null;

  const moveRange = getFleetMoveRange(aiFleet);
  const attackRange = getFleetAttackRange(aiFleet);

  const playerFleets = fleets.filter((f) => f.owner === 'player' && f.ships.length > 0);
  const resourceNodes = nodes.filter((n) => n.type === 'resource');

  const aiPower = getFleetPower(aiFleet);

  const reachableNodes = getNodesInRange(currentNode, moveRange, nodes);

  for (const targetNode of reachableNodes) {
    const playerFleetsHere = getFleetsOnNode(playerFleets, targetNode.id);
    if (playerFleetsHere.length > 0) {
      const totalPlayerPower = playerFleetsHere.reduce((sum, f) => sum + getFleetPower(f), 0);
      if (aiPower > totalPlayerPower * 0.8) {
        return {
          fleetId: aiFleet.id,
          targetNodeId: targetNode.id,
          action: 'attack',
        };
      }
    }
  }

  for (const resourceNode of resourceNodes) {
    const fleetsOnResource = getFleetsOnNode(fleets, resourceNode.id, 'ai');
    if (fleetsOnResource.length === 0) {
      const nodesInMoveRange = getNodesInRange(currentNode, moveRange, nodes);
      let closestNode: StarNode | null = null;
      let minDist = Infinity;

      for (const n of nodesInMoveRange) {
        const dist = getDistance(n, resourceNode);
        if (dist < minDist) {
          minDist = dist;
          closestNode = n;
        }
      }

      if (closestNode && closestNode.id !== currentNode.id) {
        return {
          fleetId: aiFleet.id,
          targetNodeId: closestNode.id,
          action: 'move',
        };
      }
    }
  }

  const playerMothershipNode = nodes.find((n) => n.type === 'mothership_player');
  if (playerMothershipNode) {
    const nodesInMoveRange = getNodesInRange(currentNode, moveRange, nodes);
    let closestNode: StarNode | null = null;
    let minDist = Infinity;

    for (const n of nodesInMoveRange) {
      const dist = getDistance(n, playerMothershipNode);
      if (dist < minDist) {
        minDist = dist;
        closestNode = n;
      }
    }

    if (closestNode && closestNode.id !== currentNode.id) {
      return {
        fleetId: aiFleet.id,
        targetNodeId: closestNode.id,
        action: 'move',
      };
    }
  }

  return null;
}

export function executeAllAIActions(
  nodes: StarNode[],
  fleets: Fleet[]
): { decisions: AIDecision[] } {
  const aiFleets = fleets.filter((f) => f.owner === 'ai' && f.ships.length > 0);
  const decisions: AIDecision[] = [];

  let currentNodes = [...nodes];
  let currentFleets = [...fleets];

  for (const aiFleet of aiFleets) {
    const decision = makeAIDecision(currentNodes, currentFleets, aiFleet);
    if (decision) {
      decisions.push(decision);
      const fleetIdx = currentFleets.findIndex((f) => f.id === aiFleet.id);
      if (fleetIdx !== -1) {
        currentFleets[fleetIdx] = {
          ...currentFleets[fleetIdx],
          nodeId: decision.targetNodeId,
        };
      }
    }
  }

  return { decisions };
}
