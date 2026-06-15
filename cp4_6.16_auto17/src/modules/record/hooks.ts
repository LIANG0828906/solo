import { useEffect, useRef, useCallback, useState } from 'react';
import { useRecordStore } from './store';

const SAMPLE_INTERVAL = 5000;
const MAX_SAMPLE_ERROR = 500;
const SAMPLE_ADVANCE_MS = 100;
const MIN_DISTANCE_METERS = 5;
const FORCE_SAMPLE_CYCLES = 2;
const LOW_ACCURACY_THRESHOLD = 50;

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function useGeolocationTracking() {
  const { isRecording, currentTrailId, addPoint, setCurrentPosition, setError } = useRecordStore();
  const watchIdRef = useRef<number | null>(null);
  const currentPositionRef = useRef<{
    lat: number;
    lng: number;
    elevation: number | null;
    accuracy: number | null;
  } | null>(null);
  const expectedSampleTimeRef = useRef<number>(0);
  const sampleCountRef = useRef<number>(0);
  const overshootCountRef = useRef<number>(0);
  const skipCountRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const lastSamplePositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastSampleTimeRef = useRef<number>(0);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      elevation: position.coords.altitude,
      accuracy: position.coords.accuracy,
    };

    currentPositionRef.current = pos;
    setCurrentPosition({
      lat: pos.lat,
      lng: pos.lng,
      elevation: pos.elevation,
    });
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

    if (Math.abs(deviation) > MAX_SAMPLE_ERROR * 2) {
      console.warn(
        `[GPS采样] ⚠时间漂移超限 | 偏差: ${deviation >= 0 ? '+' : ''}${deviation}ms | ` +
        `重置期望时间基线`
      );
      expectedSampleTimeRef.current = now + SAMPLE_INTERVAL;
      overshootCountRef.current += 1;
    } else {
      expectedSampleTimeRef.current += SAMPLE_INTERVAL;
    }

    const pos = currentPositionRef.current;
    const isLowAccuracy = pos.accuracy !== null && pos.accuracy > LOW_ACCURACY_THRESHOLD;

    let shouldSkip = false;
    if (lastSamplePositionRef.current) {
      const distance = calculateDistance(
        lastSamplePositionRef.current.lat,
        lastSamplePositionRef.current.lng,
        pos.lat,
        pos.lng
      );
      const timeSinceLastSample = now - lastSampleTimeRef.current;
      const forceSampleThreshold = SAMPLE_INTERVAL * FORCE_SAMPLE_CYCLES;

      if (distance < MIN_DISTANCE_METERS && timeSinceLastSample < forceSampleThreshold) {
        shouldSkip = true;
        skipCountRef.current += 1;
        console.log(
          `[GPS采样] 跳过 #${sampleCountRef.current + 1} | ` +
          `位移: ${distance.toFixed(2)}m | ` +
          `距上次: ${(timeSinceLastSample / 1000).toFixed(1)}s | ` +
          `原因: 位置未变化`
        );
      }
    }

    if (shouldSkip) {
      return;
    }

    sampleCountRef.current += 1;
    const isOvershoot = Math.abs(deviation) > MAX_SAMPLE_ERROR;
    if (isOvershoot) {
      overshootCountRef.current += 1;
    }

    console.log(
      `[GPS采样] #${sampleCountRef.current} | ` +
      `期望时间: ${new Date(expectedSampleTimeRef.current - SAMPLE_INTERVAL).toISOString()} | ` +
      `实际时间: ${new Date(now).toISOString()} | ` +
      `偏差: ${deviation >= 0 ? '+' : ''}${deviation}ms | ` +
      `状态: ${isOvershoot ? '⚠超差' : '✓正常'} | ` +
      `精度: ${isLowAccuracy ? '⚠低精度' : '✓正常'}${pos.accuracy !== null ? ` (${pos.accuracy.toFixed(0)}m)` : ''}`
    );

    addPoint({
      trailId: currentTrailId,
      lat: pos.lat,
      lng: pos.lng,
      elevation: pos.elevation,
      timestamp: new Date(now),
    });

    lastSamplePositionRef.current = { lat: pos.lat, lng: pos.lng };
    lastSampleTimeRef.current = now;
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
    overshootCountRef.current = 0;
    skipCountRef.current = 0;
    lastSamplePositionRef.current = null;
    lastSampleTimeRef.current = 0;

    console.log(
      `[GPS采样] 启动 | 采样间隔: ${SAMPLE_INTERVAL}ms | ` +
      `允许误差: ±${MAX_SAMPLE_ERROR}ms | ` +
      `提前触发: ${SAMPLE_ADVANCE_MS}ms | ` +
      `最小位移: ${MIN_DISTANCE_METERS}m | ` +
      `强制采样周期: ${FORCE_SAMPLE_CYCLES}个周期`
    );

    const checkAndSample = () => {
      const currentTime = Date.now();

      if (currentTime >= expectedSampleTimeRef.current - SAMPLE_ADVANCE_MS) {
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
      const total = sampleCountRef.current + skipCountRef.current;
      const overshootRate = total > 0 ? ((overshootCountRef.current / total) * 100).toFixed(1) : '0.0';
      const skipRate = total > 0 ? ((skipCountRef.current / total) * 100).toFixed(1) : '0.0';
      console.log(
        `[GPS采样] 停止 | 总采样: ${sampleCountRef.current} | ` +
        `超差: ${overshootCountRef.current} (${overshootRate}%) | ` +
        `跳过: ${skipCountRef.current} (${skipRate}%)`
      );
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
