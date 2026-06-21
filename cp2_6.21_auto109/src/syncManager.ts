import { useAppStore } from './store';
import { SyncMessage, Highlight, Comment, User } from './types';

type PendingDiff = {
  type: 'highlight:add' | 'highlight:remove' | 'comment:add';
  payload: Highlight | Comment;
};

export class SyncManager {
  private channel: BroadcastChannel | null = null;
  private roomId: string = '';
  private pendingDiffs: PendingDiff[] = [];
  private broadcastTimer: number | null = null;
  private lastHighlightsLength = 0;
  private lastCommentsLength = 0;
  private unsubscribe: (() => void) | null = null;

  init(roomId: string) {
    this.roomId = roomId;
    this.channel = new BroadcastChannel(`highlight-collab-${roomId}`);

    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      this.handleRemoteMessage(event.data);
    };

    const state = useAppStore.getState();
    this.lastHighlightsLength = state.highlights.length;
    this.lastCommentsLength = state.comments.length;

    state.addUser(state.currentUser);
    this.broadcastUserJoin(state.currentUser);

    this.unsubscribe = useAppStore.subscribe((s) => this.onStoreChange(s));
  }

  private onStoreChange(state: ReturnType<typeof useAppStore.getState>) {
    if (this.roomId !== state.roomId) {
      this.roomId = state.roomId;
      this.reconnect();
    }

    if (state.highlights.length > this.lastHighlightsLength) {
      const newHighlight = state.highlights[state.highlights.length - 1];
      if (newHighlight.userId === state.currentUser.id) {
        this.enqueueDiff({ type: 'highlight:add', payload: newHighlight });
      }
    }
    this.lastHighlightsLength = state.highlights.length;

    if (state.comments.length > this.lastCommentsLength) {
      const newComment = state.comments[state.comments.length - 1];
      if (newComment.userId === state.currentUser.id) {
        this.enqueueDiff({ type: 'comment:add', payload: newComment });
      }
    }
    this.lastCommentsLength = state.comments.length;
  }

  private enqueueDiff(diff: PendingDiff) {
    this.pendingDiffs.push(diff);
    this.scheduleBroadcast();
  }

  private scheduleBroadcast() {
    if (this.broadcastTimer !== null) return;
    this.broadcastTimer = window.setTimeout(() => {
      this.flushPending();
      this.broadcastTimer = null;
    }, 100);
  }

  private flushPending() {
    if (!this.channel || this.pendingDiffs.length === 0) return;
    const state = useAppStore.getState();
    for (const diff of this.pendingDiffs) {
      const msg: SyncMessage = {
        type: diff.type,
        payload: diff.payload,
        roomId: this.roomId,
        senderId: state.currentUser.id,
        timestamp: Date.now(),
      };
      this.channel.postMessage(msg);
    }
    this.pendingDiffs = [];
  }

  private handleRemoteMessage(msg: SyncMessage) {
    if (msg.roomId !== this.roomId) return;
    const state = useAppStore.getState();
    if (msg.senderId === state.currentUser.id) return;

    switch (msg.type) {
      case 'highlight:add':
        state.addHighlightFromRemote(msg.payload as Highlight);
        break;
      case 'comment:add':
        state.addCommentFromRemote(msg.payload as Comment);
        break;
      case 'user:join': {
        const user = msg.payload as User;
        state.addUser(user);
        this.broadcastUserJoin(state.currentUser);
        break;
      }
      case 'user:leave':
        state.removeUser((msg.payload as User).id);
        break;
    }
  }

  private broadcastUserJoin(user: User) {
    if (!this.channel) return;
    const msg: SyncMessage = {
      type: 'user:join',
      payload: user,
      roomId: this.roomId,
      senderId: user.id,
      timestamp: Date.now(),
    };
    this.channel.postMessage(msg);
  }

  private reconnect() {
    if (this.channel) {
      this.channel.close();
    }
    this.channel = new BroadcastChannel(`highlight-collab-${this.roomId}`);
    this.channel.onmessage = (event: MessageEvent<SyncMessage>) => {
      this.handleRemoteMessage(event.data);
    };
    const state = useAppStore.getState();
    this.broadcastUserJoin(state.currentUser);
  }

  destroy() {
    if (this.broadcastTimer !== null) {
      clearTimeout(this.broadcastTimer);
      this.broadcastTimer = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const syncManager = new SyncManager();
