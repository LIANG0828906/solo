import type { ImageData, ClusterGroup } from './types';
import { clusterImages } from './imageProcessor';

self.onmessage = (e: MessageEvent) => {
  const { images, threshold } = e.data as { images: ImageData[]; threshold: number };
  const clusters = clusterImages(images, threshold);
  self.postMessage({ clusters });
};

export {};
