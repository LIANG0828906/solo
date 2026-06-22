import { useState, useEffect, useCallback, useRef } from 'react';
import { ColorScheme } from '../types';
import { COLOR_SCHEMES } from '../data/materials';
import { mapColorToScheme, interpolateColor, easeInOutCubic } from '../utils/colorUtils';

interface UseColorSchemeResult {
  schemes: ColorScheme[];
  currentScheme: ColorScheme;
  applyScheme: (schemeId: string) => void;
  mapMaterialColor: (baseColor: string) => string;
  animateColors: (
    colors: { id: string; fromColor: string; toColor: string }[],
    onUpdate: (id: string, color: string) => void,
    duration?: number
  ) => void;
}

export function useColorScheme(initialSchemeId: string = 'spring'): UseColorSchemeResult {
  const [currentSchemeId, setCurrentSchemeId] = useState(initialSchemeId);
  const animationRef = useRef<number | null>(null);

  const currentScheme =
    COLOR_SCHEMES.find((s) => s.id === currentSchemeId) || COLOR_SCHEMES[0];

  const applyScheme = useCallback((schemeId: string) => {
    if (COLOR_SCHEMES.find((s) => s.id === schemeId)) {
      setCurrentSchemeId(schemeId);
    }
  }, []);

  const mapMaterialColor = useCallback(
    (baseColor: string): string => {
      return mapColorToScheme(baseColor, currentScheme);
    },
    [currentScheme]
  );

  const animateColors = useCallback(
    (
      colors: { id: string; fromColor: string; toColor: string }[],
      onUpdate: (id: string, color: string) => void,
      duration: number = 500
    ) => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeInOutCubic(progress);

        colors.forEach(({ id, fromColor, toColor }) => {
          const currentColor = interpolateColor(fromColor, toColor, easedProgress);
          onUpdate(id, currentColor);
        });

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    schemes: COLOR_SCHEMES,
    currentScheme,
    applyScheme,
    mapMaterialColor,
    animateColors,
  };
}
