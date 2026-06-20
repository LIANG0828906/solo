import type { Block, User } from '../stores/editorStore';

export interface LockInfo {
  blockId: string;
  userId: string;
  timestamp: number;
}

class CollaborationService {
  private locks: Map<string, LockInfo> = new Map();
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  canEditBlock(block: Block, userId: string): boolean {
    if (!block.lockedBy) return true;
    return block.lockedBy === userId;
  }

  isBlockLockedByOther(block: Block, userId: string): boolean {
    return !!block.lockedBy && block.lockedBy !== userId;
  }

  getEditingUser(users: User[], block: Block): User | undefined {
    if (!block.lockedBy) return undefined;
    return users.find((u) => u.id === block.lockedBy);
  }

  getBlocksBeingEditedByUser(blocks: Block[], userId: string): Block[] {
    return blocks.filter((b) => b.lockedBy === userId);
  }

  simulateOtherUserEditing(
    blockId: string,
    users: User[],
    onLock: (blockId: string, userId: string) => void,
    onUnlock: (blockId: string) => void,
    onSetEditing: (userId: string, blockId: string | null) => void
  ) {
    const otherOnlineUsers = users.filter((u) => u.online && u.id !== 'user-1');
    if (otherOnlineUsers.length === 0) return;

    const randomUser = otherOnlineUsers[Math.floor(Math.random() * otherOnlineUsers.length)];
    onLock(blockId, randomUser.id);
    onSetEditing(randomUser.id, blockId);

    setTimeout(() => {
      onUnlock(blockId);
      onSetEditing(randomUser.id, null);
    }, 3000 + Math.random() * 2000);
  }
}

export const collaborationService = new CollaborationService();
