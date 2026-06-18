import { getPendingCapsules, updateCapsuleStatus } from '../data/capsuleData.js';
import { Capsule } from '../../shared/types.js';

let intervalId: NodeJS.Timeout | null = null;
const listeners: Set<(capsules: Capsule[]) => void> = new Set();

export function startScheduler() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    const now = Date.now();
    const pending = getPendingCapsules();
    const newlyOpened: Capsule[] = [];

    for (const capsule of pending) {
      if (capsule.openAt <= now) {
        const updated = updateCapsuleStatus(capsule.id, 'opened');
        if (updated) {
          newlyOpened.push(updated);
        }
      }
    }

    if (newlyOpened.length > 0) {
      notifyListeners(newlyOpened);
    }
  }, 1000);
}

export function stopScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function addListener(callback: (capsules: Capsule[]) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(capsules: Capsule[]) {
  listeners.forEach((cb) => {
    try {
      cb(capsules);
    } catch (e) {
      console.error('Scheduler listener error:', e);
    }
  });
}
