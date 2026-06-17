import { usePixelStore } from './store';
import { eventBus } from './EventBus';

class AnimatorClass {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly FPS = 5;
  private readonly TRANSITION_MS = 200;

  play(): void {
    const store = usePixelStore.getState();
    if (store.isPlaying) return;
    if (store.frames.length < 2) return;

    store.setPlaying(true);
    store.setCurrentFrameIndex(0);
    store.setPlayProgress(0);

    const frameDuration = 1000 / this.FPS;

    this.intervalId = setInterval(() => {
      const currentStore = usePixelStore.getState();
      const nextIndex = currentStore.currentFrameIndex + 1;

      if (nextIndex >= currentStore.frames.length) {
        this.stop();
        return;
      }

      currentStore.setCurrentFrameIndex(nextIndex);
      const progress = Math.round((nextIndex / (currentStore.frames.length - 1)) * 100);
      currentStore.setPlayProgress(progress);
      eventBus.emit('frame:change', nextIndex);
    }, frameDuration);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.transitionTimeoutId) {
      clearTimeout(this.transitionTimeoutId);
      this.transitionTimeoutId = null;
    }
    const store = usePixelStore.getState();
    store.setPlaying(false);
    store.setPlayProgress(0);
    eventBus.emit('play:stop');
  }

  toggle(): void {
    const store = usePixelStore.getState();
    if (store.isPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }

  goToFrame(index: number): void {
    const store = usePixelStore.getState();
    if (index >= 0 && index < store.frames.length) {
      store.setCurrentFrameIndex(index);
    }
  }

  isPlaying(): boolean {
    return usePixelStore.getState().isPlaying;
  }

  getTransitionDuration(): number {
    return this.TRANSITION_MS;
  }
}

export const animator = new AnimatorClass();
