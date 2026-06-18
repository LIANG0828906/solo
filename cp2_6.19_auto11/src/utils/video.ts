import type { VideoMetadata } from '../types';

export const extractVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
    };

    const onError = () => {
      cleanup();
      reject(new Error('Failed to load video metadata'));
    };

    const onLoadedMetadata = () => {
      video.currentTime = Math.min(0.5, video.duration * 0.25);
    };

    const onSeeked = () => {
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 160 / video.videoWidth);
        canvas.width = video.videoWidth * scale;
        canvas.height = video.videoHeight * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);

        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          thumbnail,
        });
      } catch (e) {
        reject(e);
      } finally {
        cleanup();
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked, { once: true });
    video.addEventListener('error', onError);
  });
};

export const createVideoElement = (url: string): HTMLVideoElement => {
  const video = document.createElement('video');
  video.src = url;
  video.preload = 'auto';
  video.muted = false;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  return video;
};

export const getColorForMaterial = (index: number): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  ];
  return colors[index % colors.length];
};
