import type { Star, Lens, VirtualImage } from './core';
import { generateVirtualImages } from './core';

interface WorkerRequest {
  id: number;
  stars: Star[];
  lens: Lens;
}

interface WorkerResponse {
  id: number;
  virtualImages: VirtualImage[];
  timestamp: number;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, stars, lens } = e.data;

  const startTime = performance.now();
  const virtualImages = generateVirtualImages(stars, lens);
  const endTime = performance.now();

  const response: WorkerResponse = {
    id,
    virtualImages,
    timestamp: endTime
  };

  self.postMessage(response);
  console.debug(`[LensWorker] Computed ${virtualImages.length} images in ${(endTime - startTime).toFixed(1)}ms`);
};

export {};
