import { useState, useRef, useCallback, useEffect } from 'react';
import type { Clip, Material, Transition } from '../types';
import { clamp } from '../utils/time';

interface UsePlayerControlsProps {
  clips: Clip[];
  transitions: Transition[];
  materials: Material[];
  currentTime: number;
  isPlaying: boolean;
  onTimeChange: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
}

export const usePlayerControls = (props: UsePlayerControlsProps) => {
  const { clips, transitions, materials, currentTime, isPlaying, onTimeChange, onPlay, onPause } = props;
  
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const videoElementsRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const audioElementsRef = useRef<Map<string, any>>(new Map());
  const currentClipIdRef = useRef<string | null>(null);

  const getTotalDuration = useCallback(() => {
    if (clips.length === 0) return 0;
    return Math.max(...clips.map(c => c.endTime));
  }, [clips]);

  const getClipAtTime = useCallback((time: number): Clip | null => {
    for (const clip of clips) {
      if (time >= clip.startTime && time < clip.endTime) {
        return clip;
      }
    }
    return null;
  }, [clips]);

  const getTransitionAtTime = useCallback((time: number): Transition | null => {
    for (const transition of transitions) {
      const fromClip = clips.find(c => c.id === transition.fromClipId);
      if (!fromClip) continue;
      const transitionStart = fromClip.endTime - transition.duration;
      const transitionEnd = fromClip.endTime;
      if (time >= transitionStart && time < transitionEnd) {
        return transition;
      }
    }
    return null;
  }, [clips, transitions]);

  const preloadVideo = useCallback((materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (!material) return null;

    if (!videoElementsRef.current.has(materialId)) {
      const video = document.createElement('video');
      video.src = material.url;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      videoElementsRef.current.set(materialId, video);
    }

    return videoElementsRef.current.get(materialId) || null;
  }, [materials]);

  const updateVideoTime = useCallback(async (clip: Clip, time: number) => {
    const video = preloadVideo(clip.materialId);
    if (!video) return;

    const clipTime = clip.inPoint + (time - clip.startTime) * clip.playbackRate;
    const clampedTime = clamp(clipTime, clip.inPoint, clip.outPoint);

    if (Math.abs(video.currentTime - clampedTime) > 0.03) {
      try {
        video.currentTime = clampedTime;
      } catch (e) {
        console.warn('Seek failed:', e);
      }
    }
  }, [preloadVideo]);

  const playCurrentVideo = useCallback((clip: Clip) => {
    const video = preloadVideo(clip.materialId);
    if (video && video.paused) {
      video.playbackRate = clip.playbackRate;
      video.volume = clip.volume / 100;
      video.play().catch(() => {});
    }

    if (currentClipIdRef.current && currentClipIdRef.current !== clip.id) {
      const prevVideo = videoElementsRef.current.get(currentClipIdRef.current);
      if (prevVideo) {
        prevVideo.pause();
      }
    }
    currentClipIdRef.current = clip.id;
  }, [preloadVideo]);

  const pauseAllVideos = useCallback(() => {
    videoElementsRef.current.forEach(video => {
      if (!video.paused) {
        video.pause();
      }
    });
    audioElementsRef.current.forEach(audio => {
      if (audio.playing()) {
        audio.pause();
      }
    });
    currentClipIdRef.current = null;
  }, []);

  const animate = useCallback((timestamp: number) => {
    if (!isPlaying) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const delta = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const newTime = currentTime + delta;
    const totalDuration = getTotalDuration();

    if (newTime >= totalDuration) {
      onTimeChange(0);
      onPause();
      pauseAllVideos();
      return;
    }

    onTimeChange(newTime);

    const clip = getClipAtTime(newTime);
    if (clip) {
      updateVideoTime(clip, newTime);
      playCurrentVideo(clip);
    } else {
      pauseAllVideos();
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [isPlaying, currentTime, getTotalDuration, getClipAtTime, updateVideoTime, playCurrentVideo, pauseAllVideos, onTimeChange, onPause]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      pauseAllVideos();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate, pauseAllVideos]);

  useEffect(() => {
    if (!isPlaying) {
      const clip = getClipAtTime(currentTime);
      if (clip) {
        updateVideoTime(clip, currentTime);
      }
    }
  }, [currentTime, isPlaying, getClipAtTime, updateVideoTime]);

  const cleanup = useCallback(() => {
    videoElementsRef.current.forEach((video) => {
      video.pause();
      video.src = '';
      video.load();
    });
    videoElementsRef.current.clear();

    audioElementsRef.current.forEach((audio) => {
      if (audio.playing()) audio.unload();
    });
    audioElementsRef.current.clear();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const getCurrentVideoElement = useCallback((): HTMLVideoElement | null => {
    const clip = getClipAtTime(currentTime);
    if (!clip) return null;
    return videoElementsRef.current.get(clip.materialId) || null;
  }, [getClipAtTime, currentTime]);

  const getVideoElement = useCallback((materialId: string): HTMLVideoElement | null => {
    return videoElementsRef.current.get(materialId) || null;
  }, []);

  return {
    getTotalDuration,
    getClipAtTime,
    getTransitionAtTime,
    getCurrentVideoElement,
    getVideoElement,
    preloadVideo,
    cleanup,
  };
};
