import { useCallback, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import type { Star } from '../types';
import { useNavigationStore } from '../store/useNavigationStore';
import { findNearestStar } from '../utils/starData';
import { calculateAltitude, calculateAzimuth, sphericalToCartesian } from '../utils/mathUtils';
import { SCENE_CONSTANTS } from '../utils/constants';

const { MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE, MIN_POLAR_ANGLE, MAX_POLAR_ANGLE } = SCENE_CONSTANTS;

export function useStarObservation() {
  const { camera } = useThree();
  const { observation, updateObservation, selectStar } = useNavigationStore();

  const updateCameraFromSpherical = useCallback(() => {
    const { cameraAzimuth, cameraPolar, cameraDistance } = observation;
    const [x, y, z] = sphericalToCartesian(cameraAzimuth, cameraPolar, cameraDistance);
    camera.position.set(x, y, z);
    camera.lookAt(0, 0, 0);
  }, [camera, observation]);

  const updateObservationFromCamera = useCallback(() => {
    const camDir: [number, number, number] = [
      -camera.position.x,
      -camera.position.y,
      -camera.position.z,
    ];

    const altitude = calculateAltitude(camDir);
    const azimuth = calculateAzimuth(camDir);
    
    const nearestStar = findNearestStar(camDir, 0.12);

    updateObservation({
      altitude,
      azimuth,
    });

    if (nearestStar) {
      selectStar(nearestStar);
    } else {
      selectStar(null);
    }
  }, [camera, updateObservation, selectStar]);

  const handleZoom = useCallback((delta: number) => {
    const newDistance = Math.max(
      MIN_CAMERA_DISTANCE,
      Math.min(MAX_CAMERA_DISTANCE, observation.cameraDistance + delta)
    );
    updateObservation({ cameraDistance: newDistance });
  }, [observation.cameraDistance, updateObservation]);

  const handleRotate = useCallback((deltaAzimuth: number, deltaPolar: number) => {
    const newAzimuth = observation.cameraAzimuth + deltaAzimuth;
    const newPolar = Math.max(
      MIN_POLAR_ANGLE,
      Math.min(MAX_POLAR_ANGLE, observation.cameraPolar + deltaPolar)
    );
    updateObservation({
      cameraAzimuth: newAzimuth,
      cameraPolar: newPolar,
    });
  }, [observation.cameraAzimuth, observation.cameraPolar, updateObservation]);

  const setSelectedStar = useCallback((star: Star | null) => {
    selectStar(star);
  }, [selectStar]);

  useEffect(() => {
    updateCameraFromSpherical();
  }, [updateCameraFromSpherical]);

  return {
    updateObservationFromCamera,
    handleZoom,
    handleRotate,
    setSelectedStar,
  };
}
