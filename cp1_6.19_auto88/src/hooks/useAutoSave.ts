import { useEffect, useRef, useState, useCallback } from 'react';
import type { Project } from '@/types';
import { saveProjectBackup } from '@/utils/storage';

export const useAutoSave = (
  projectId: string | null,
  project: Project | undefined,
  interval: number = 10000
) => {
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  const lastSavedRef = useRef<number>(0);
  const pendingSaveRef = useRef<Project | null>(null);

  const performSave = useCallback(() => {
    if (projectId && project) {
      pendingSaveRef.current = project;
      const now = Date.now();
      if (now - lastSavedRef.current >= 3000) {
        saveProjectBackup(projectId, project);
        lastSavedRef.current = now;
        pendingSaveRef.current = null;
        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 1500);
      }
    }
  }, [projectId, project]);

  useEffect(() => {
    if (!projectId) return;

    const timer = setInterval(() => {
      performSave();
    }, interval);

    return () => {
      clearInterval(timer);
      if (pendingSaveRef.current && projectId) {
        saveProjectBackup(projectId, pendingSaveRef.current);
      }
    };
  }, [projectId, interval, performSave]);

  const forceSave = useCallback(() => {
    if (projectId && project) {
      saveProjectBackup(projectId, project);
      lastSavedRef.current = Date.now();
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 1500);
    }
  }, [projectId, project]);

  return {
    showSaveIndicator,
    forceSave,
  };
};
