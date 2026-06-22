import type {
  NodeStatus,
  TreeNodeData,
  Connection,
  EnvironmentState,
  CharacterState,
  ConditionOperator,
  ActionType,
} from '@/types/behaviorTree';

export class BehaviorTreeEngine {
  private nodes: TreeNodeData[];
  private connections: Connection[];

  constructor(nodes: TreeNodeData[] = [], connections: Connection[] = []) {
    this.nodes = nodes;
    this.connections = connections;
  }

  private getChildren(nodeId: string): string[] {
    return this.connections
      .filter((conn) => conn.fromNodeId === nodeId)
      .sort((a, b) => {
        const nodeA = this.nodes.find((n) => n.id === a.toNodeId);
        const nodeB = this.nodes.find((n) => n.id === b.toNodeId);
        return (nodeA?.y ?? 0) - (nodeB?.y ?? 0);
      })
      .map((conn) => conn.toNodeId);
  }

  private evaluateCondition(node: TreeNodeData, env: EnvironmentState): boolean {
    const { conditionType, operator, value } = node.properties as {
      conditionType: 'playerDistance' | 'health' | 'hasCover';
      operator: ConditionOperator;
      value: number | boolean;
    };

    let actualValue: number | boolean;
    switch (conditionType) {
      case 'playerDistance':
        actualValue = env.playerDistance;
        break;
      case 'health':
        actualValue = env.health;
        break;
      case 'hasCover':
        actualValue = env.hasCover;
        break;
      default:
        return false;
    }

    if (conditionType === 'hasCover') {
      return actualValue === value;
    }

    const numActual = actualValue as number;
    const numValue = value as number;

    switch (operator) {
      case 'lt':
        return numActual < numValue;
      case 'lte':
        return numActual <= numValue;
      case 'gt':
        return numActual > numValue;
      case 'gte':
        return numActual >= numValue;
      case 'eq':
        return numActual === numValue;
      default:
        return false;
    }
  }

  private executeAction(
    node: TreeNodeData,
    env: EnvironmentState,
    char: CharacterState
  ): { status: NodeStatus; charState: Partial<CharacterState> } {
    const { actionType, target, speed } = node.properties as {
      actionType: ActionType;
      target?: { x: number; z: number };
      speed?: number;
    };

    const moveSpeed = speed ?? 1;

    switch (actionType) {
      case 'move': {
        const dx = (target?.x ?? 0) - char.position.x;
        const dz = (target?.z ?? 0) - char.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < 0.1) {
          return {
            status: 'success',
            charState: {
              position: { x: target?.x ?? char.position.x, z: target?.z ?? char.position.z },
              action: 'idle',
            },
          };
        }

        const normalizedDx = dx / dist;
        const normalizedDz = dz / dist;

        return {
          status: 'running',
          charState: {
            position: {
              x: char.position.x + normalizedDx * moveSpeed,
              z: char.position.z + normalizedDz * moveSpeed,
            },
            rotation: Math.atan2(normalizedDx, normalizedDz),
            action: 'move',
          },
        };
      }
      case 'attack':
        return {
          status: 'success',
          charState: {
            action: 'attack',
          },
        };
      case 'hide':
        return {
          status: 'success',
          charState: {
            isCrouching: true,
            action: 'hide',
          },
        };
      case 'idle':
        return {
          status: 'success',
          charState: {
            action: 'idle',
          },
        };
      default:
        return {
          status: 'failure',
          charState: {},
        };
    }
  }

  public tick(
    nodeId: string,
    env: EnvironmentState,
    char: CharacterState
  ): { status: NodeStatus; executionPath: string[]; charState: Partial<CharacterState> } {
    const executionPath: string[] = [nodeId];
    const node = this.nodes.find((n) => n.id === nodeId);

    if (!node) {
      return { status: 'failure', executionPath, charState: {} };
    }

    const children = this.getChildren(nodeId);

    switch (node.type) {
      case 'selector': {
        for (const childId of children) {
          const result = this.tick(childId, env, char);
          executionPath.push(...result.executionPath);
          if (result.status === 'success') {
            return { status: 'success', executionPath, charState: result.charState };
          }
          if (result.status === 'running') {
            return { status: 'running', executionPath, charState: result.charState };
          }
        }
        return { status: 'failure', executionPath, charState: {} };
      }

      case 'sequence': {
        let combinedCharState: Partial<CharacterState> = {};
        for (const childId of children) {
          const currentChar: CharacterState = { ...char, ...combinedCharState };
          const result = this.tick(childId, env, currentChar);
          executionPath.push(...result.executionPath);
          combinedCharState = { ...combinedCharState, ...result.charState };
          if (result.status === 'failure') {
            return { status: 'failure', executionPath, charState: combinedCharState };
          }
          if (result.status === 'running') {
            return { status: 'running', executionPath, charState: combinedCharState };
          }
        }
        return { status: 'success', executionPath, charState: combinedCharState };
      }

      case 'condition': {
        const success = this.evaluateCondition(node, env);
        return {
          status: success ? 'success' : 'failure',
          executionPath,
          charState: {},
        };
      }

      case 'action': {
        const result = this.executeAction(node, env, char);
        return {
          status: result.status,
          executionPath,
          charState: result.charState,
        };
      }

      default:
        return { status: 'failure', executionPath, charState: {} };
    }
  }

  public setNodes(nodes: TreeNodeData[]): void {
    this.nodes = nodes;
  }

  public setConnections(connections: Connection[]): void {
    this.connections = connections;
  }
}

export const behaviorTreeEngine = new BehaviorTreeEngine();
export default BehaviorTreeEngine;
