import type { Pixel, CollabMessage } from '../pixelBoard/types';
import { usePixelStore } from '../pixelBoard/store';

export class SyncManager {
  private userId: string;
  private onPixelAdded: ((pixel: Pixel, isRemote: boolean) => void) | null = null;
  private onPixelRemoved: ((pixelId: string, isRemote: boolean) => void) | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  setOnPixelAdded(callback: (pixel: Pixel, isRemote: boolean) => void): void {
    this.onPixelAdded = callback;
  }

  setOnPixelRemoved(callback: (pixelId: string, isRemote: boolean) => void): void {
    this.onPixelRemoved = callback;
  }

  syncPixels(pixel: Pixel, senderId: string): void {
    if (senderId === this.userId) return;

    const store = usePixelStore.getState();
    const existingPixel = store.pixels.find(
      (p) => p.x === pixel.x && p.y === pixel.y
    );

    if (existingPixel && pixel.timestamp <= existingPixel.timestamp) {
      return;
    }

    const newPixel = { ...pixel, ownerId: senderId };
    store.addRemotePixel(newPixel);
    
    if (this.onPixelAdded) {
      this.onPixelAdded(newPixel, true);
    }
  }

  syncUndo(pixelId: string, senderId: string): void {
    if (senderId === this.userId) return;

    const store = usePixelStore.getState();
    const pixel = store.pixels.find((p) => p.id === pixelId);
    
    if (pixel && pixel.ownerId === senderId) {
      store.removePixelById(pixelId);
      if (this.onPixelRemoved) {
        this.onPixelRemoved(pixelId, true);
      }
    }
  }

  handleSyncResponse(pixels: Pixel[], senderId: string): void {
    if (senderId === this.userId) return;

    const store = usePixelStore.getState();
    const localPixels = [...store.pixels];
    
    const mergedMap = new Map<string, Pixel>();
    
    for (const pixel of localPixels) {
      const key = `${pixel.x}-${pixel.y}`;
      mergedMap.set(key, pixel);
    }
    
    for (const pixel of pixels) {
      const key = `${pixel.x}-${pixel.y}`;
      const existing = mergedMap.get(key);
      if (!existing || pixel.timestamp > existing.timestamp) {
        mergedMap.set(key, { ...pixel, ownerId: senderId });
      }
    }
    
    const mergedPixels = Array.from(mergedMap.values());
    store.setPixels(mergedPixels);
  }

  handleSyncRequest(senderId: string): Pixel[] {
    if (senderId === this.userId) return [];
    return usePixelStore.getState().pixels;
  }

  handleMessage(message: CollabMessage): void {
    switch (message.type) {
      case 'PIXEL_ADD':
        if (message.pixel) {
          this.syncPixels(message.pixel, message.senderId);
        }
        break;
      case 'PIXEL_UNDO':
        if (message.pixelId) {
          this.syncUndo(message.pixelId, message.senderId);
        }
        break;
      case 'SYNC_REQUEST':
        {
          const pixels = this.handleSyncRequest(message.senderId);
          if (pixels.length > 0) {
            this.broadcastSyncResponse(pixels, message.senderId);
          }
        }
        break;
      case 'SYNC_RESPONSE':
        if (message.pixels) {
          this.handleSyncResponse(message.pixels, message.senderId);
        }
        break;
    }
  }

  broadcastPixel(pixel: Pixel): CollabMessage {
    return {
      type: 'PIXEL_ADD',
      senderId: this.userId,
      pixel,
      timestamp: Date.now(),
    };
  }

  broadcastUndo(pixelId: string): CollabMessage {
    return {
      type: 'PIXEL_UNDO',
      senderId: this.userId,
      pixelId,
      timestamp: Date.now(),
    };
  }

  broadcastSyncRequest(): CollabMessage {
    return {
      type: 'SYNC_REQUEST',
      senderId: this.userId,
      timestamp: Date.now(),
    };
  }

  broadcastSyncResponse(pixels: Pixel[], _targetId: string): CollabMessage {
    return {
      type: 'SYNC_RESPONSE',
      senderId: this.userId,
      pixels,
      timestamp: Date.now(),
    };
  }

  broadcastUserJoin(): CollabMessage {
    return {
      type: 'USER_JOIN',
      senderId: this.userId,
      timestamp: Date.now(),
    };
  }

  broadcastUserLeave(): CollabMessage {
    return {
      type: 'USER_LEAVE',
      senderId: this.userId,
      timestamp: Date.now(),
    };
  }
}

export function createSyncManager(userId: string): SyncManager {
  return new SyncManager(userId);
}
