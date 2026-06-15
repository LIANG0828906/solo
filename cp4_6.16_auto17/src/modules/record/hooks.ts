import { useEffect, useRef, useCallback, useState } from 'react';
import { useRecordStore } from './store';

const SAMPLE_INTERVAL = 5000;
const MAX_SAMPLE_ERROR = 500;

export function useGeolocationTracking() {
  const { isRecording, currentTrailId, addPoint, setCurrentPosition, setError } = useRecordStore();
  const watchIdRef = useRef<number | null>(null);
  const currentPositionRef = useRef<{
    lat: number;
    lng: number;
    elevation: number | null;
  } | null>(null);
  const expectedSampleTimeRef = useRef<number>(0);
  const sampleCountRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      elevation: position.coords.altitude,
    };

    currentPositionRef.current = pos;
    setCurrentPosition(pos);
  }, [setCurrentPosition]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const errorMessages: Record<number, string> = {
      [error.PERMISSION_DENIED]: '位置权限被拒绝',
      [error.POSITION_UNAVAILABLE]: '位置信息不可用',
      [error.TIMEOUT]: '获取位置超时',
    };
    setError(errorMessages[error.code] || '获取位置失败');
  }, [setError]);

  const performSample = useCallback(() => {
    if (!currentTrailId || !currentPositionRef.current) return;

    const now = Date.now();
    const deviation = now - expectedSampleTimeRef.current;

    sampleCountRef.current += 1;

    console.log(
      `[GPS采样] #${sampleCountRef.current} | ` +
      `期望时间: ${new Date(expectedSampleTimeRef.current).toISOString()} | ` +
      `实际时间: ${new Date(now).toISOString()} | ` +
      `偏差: ${deviation >= 0 ? '+' : ''}${deviation}ms | ` +
      `状态: ${Math.abs(deviation) <= MAX_SAMPLE_ERROR ? '✓正常' : '⚠超差'}`
    );

    addPoint({
      trailId: currentTrailId,
      lat: currentPositionRef.current.lat,
      lng: currentPositionRef.current.lng,
      elevation: currentPositionRef.current.elevation,
      timestamp: new Date(now),
    });

    expectedSampleTimeRef.current += SAMPLE_INTERVAL;
  }, [currentTrailId, addPoint]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持地理位置功能');
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      options
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [handlePosition, handleError, setError]);

  useEffect(() => {
    if (!isRecording) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const now = Date.now();
    expectedSampleTimeRef.current = now + SAMPLE_INTERVAL;
    sampleCountRef.current = 0;

    console.log(`[GPS采样] 启动 | 采样间隔: ${SAMPLE_INTERVAL}ms | 允许误差: ±${MAX_SAMPLE_ERROR}ms`);

    const checkAndSample = () => {
      const currentTime = Date.now();

      if (currentTime >= expectedSampleTimeRef.current - MAX_SAMPLE_ERROR) {
        performSample();
      }

      rafIdRef.current = requestAnimationFrame(checkAndSample);
    };

    rafIdRef.current = requestAnimationFrame(checkAndSample);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      console.log(`[GPS采样] 停止 | 总采样次数: ${sampleCountRef.current}`);
    };
  }, [isRecording, performSample]);

  return null;
}

export function useRecordTimer() {
  const { isRecording, getCurrentDuration } = useRecordStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRecording) return;
    
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  return getCurrentDuration();
}
