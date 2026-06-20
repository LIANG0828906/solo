import { useGameStore, type Fragment, type EnergyNode } from '@/store/useGameStore';
import { SceneManager, type NodeObject } from './SceneManager';
import { playMatchSuccess, playMatchFail } from '@/utils/audio';
import { MATCH_DISTANCE_THRESHOLD, ANIMATION_SMOOTHNESS } from '@/utils/config';

export class NodeSystem {
  private sceneManager: SceneManager;
  private snapAnimations: Map<
    string,
    { from: [number, number, number]; to: [number, number, number]; progress: number }
  > = new Map();
  private errorFlashTimers: Map<string, number> = new Map();
  private burstTimers: Map<string, number> = new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  public handleDragStart(fragmentId: string): boolean {
    const store = useGameStore.getState();
    const fragment = store.fragments.find((f) => f.id === fragmentId);
    if (!fragment || fragment.isMatched) return false;
    store.startDrag(fragmentId);
    return true;
  }

  public handleDragMove(
    fragmentId: string,
    clientX: number,
    clientY: number,
    domRect: DOMRect
  ): void {
    const store = useGameStore.getState();
    if (store.draggingFragmentId !== fragmentId) return;

    const fragment = store.fragments.find((f) => f.id === fragmentId);
    if (!fragment) return;

    const worldPos = this.sceneManager.screenToWorld(clientX, clientY, domRect, 1.5);
    store.updateFragmentPosition(fragmentId, worldPos);
    store.addTrailPoint(worldPos, fragment.elementColor);
  }

  public handleDragEnd(fragmentId: string): void {
    const store = useGameStore.getState();
    if (store.draggingFragmentId !== fragmentId) {
      store.endDrag(fragmentId, false);
      return;
    }

    const fragment = store.fragments.find((f) => f.id === fragmentId);
    if (!fragment) {
      store.endDrag(fragmentId, false);
      return;
    }

    const matchResult = this.checkNodeCollision(fragment);

    if (matchResult.isMatch && matchResult.node) {
      this.triggerMatchSuccess(fragment, matchResult.node);
      store.endDrag(fragmentId, true, matchResult.node.id);
    } else {
      this.triggerMatchFail(fragment, matchResult.node);
      store.endDrag(fragmentId, false);
    }
  }

  public checkNodeCollision(fragment: Fragment): {
    node: NodeObject | null;
    distance: number;
    isMatch: boolean;
  } {
    const allNodes = this.sceneManager.getAllNodes();
    let nearestNode: NodeObject | null = null;
    let minDistance = Infinity;

    for (const nodeObj of allNodes) {
      if (nodeObj.data.isLit) continue;

      const distance = this.calculateDistance(
        fragment.position,
        nodeObj.data.position
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = nodeObj;
      }
    }

    const isMatch = this.verifyMatch(fragment, nearestNode, minDistance);

    return {
      node: nearestNode,
      distance: minDistance,
      isMatch,
    };
  }

  private calculateDistance(
    posA: [number, number, number],
    posB: [number, number, number]
  ): number {
    const dx = posA[0] - posB[0];
    const dy = posA[1] - posB[1];
    const dz = posA[2] - posB[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private verifyMatch(
    fragment: Fragment,
    node: NodeObject | null,
    distance: number
  ): boolean {
    if (!node) return false;
    if (node.data.isLit) return false;
    if (distance > MATCH_DISTANCE_THRESHOLD()) return false;
    if (fragment.elementColor !== node.data.acceptElement) return false;
    if (fragment.matchedNodeId !== node.data.id) return false;
    return true;
  }

  private triggerMatchSuccess(fragment: Fragment, node: NodeObject): void {
    const store = useGameStore.getState();

    playMatchSuccess();

    store.setFragmentMatched(fragment.id, node.data.id);
    store.triggerNodeBurst(node.data.id);

    this.sceneManager.lightUpNode(node.data.id);

    this.burstTimers.set(node.data.id, 0.5);
    setTimeout(() => {
      useGameStore.getState().clearNodeBurst();
    }, 500);

    setTimeout(() => {
      const currentState = useGameStore.getState();
      const allNodesLit = currentState.nodes.every((n) => n.isLit);
      if (allNodesLit) {
        this.triggerVoidRift();
      }
    }, 400);
  }

  private triggerMatchFail(fragment: Fragment, nearestNode: NodeObject | null): void {
    const store = useGameStore.getState();

    playMatchFail();

    this.snapAnimations.set(fragment.id, {
      from: [...fragment.position] as [number, number, number],
      to: [...fragment.originalPosition] as [number, number, number],
      progress: 0,
    });

    if (nearestNode) {
      store.setNodeError(nearestNode.data.id);
      this.sceneManager.setNodeError(nearestNode.data.id, true);
      this.errorFlashTimers.set(nearestNode.data.id, 0.5);

      setTimeout(() => {
        const state = useGameStore.getState();
        state.clearNodeError(nearestNode.data.id);
        this.sceneManager.setNodeError(nearestNode.data.id, false);
      }, 500);
    }
  }

  private triggerVoidRift(): void {
    const store = useGameStore.getState();
    store.showVoidRift();

    setTimeout(() => {
      useGameStore.getState().initMatrix();
    }, 1500);
  }

  public tick(dt: number): void {
    const store = useGameStore.getState();
    store.cullTrailPoints();

    const snapSpeed = 2 + ANIMATION_SMOOTHNESS() * 4;

    this.snapAnimations.forEach((anim, id) => {
      anim.progress += dt * snapSpeed;
      if (anim.progress >= 1) {
        store.updateFragmentPosition(id, anim.to);
        this.sceneManager.updateFragmentPosition(id, anim.to);
        this.snapAnimations.delete(id);
      } else {
        const t = anim.progress;
        const ease = 1 - Math.pow(1 - t, 3);
        const pos: [number, number, number] = [
          anim.from[0] + (anim.to[0] - anim.from[0]) * ease,
          anim.from[1] + (anim.to[1] - anim.from[1]) * ease,
          anim.from[2] + (anim.to[2] - anim.from[2]) * ease,
        ];
        store.updateFragmentPosition(id, pos);
        this.sceneManager.updateFragmentPosition(id, pos);
      }
    });

    this.burstTimers.forEach((time, id) => {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.burstTimers.delete(id);
      } else {
        this.burstTimers.set(id, newTime);
      }
    });

    this.errorFlashTimers.forEach((time, id) => {
      const newTime = time - dt;
      if (newTime <= 0) {
        this.errorFlashTimers.delete(id);
      } else {
        this.errorFlashTimers.set(id, newTime);
      }
    });
  }

  public getBurstProgress(nodeId: string): number {
    const time = this.burstTimers.get(nodeId);
    if (time === undefined) return 0;
    return 1 - time / 0.5;
  }

  public getErrorFlash(nodeId: string): number {
    const time = this.errorFlashTimers.get(nodeId);
    if (time === undefined) return 0;
    return time / 0.5;
  }

  public dispose(): void {
    this.snapAnimations.clear();
    this.errorFlashTimers.clear();
    this.burstTimers.clear();
  }
}
