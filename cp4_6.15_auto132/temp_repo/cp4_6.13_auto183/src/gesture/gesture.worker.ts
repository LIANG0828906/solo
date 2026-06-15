import Hands from '@mediapipe/hands';
import type { GestureData, GestureType, Landmark, WorkerMessage } from '@/types';

let hands: Hands | null = null;
let lastLandmarks: Landmark[] = [];
let lastTime: number = 0;

function classifyGesture(landmarks: Landmark[]): GestureType {
  const fingerTips = [4, 8, 12, 16, 20];
  const palm = landmarks[0];
  
  const distances = fingerTips.map(tip => {
    const dx = landmarks[tip].x - palm.x;
    const dy = landmarks[tip].y - palm.y;
    const dz = landmarks[tip].z - palm.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  });

  const allOpen = distances.every(d => d > 0.15);
  const allClosed = distances.every(d => d < 0.08);
  const indexOpen = distances[1] > 0.12;
  const othersClosed = distances[2] < 0.08 && distances[3] < 0.08 && distances[4] < 0.08;
  
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const thumbIndexDist = Math.sqrt(
    Math.pow(thumbTip.x - indexTip.x, 2) +
    Math.pow(thumbTip.y - indexTip.y, 2) +
    Math.pow(thumbTip.z - indexTip.z, 2)
  );
  const restFingersOpen = distances[2] > 0.15 && distances[3] > 0.15 && distances[4] > 0.15;

  if (thumbIndexDist < 0.05 && restFingersOpen) {
    return 'ok';
  }
  if (allOpen) {
    return 'open_palm';
  }
  if (allClosed) {
    return 'fist';
  }
  if (indexOpen && othersClosed) {
    return 'pointing';
  }
  return 'none';
}

function calculateDistance(landmarks: Landmark[]): number {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const pixelDistance = Math.sqrt(
    Math.pow(wrist.x - middleMcp.x, 2) +
    Math.pow(wrist.y - middleMcp.y, 2) +
    Math.pow(wrist.z - middleMcp.z, 2)
  );
  return 200 / pixelDistance;
}

function calculateVelocity(landmarks: Landmark[], dt: number): { x: number; y: number } {
  if (lastLandmarks.length === 0 || dt === 0) {
    return { x: 0, y: 0 };
  }
  const palm = landmarks[0];
  const lastPalm = lastLandmarks[0];
  return {
    x: (palm.x - lastPalm.x) / dt,
    y: (palm.y - lastPalm.y) / dt
  };
}

function calculateIndexDirection(landmarks: Landmark[]): { x: number; y: number } {
  const indexTip = landmarks[8];
  const palm = landmarks[0];
  const dx = indexTip.x - palm.x;
  const dy = indexTip.y - palm.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  return {
    x: dx / length,
    y: dy / length
  };
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  if (message.type === 'init') {
    hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });
    
    hands.setOptions({
      modelComplexity: 1,
      maxNumHands: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      let gestureData: GestureData;

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0] as Landmark[];
        const gesture = classifyGesture(landmarks);
        const palmDistance = calculateDistance(landmarks);
        const handVelocity = calculateVelocity(landmarks, dt);
        const indexDirection = calculateIndexDirection(landmarks);

        lastLandmarks = landmarks;

        gestureData = {
          landmarks,
          gesture,
          palmDistance,
          handVelocity,
          indexDirection,
          detected: true
        };
      } else {
        lastLandmarks = [];
        gestureData = {
          landmarks: [],
          gesture: 'none',
          palmDistance: 0,
          handVelocity: { x: 0, y: 0 },
          indexDirection: { x: 0, y: 0 },
          detected: false
        };
      }

      self.postMessage({ type: 'gestureData', data: gestureData });
    });

    await hands.initialize();
    self.postMessage({ type: 'ready' });
  }
};
