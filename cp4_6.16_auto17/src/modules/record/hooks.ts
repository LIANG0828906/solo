import { useEffect, useRef, useCallback, useState } from 'react';
import { useRecordStore } from './store';

const SAMPLE_INTERVAL = 5000;
const MAX_SAMPLE_ERROR = 500;

export function useGeolocationTracking() {
  const { isRecording, currentTrailId, addPoint, setCurrentPosition, setError } = useRecordStore();
  const watchIdRef = useRef<number | null>(null);
  const lastSampleTimeRef = useRef<number>(0);
  const intervalIdRef = useRef<number | null>(null);

  const handlePosition = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const pos = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      elevation: position.coords.altitude,
    };
    
    setCurrentPosition(pos);

    if (isRecording && currentTrailId) {
      if (now - lastSampleTimeRef.current >= SAMPLE_INTERVAL - MAX_SAMPLE_ERROR) {
        addPoint({
          trailId: currentTrailId,
          lat: pos.lat,
          lng: pos.lng,
          elevation: pos.elevation,
          timestamp: new Date(),
        });
        lastSampleTimeRef.current = now;
      }
    }
  }, [isRecording, currentTrailId, addPoint, setCurrentPosition]);

  const handleError = useCallback((error: GeolocationPositionError) => {
    const errorMessages: Record<number, string> = {
      [error.PERMISSION_DENIED]: '位置权限被拒绝',
      [error.POSITION_UNAVAILABLE]: '位置信息不可用',
      [error.TIMEOUT]: '获取位置超时',
    };
    setError(errorMessages[error.code] || '获取位置失败');
  }, [setError]);

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
    if (isRecording) {
      lastSampleTimeRef.current = Date.now();
    }
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    intervalIdRef.current = window.setInterval(() => {
      const now = Date.now();
      if (now - lastSampleTimeRef.current >= SAMPLE_INTERVAL + MAX_SAMPLE_ERROR) {
        console.warn('GPS采样延迟超过阈值');
      }
    }, 1000);

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [isRecording]);

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
