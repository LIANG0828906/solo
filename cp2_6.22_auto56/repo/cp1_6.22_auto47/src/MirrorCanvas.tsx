import React, { useRef, useEffect, useCallback } from 'react';
import type { FaceMesh, Results } from '@mediapipe/face_mesh';
import type { Camera } from '@mediapipe/camera_utils';
import {
  extractFaceLandmarks,
  drawLandmarkPoints,
  drawMakeup,
  MakeupColors
} from './utils/faceDetection';

interface MirrorCanvasProps {
  makeup: MakeupColors;
  fadeOpacity: number;
  onFaceDetected?: (detected: boolean) => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const MirrorCanvas: React.FC<MirrorCanvasProps> = ({
  makeup,
  fadeOpacity,
  onFaceDetected,
  canvasRef
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const makeupRef = useRef<MakeupColors>(makeup);
  const fadeOpacityRef = useRef<number>(fadeOpacity);
  const hasFaceRef = useRef<boolean>(false);

  useEffect(() => {
    makeupRef.current = makeup;
  }, [makeup]);

  useEffect(() => {
    fadeOpacityRef.current = fadeOpacity;
  }, [fadeOpacity]);

  const onResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.translate(width, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(results.image, 0, 0, width, height);

    const landmarks = extractFaceLandmarks(results);

    if (landmarks) {
      if (!hasFaceRef.current) {
        hasFaceRef.current = true;
        onFaceDetected?.(true);
      }
      drawMakeup(ctx, landmarks, makeupRef.current, width, height, fadeOpacityRef.current);
      drawLandmarkPoints(ctx, landmarks, width, height);
    } else {
      if (hasFaceRef.current) {
        hasFaceRef.current = false;
        onFaceDetected?.(false);
      }
    }

    ctx.restore();
  }, [canvasRef, onFaceDetected]);

  useEffect(() => {
    let mounted = true;

    const initFaceMesh = async () => {
      if (!videoRef.current || !canvasRef.current) return;

      try {
        const { FaceMesh } = await import('@mediapipe/face_mesh');

        const faceMesh = new FaceMesh({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
          }
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults(onResults);
        faceMeshRef.current = faceMesh;

        const { Camera } = await import('@mediapipe/camera_utils');

        const camera = new Camera(videoRef.current, {
          onFrame: async () => {
            if (faceMeshRef.current && videoRef.current && mounted) {
              await faceMeshRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });

        camera.start();
        cameraRef.current = camera;
      } catch (error) {
        console.error('Failed to initialize FaceMesh:', error);
      }
    };

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = 640;
      canvas.height = 480;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    initFaceMesh();

    return () => {
      mounted = false;
      window.removeEventListener('resize', handleResize);
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [canvasRef, onResults]);

  return (
    <div style={styles.container}>
      <video ref={videoRef} style={styles.hiddenVideo} playsInline muted />
      <canvas ref={canvasRef} style={styles.canvas} />
      <div style={styles.borderGlow} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%'
  },
  hiddenVideo: {
    display: 'none'
  },
  canvas: {
    borderRadius: '20px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    zIndex: 1
  },
  borderGlow: {
    position: 'absolute',
    top: '-8px',
    left: '-8px',
    right: '-8px',
    bottom: '-8px',
    borderRadius: '28px',
    background: 'linear-gradient(135deg, #f8bbd9 0%, #e1bee7 50%, #ce93d8 100%)',
    zIndex: 0,
    animation: 'breathing 3s ease-in-out infinite',
    pointerEvents: 'none'
  }
};

export default MirrorCanvas;
