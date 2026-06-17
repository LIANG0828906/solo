import { useEffect, useRef, useCallback } from 'react';
import { Pose, Results, POSE_LANDMARKS } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import { useTrainingStore } from '@/stores/trainingStore';
import { POSE_CONNECTIONS } from '@/types';
import type { Landmark, FrameData } from '@/types';
import styles from './CameraCapture.module.css';

interface CameraCaptureProps {
  width?: number;
  height?: number;
}

export default function CameraCapture({
  width = 640,
  height = 480,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<Pose | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const frameIndexRef = useRef(0);
  const lastFrameTimeRef = useRef(0);

  const { setCurrentFrame, recordingStatus } = useTrainingStore();

  const drawSkeleton = useCallback(
    (landmarks: Landmark[], canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.7;

      for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (!start || !end) continue;

        ctx.beginPath();
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      for (const landmark of landmarks) {
        if (!landmark) continue;

        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          4,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = '#00FF88';
        ctx.fill();

        ctx.shadowColor = '#00FF88';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    },
    []
  );

  const onResults = useCallback(
    (results: Results) => {
      const now = performance.now();
      if (now - lastFrameTimeRef.current < 33) return;
      lastFrameTimeRef.current = now;

      const landmarks = results.poseLandmarks;
      if (!landmarks || landmarks.length === 0) return;

      const frameData: FrameData = {
        frameIndex: frameIndexRef.current++,
        timestamp: now,
        landmarks: landmarks as Landmark[],
      };

      setCurrentFrame(frameData);

      if (canvasRef.current) {
        drawSkeleton(landmarks as Landmark[], canvasRef.current);
      }
    },
    [setCurrentFrame, drawSkeleton]
  );

  useEffect(() => {
    if (!videoRef.current) return;

    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    pose.onResults(onResults);
    poseRef.current = pose;

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (poseRef.current && videoRef.current) {
          await poseRef.current.send({ image: videoRef.current });
        }
      },
      width,
      height,
    });

    camera.start();
    cameraRef.current = camera;

    return () => {
      camera.stop();
      pose.close();
    };
  }, [onResults, width, height]);

  return (
    <div className={styles.container}>
      <div className={styles.videoWrapper}>
        <video
          ref={videoRef}
          className={styles.video}
          width={width}
          height={height}
          playsInline
          muted
        />
        <div className={styles.glow} />
      </div>
      <div className={styles.skeletonWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.skeletonCanvas}
          width={width}
          height={height}
        />
        <div className={styles.skeletonLabel}>骨骼检测</div>
      </div>
    </div>
  );
}
