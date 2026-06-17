import { v4 as uuidv4 } from 'uuid';

export function generateQRData(bookingId: string): string {
  const payload = {
    bookingId,
    issuedAt: Date.now(),
    nonce: uuidv4().slice(0, 8),
  };
  return `zhixuan-library://booking/${encodeURIComponent(JSON.stringify(payload))}`;
}

export function scheduleIdleQR(callback: () => void): void {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 50);
  }
}
