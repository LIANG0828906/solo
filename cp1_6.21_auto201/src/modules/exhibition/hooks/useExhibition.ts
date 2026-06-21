import { useState, useEffect } from 'react';
import axios from 'axios';

export interface ExhibitionData {
  id: number;
  name: string;
  description: string;
  imageFiles: string[];
  audioFile: string;
  era: string;
  material: string;
}

export interface AudioState {
  playing: boolean;
  loaded: boolean;
  progress: number;
  duration: number;
  currentTime: number;
}

export function useExhibition(exhibitionId: number) {
  const [exhibition, setExhibition] = useState<ExhibitionData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [audioState, setAudioState] = useState<AudioState>({
    playing: false,
    loaded: false,
    progress: 0,
    duration: 0,
    currentTime: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setAudioState({
        playing: false,
        loaded: false,
        progress: 0,
        duration: 0,
        currentTime: 0,
      });

      try {
        const [detailRes, imagesRes, audioRes] = await Promise.all([
          axios.get(`/api/exhibitions/${exhibitionId}`),
          axios.get(`/api/exhibitions/${exhibitionId}/images`),
          axios.get(`/api/exhibitions/${exhibitionId}/audio`),
        ]);

        if (cancelled) return;

        setExhibition(detailRes.data);
        const imageUrls = imagesRes.data.map(
          (filename: string) => `/api/exhibitions/${exhibitionId}/images/${filename}`
        );
        setImages(imageUrls);
        setAudioUrl(audioRes.data.url);
      } catch (err) {
        console.error('Failed to load exhibition data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [exhibitionId]);

  return {
    exhibition,
    images,
    audioUrl,
    loading,
    audioState,
    setAudioState,
  };
}
