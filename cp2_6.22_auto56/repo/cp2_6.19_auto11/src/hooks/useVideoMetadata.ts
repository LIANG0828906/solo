import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Material, VideoMetadata } from '../types';
import { extractVideoMetadata } from '../utils/video';

export const useVideoMetadata = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = useCallback(async (files: FileList): Promise<Material[]> => {
    setLoading(true);
    setError(null);
    const materials: Material[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('video/')) {
          continue;
        }

        try {
          const metadata: VideoMetadata = await extractVideoMetadata(file);
          const url = URL.createObjectURL(file);
          
          materials.push({
            id: uuidv4(),
            name: file.name,
            file,
            url,
            duration: metadata.duration,
            thumbnail: metadata.thumbnail,
            width: metadata.width,
            height: metadata.height,
            fileSize: file.size,
            lastModified: file.lastModified,
          });
        } catch (e) {
          console.error(`Failed to process ${file.name}:`, e);
        }
      }
    } finally {
      setLoading(false);
    }

    return materials;
  }, []);

  const cleanupMaterial = useCallback((material: Material) => {
    if (material.url) {
      URL.revokeObjectURL(material.url);
    }
  }, []);

  return {
    loading,
    error,
    processFiles,
    cleanupMaterial,
  };
};
