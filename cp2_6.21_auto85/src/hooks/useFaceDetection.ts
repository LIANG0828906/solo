import { useState, useEffect, useRef, useCallback } from 'react';
import {
  createDetector,
  SupportedModels,
  MediaPipeFaceMeshTfjsModelConfig,
} from '@tensorflow-models/face-landmarks-detection';
import type { FaceLandmarksDetector, Face } from '@tensorflow-models/face-landmarks-detection';
import '@tensorflow/tfjs';
import type { Point2D } from '../types';

interface FaceDetectionResult {
  keypoints: Point2D[];
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  fps: number;
  modelLoadTime: number | null;
  loadTimeWithinLimit: boolean | null;
}

const MODEL_LOAD_TIME_LIMIT = 5000;

export function useFaceDetection(): FaceDetectionResult & {
  detectFace: (videoOrImage: HTMLVideoElement | HTMLImageElement) => Promise<void>;
  currentKeypoints: Point2D[];
} {
  const modelRef = useRef<FaceLandmarksDetector | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keypoints, setKeypoints] = useState<Point2D[]>([]);
  const [fps, setFps] = useState(0);
  const [modelLoadTime, setModelLoadTime] = useState<number | null>(null);
  const [loadTimeWithinLimit, setLoadTimeWithinLimit] = useState<boolean | null>(null);

  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(performance.now());
  const loadStartTimeRef = useRef<number>(0);

  const loadModel = useCallback(async () => {
    if (modelRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);
    loadStartTimeRef.current = performance.now();

    try {
      const modelConfig: MediaPipeFaceMeshTfjsModelConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
      } as MediaPipeFaceMeshTfjsModelConfig;

      const detector = await createDetector(
        SupportedModels.MediaPipeFaceMesh,
        modelConfig,
      );

      const loadTime = performance.now() - loadStartTimeRef.current;

      modelRef.current = detector;
      setIsLoaded(true);
      setModelLoadTime(loadTime);
      setLoadTimeWithinLimit(loadTime <= MODEL_LOAD_TIME_LIMIT);

      console.info(`[FaceDetection] 模型加载完成，耗时: ${loadTime.toFixed(2)}ms`);
      console.info(`[FaceDetection] 是否在5秒限制内: ${loadTime <= MODEL_LOAD_TIME_LIMIT}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '未知错误';
      setError(errorMessage);
      console.error('[FaceDetection] 模型加载失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const detectFace = useCallback(async (videoOrImage: HTMLVideoElement | HTMLImageElement) => {
    if (!modelRef.current) {
      return;
    }

    try {
      const predictions: Face[] = await modelRef.current.estimateFaces(
        videoOrImage,
        { flipHorizontal: false, staticImageMode: false },
      );

      frameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsUpdateRef.current >= 1000) {
        const calculatedFps = Math.round(
          (frameCountRef.current * 1000) / (now - lastFpsUpdateRef.current),
        );
        setFps(calculatedFps);
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      if (predictions.length > 0 && predictions[0].keypoints) {
        const width = videoOrImage instanceof HTMLVideoElement
          ? videoOrImage.videoWidth || 640
          : videoOrImage.naturalWidth || 640;
        const height = videoOrImage instanceof HTMLVideoElement
          ? videoOrImage.videoHeight || 480
          : videoOrImage.naturalHeight || 480;

        const normalizedKeypoints: Point2D[] = predictions[0].keypoints.map((kp) => ({
          x: kp.x / width,
          y: kp.y / height,
        }));

        setKeypoints(normalizedKeypoints);
      } else {
        setKeypoints([]);
      }
    } catch (err) {
      console.warn('[FaceDetection] 检测失败:', err);
    }
  }, []);

  useEffect(() => {
    loadModel();

    return () => {
      if (modelRef.current) {
        modelRef.current.dispose();
        modelRef.current = null;
      }
    };
  }, [loadModel]);

  return {
    keypoints,
    currentKeypoints: keypoints,
    isLoaded,
    isLoading,
    error,
    fps,
    modelLoadTime,
    loadTimeWithinLimit,
    detectFace,
  };
}
