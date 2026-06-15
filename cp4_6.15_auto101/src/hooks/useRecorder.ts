import { useState, useRef, useCallback, useEffect } from 'react';
import { RecordingState } from '../types';

interface UseRecorderReturn {
  state: RecordingState;
  duration: number;
  blob: Blob | null;
  videoUrl: string | null;
  audioBlob: Blob | null;
  startRecording: (options?: DisplayMediaStreamOptions) => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
}

export function useRecorder(): UseRecorderReturn {
  const [state, setState] = useState<RecordingState>(RecordingState.IDLE);
  const [duration, setDuration] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const pauseStartTimeRef = useRef<number>(0);

  const cleanupStreams = useCallback(() => {
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(track => track.stop());
      videoStreamRef.current = null;
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
  }, [videoUrl]);

  const startDurationCounter = useCallback(() => {
    startTimeRef.current = Date.now();
    pausedDurationRef.current = 0;
    durationIntervalRef.current = window.setInterval(() => {
      if (state === RecordingState.RECORDING) {
        const elapsed = Date.now() - startTimeRef.current - pausedDurationRef.current;
        setDuration(Math.floor(elapsed / 1000));
      }
    }, 1000);
  }, [state]);

  const startRecording = useCallback(async (options?: DisplayMediaStreamOptions) => {
    try {
      setState(RecordingState.COUNTDOWN);

      const countdownPromise = new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 3000);
      });

      const mediaOptions: DisplayMediaStreamOptions = options || {
        video: {
          displaySurface: 'monitor',
        } as MediaTrackConstraints,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          sampleRate: 48000,
        } as MediaTrackConstraints,
      };

      const [videoStream] = await Promise.all([
        navigator.mediaDevices.getDisplayMedia(mediaOptions),
        countdownPromise,
      ]);

      videoStreamRef.current = videoStream;
      videoChunksRef.current = [];

      const videoRecorder = new MediaRecorder(videoStream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : 'video/webm',
        videoBitsPerSecond: 2500000,
      });

      videoRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      videoRecorder.onstop = () => {
        const recordedBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        setBlob(recordedBlob);
        const url = URL.createObjectURL(recordedBlob);
        setVideoUrl(url);
        cleanupStreams();
      };

      videoRecorder.start(100);
      mediaRecorderRef.current = videoRecorder;

      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 48000,
          },
        });

        audioStreamRef.current = audioStream;
        audioChunksRef.current = [];

        const audioRecorder = new MediaRecorder(audioStream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/webm',
        });

        audioRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        audioRecorder.onstop = () => {
          const recordedAudioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioBlob(recordedAudioBlob);
        };

        audioRecorder.start(100);
        audioRecorderRef.current = audioRecorder;
      } catch (audioError) {
        console.warn('Audio recording not available:', audioError);
      }

      setState(RecordingState.RECORDING);
      startDurationCounter();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(RecordingState.IDLE);
      cleanupStreams();
      throw error;
    }
  }, [cleanupStreams, startDurationCounter]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === RecordingState.RECORDING) {
      mediaRecorderRef.current.pause();
      if (audioRecorderRef.current) {
        audioRecorderRef.current.pause();
      }
      pauseStartTimeRef.current = Date.now();
      setState(RecordingState.PAUSED);
    }
  }, [state]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === RecordingState.PAUSED) {
      mediaRecorderRef.current.resume();
      if (audioRecorderRef.current) {
        audioRecorderRef.current.resume();
      }
      pausedDurationRef.current += Date.now() - pauseStartTimeRef.current;
      setState(RecordingState.RECORDING);
    }
  }, [state]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      setState(RecordingState.PROCESSING);
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      mediaRecorderRef.current.stop();
      if (audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }

      setTimeout(() => {
        setState(RecordingState.STOPPED);
      }, 500);
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanupStreams();
    setBlob(null);
    setVideoUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setState(RecordingState.IDLE);
    videoChunksRef.current = [];
    audioChunksRef.current = [];
  }, [cleanupStreams]);

  useEffect(() => {
    return () => {
      cleanupStreams();
    };
  }, [cleanupStreams]);

  return {
    state,
    duration,
    blob,
    videoUrl,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
}
