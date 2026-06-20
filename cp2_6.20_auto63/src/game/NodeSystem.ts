import { useGameStore, type Fragment, type EnergyNode } from '@/store/useGameStore';
import { SceneManager } from './SceneManager';
import { playMatchSuccess, playMatchFail } from '@/utils/audio';

export class NodeSystem {
  private sceneManager: SceneManager;
  private snapAnimations: Map<string, { from: [number, number, number]; to: [number, number, number]; progress: number }> = new Map();
  private errorFlashTimers: Map<string, number> = new Map();
  private burstTimers: Map<string, number> = new Map();

  constructor(sceneManager: SceneManager) {
    this.sceneManager = sceneManager;
  }

  public handleDragStart(fragmentId: string) {
    const store = useGameStore.getState();
    const fragment = store.fragments.find((f) => f.id === fragmentId);
    if (!fragment || fragment.isMatched) return;
    store.startDrag(fragmentId);
  }

  public handleDragMove(
    fragmentId: string,
    clientX: number,
    clientY: number,
    domRect: DOMRect
  ) {
    const store = useGameStore.getState();
    if (store.draggingFragmentId !== fragmentId) return;

    const fragment = store.fragments.find((f) => f.id === fragmentId);
    if (!fragment) return;

    const worldPos = this.sceneManager.screenToWorld(clientX, clientY, domRect, 1.5);
    store.updateFragmentPosition(fragmentId, worldPos);
    store.addTrailPoint(worldPos, fragment.elementColor);
  }

  public handleDragEnd(fragmentId: string) {
    const store = useGameStore.getState();
    if (store.draggingFragmentId !== fragmentId) return;

    const fragment = store.fragments.find((f) => f.id === fragmentId);
    if (!fragment) {
      store.endDrag(fragmentId);
      return;
    }

    const result = this.sceneManager.findNearestNode(fragment.position, fragment);

    if (result.isMatch && result.node) {
      this.onMatchSuccess(fragment, result.node);
    } else {
      this.onMatchFail(fragment, result.node);
    }

    store.endDrag(fragmentId);
  }

  private onMatchSuccess(fragment: Fragment, node: EnergyNode) {
    const store = useGameStore.getState();
    playMatchSuccess();
    store.setFragmentMatched(fragment.id, node.id);
    store.triggerNodeBurst(node.id);
    this.sceneManager.updateNodeLight(node.id, true);

    this.burstTimers.set(node.id, 0.5);
    setTimeout(() => {
      useGameStore.getState().clearNodeBurst();
    }, 500);

    setTimeout(() => {
      const s = useGameStore.getState();
      const allLit = s.nodes.every((n) => n.isLit);
      if (allLit) {
        s.showVoidRift();
        setTimeout(() => {
          useGameStore.getState().initMatrix();
        }, 1500);
      }
    }, 300);
  }

  private onMatchFail(fragment: Fragment, nearestNode: EnergyNode | null) {
    const store = useGameStore.getState();
    playMatchFail();

    this.snapAnimations.set(fragment.id, {
      from: [...fragment.position] as [number, number, number],
      to: [...fragment.originalPosition] as [number, number, number],
      progress: 0,
    });

    if (nearestNode) {
      store.setNodeError(nearestNode.id);
      this.errorFlashTimers.set(nearestNode.id, 0.5);
      setTimeout(() => {
        useGameStore.getState().clearNodeError(nearestNode.id);
      }, 500);
    }
  }

  public tick(dt: number) {
    const store = useGameStore.getState();
    store.cullTrailPoints();

    this.snapAnimations.forEach((anim, id) => {
      anim.progress += dt * 3;
      if (anim.progress >= 1) {
        store.updateFragmentPosition(id, anim.to);
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

  public dispose() {
    this.snapAnimations.clear();
    this.errorFlashTimers.clear();
    this.burstTimers.clear();
  }
}
