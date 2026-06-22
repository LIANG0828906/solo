import { useRef, useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useClockStore } from '@/store/useClockStore';

interface UseClockControlsProps {
  enabled?: boolean;
}

export const useClockControls = ({ enabled = true }: UseClockControlsProps = {}) => {
  const { camera, raycaster, pointer } = useThree();
  const isDragging = useRef(false);
  const handleRef = useRef<THREE.Group | null>(null);
  const plane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
  
  const setWaterLevel = useClockStore(state => state.setWaterLevel);
  const isCalibrating = useClockStore(state => state.isCalibrating);
  const calibrate = useClockStore(state => state.calibrate);
  const setCalibrating = useClockStore(state => state.setCalibrating);
  const setSuccess = useClockStore(state => state.setSuccess);

  const playBellSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  const setHandleRef = useCallback((ref: THREE.Group | null) => {
    handleRef.current = ref;
  }, []);

  const handlePointerDown = useCallback((event: PointerEvent) => {
    if (!enabled || isCalibrating) return;
    
    const target = event.target as HTMLElement;
    if (target.closest('.control-panel') || target.closest('.date-panel') || target.closest('.status-panel')) {
      return;
    }
    
    raycaster.setFromCamera(pointer, camera);
    
    if (handleRef.current) {
      const intersects = raycaster.intersectObject(handleRef.current, true);
      if (intersects.length > 0) {
        isDragging.current = true;
        (event.target as Element).setPointerCapture(event.pointerId);
        
        const point = intersects[0].point;
        plane.current.setFromNormalAndCoplanarPoint(
          new THREE.Vector3(0, 1, 0),
          point
        );
      }
    }
  }, [enabled, isCalibrating, raycaster, pointer, camera]);

  const handlePointerMove = useCallback((_event: PointerEvent) => {
    if (!isDragging.current || !enabled) return;
    
    raycaster.setFromCamera(pointer, camera);
    
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane.current, intersectPoint);
    
    if (intersectPoint) {
      const minY = 1/6 * 200 - 100;
      const maxY = 5/6 * 200 - 100;
      const clampedY = Math.max(minY, Math.min(maxY, intersectPoint.y));
      const normalizedLevel = (clampedY + 100) / 200;
      
      setWaterLevel(normalizedLevel);
    }
  }, [enabled, raycaster, pointer, camera, setWaterLevel]);

  const handlePointerUp = useCallback((event: PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (event.target as Element).releasePointerCapture(event.pointerId);
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isCalibrating) return;
    
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      calibrate(0.5);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      calibrate(-0.5);
    } else if (event.key === 'Enter' || event.key === 'Escape') {
      event.preventDefault();
      const currentKe = useClockStore.getState().currentKe;
      const targetKe = 50;
      const tolerance = 0.3;
      
      if (Math.abs(currentKe - targetKe) < tolerance) {
        setTimeout(() => {
          playBellSound();
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            setCalibrating(false);
          }, 2000);
        }, 50);
      } else {
        setCalibrating(false);
      }
    }
  }, [isCalibrating, calibrate, setCalibrating, setSuccess, playBellSound]);

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    canvas.addEventListener('pointerdown', handlePointerDown as unknown as EventListener);
    canvas.addEventListener('pointermove', handlePointerMove as unknown as EventListener);
    window.addEventListener('pointerup', handlePointerUp as unknown as EventListener);
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown as unknown as EventListener);
      canvas.removeEventListener('pointermove', handlePointerMove as unknown as EventListener);
      window.removeEventListener('pointerup', handlePointerUp as unknown as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handleKeyDown]);

  return {
    setHandleRef,
    isDragging: isDragging.current
  };
};
