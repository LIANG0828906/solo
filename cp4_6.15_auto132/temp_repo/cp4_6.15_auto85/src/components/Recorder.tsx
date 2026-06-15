import React, { useRef, useCallback, useEffect } from 'react';

interface RecorderProps {
  mediaStream: MediaStream | null;
  fps: 15 | 30 | 60;
  videoWidth: number;
  videoHeight: number;
  onRecordingStart: () => void;
  onRecordingStop: (blob: Blob) => void;
  onRecordingTimeUpdate: (timeMs: number) => void;
  children?: React.ReactNode;
}

const Recorder: React.FC<RecorderProps> = ({
  mediaStream,
  fps,
  videoWidth,
  videoHeight,
  onRecordingStart,
  onRecordingStop,
  onRecordingTimeUpdate,
  children,
}) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const isRecordingRef = useRef(false);

  const startRecording = useCallback(() => {
    if (!mediaStream) return;
    chunksRef.current = [];

    let mimeType = '';
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    for (const type of candidates) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
        mimeType = type;
        break;
      }
    }

    try {
      const baseBitrate = videoWidth * videoHeight * fps * 0.1;
      const minBitrate = 1000000;
      const maxBitrate = 10000000;
      const videoBitsPerSecond = Math.max(minBitrate, Math.min(maxBitrate, baseBitrate));

      const options: MediaRecorderOptions = {
        videoBitsPerSecond,
      };
      if (mimeType) {
        options.mimeType = mimeType;
      }

      const recorder = new MediaRecorder(mediaStream, options);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        isRecordingRef.current = false;
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blobType = mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: blobType });
        onRecordingStop(blob);
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      startTimeRef.current = performance.now();

      timerRef.current = window.setInterval(() => {
        if (isRecordingRef.current) {
          const elapsed = performance.now() - startTimeRef.current;
          onRecordingTimeUpdate(elapsed);
        }
      }, 100);

      onRecordingStart();
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [mediaStream, fps, videoWidth, videoHeight, onRecordingStart, onRecordingStop, onRecordingTimeUpdate]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    (window as unknown as { __startRecording?: () => void; __stopRecording?: () => void }).__startRecording = startRecording;
    (window as unknown as { __startRecording?: () => void; __stopRecording?: () => void }).__stopRecording = stopRecording;
    return () => {
      delete (window as unknown as { __startRecording?: () => void }).__startRecording;
      delete (window as unknown as { __stopRecording?: () => void }).__stopRecording;
    };
  }, [startRecording, stopRecording]);

  return <>{children}</>;
};

export default Recorder;
