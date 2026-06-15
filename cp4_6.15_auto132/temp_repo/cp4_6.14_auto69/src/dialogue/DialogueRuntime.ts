import type { DialogueTree, DialogueNode, DialogueBranch, ExpressionType, DialogueRuntimeState, Speaker } from '../types';
import { gameStateManager } from '../game/GameStateManager';

export type DialogueState = DialogueRuntimeState;
type TypingCallback = (state: DialogueState) => void;

class DialogueRuntime {
  private tree: DialogueTree | null = null;
  private state: DialogueState = {
    currentNodeId: null,
    displayedText: '',
    isTyping: false,
    availableBranches: [],
    currentExpression: 'default',
    currentSpeaker: null,
  };
  private typingSpeed: number = 80;
  private typingTimer: number | null = null;
  private fullText: string = '';
  private charIndex: number = 0;
  private listeners: Set<TypingCallback> = new Set();

  setTree(tree: DialogueTree): void {
    this.tree = tree;
  }

  getState(): DialogueState {
    return { ...this.state };
  }

  setTypingSpeed(speed: number): void {
    this.typingSpeed = Math.max(60, Math.min(500, speed));
  }

  getTypingSpeed(): number {
    return this.typingSpeed;
  }

  startDialogue(): void {
    if (!this.tree) return;
    this.navigateTo(this.tree.startNodeId);
  }

  navigateTo(nodeId: string): void {
    if (!this.tree) return;

    const node = this.tree.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    this.stopTyping();

    this.state.currentNodeId = nodeId;
    this.state.currentSpeaker = node.speaker;
    this.state.currentExpression = node.expression || 'default';
    this.state.displayedText = '';
    this.state.isTyping = true;
    this.fullText = node.text;
    this.charIndex = 0;

    this.state.availableBranches = this.getEligibleBranches(node);

    this.notifyListeners();
    this.startTyping();
  }

  private getEligibleBranches(node: DialogueNode): DialogueBranch[] {
    const eligible = node.branches.filter((branch) => {
      if (!branch.condition) return true;
      return gameStateManager.checkCondition(branch.condition);
    });

    eligible.sort((a, b) => {
      const priorityA = gameStateManager.getConditionPriority(a.condition);
      const priorityB = gameStateManager.getConditionPriority(b.condition);
      return priorityB - priorityA;
    });

    return eligible;
  }

  private startTyping(): void {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
    }

    this.typingTimer = window.setInterval(() => {
      if (this.charIndex < this.fullText.length) {
        this.state.displayedText = this.fullText.slice(0, this.charIndex + 1);
        this.charIndex++;
        this.notifyListeners();
      } else {
        this.stopTyping();
        this.state.isTyping = false;
        this.notifyListeners();
      }
    }, this.typingSpeed);
  }

  stopTyping(): void {
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
  }

  skipTyping(): void {
    if (!this.state.isTyping) return;
    this.stopTyping();
    this.state.displayedText = this.fullText;
    this.state.isTyping = false;
    this.notifyListeners();
  }

  selectBranch(branchId: string): void {
    if (this.state.isTyping) {
      this.skipTyping();
      return;
    }

    const branch = this.state.availableBranches.find((b) => b.id === branchId);
    if (branch) {
      this.navigateTo(branch.targetNodeId);
    }
  }

  subscribe(callback: TypingCallback): () => void {
    this.listeners.add(callback);
    callback(this.state);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    const state = { ...this.state };
    this.listeners.forEach((listener) => listener(state));
  }

  reset(): void {
    this.stopTyping();
    this.state = {
      currentNodeId: null,
      displayedText: '',
      isTyping: false,
      availableBranches: [],
      currentExpression: 'default',
      currentSpeaker: null,
    };
    this.notifyListeners();
  }

  getCurrentNode(): DialogueNode | null {
    if (!this.tree || !this.state.currentNodeId) return null;
    return this.tree.nodes.find((n) => n.id === this.state.currentNodeId) || null;
  }
}

export const dialogueRuntime = new DialogueRuntime();
export default DialogueRuntime;
