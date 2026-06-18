import { useCallback, useEffect, useRef } from 'react';
import { useAudioStore } from '../store/audioStore';
import { AudioProcessor, formatTime, validateFile } from '../utils/audioAnalyzer';

export function AudioUploader() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processorRef = useRef<AudioProcessor | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const {
    audioFile,
    fileName,
    duration,
    currentTime,
    isLoaded,
    isPlaying,
    bpm,
    setAudioFile,
    setFileName,
    setDuration,
    setCurrentTime,
    setFrequencies,
    setFrequencyBands,
    setBpm,
    setIsPlaying,
    setIsLoaded,
    reset,
  } = useAudioStore();

  useEffect(() => {
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.preload = 'auto';
    audioRef.current = audio;

    const processor = new AudioProcessor();
    processorRef.current = processor;

    processor.onFrequencyUpdate = (frequencies, bands, detectedBpm) => {
      setFrequencies(new Float32Array(frequencies));
      setFrequencyBands(bands);
      setBpm(detectedBpm);
    };

    processor.onTimeUpdate = (time, dur) => {
      setCurrentTime(time);
      if (dur && isFinite(dur)) {
        setDuration(dur);
      }
    };

    processor.onEnded = () => {
      setIsPlaying(false);
    };

    return () => {
      processor.dispose();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [setBpm, setCurrentTime, setDuration, setFrequencyBands, setFrequencies, setIsPlaying]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error || '文件无效');
        e.target.value = '';
        return;
      }

      const audio = audioRef.current;
      const processor = processorRef.current;
      if (!audio || !processor) return;

      reset();

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      audio.src = url;

      setAudioFile(file);
      setFileName(file.name);

      try {
        await new Promise<void>((resolve, reject) => {
          const onLoaded = () => {
            cleanup();
            resolve();
          };
          const onError = () => {
            cleanup();
            reject(new Error('音频加载失败'));
          };

          const cleanup = () => {
            audio.removeEventListener('loadedmetadata', onLoaded);
            audio.removeEventListener('error', onError);
          };

          audio.addEventListener('loadedmetadata', onLoaded);
          audio.addEventListener('error', onError);
        });

        await processor.init(audio);
        await processor.applyNormalization();

        setIsLoaded(true);
        setDuration(audio.duration);

        try {
          await audio.play();
          setIsPlaying(true);
          processor.startAnalysis();
        } catch {
          setIsPlaying(false);
        }

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          processor.stopAnalysis();
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : '音频加载失败');
        reset();
      }

      e.target.value = '';
    },
    [reset, setAudioFile, setDuration, setFileName, setIsLoaded, setIsPlaying],
  );

  const handlePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    const processor = processorRef.current;
    if (!audio || !processor || !isLoaded) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        processor.startAnalysis();
      } catch {
        // ignore
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      processor.stopAnalysis();
    }
  }, [isLoaded, setIsPlaying]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      if (!audio || !isLoaded || !duration) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = ratio * duration;
      setCurrentTime(audio.currentTime);
    },
    [duration, isLoaded, setCurrentTime],
  );

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <input
        type="file"
        id="audio-file-input"
        accept=".mp3,.wav,audio/mp3,audio/mpeg,audio/wav,audio/x-wav"
        onChange={handleFileChange}
        className="file-input"
      />

      {!isLoaded && (
        <div className="upload-overlay">
          <div className="upload-button-wrapper">
            <label htmlFor="audio-file-input" className="upload-button">
              <span>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0 }}
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                上传音频
              </span>
            </label>
            <p className="upload-hint">
              支持 mp3、wav 格式
              <br />
              最大 20MB
            </p>
          </div>
        </div>
      )}

      {isLoaded && (
        <div className="file-info">
          <div className="file-name" title={fileName}>
            {fileName}
          </div>
          <div className="file-duration">
            时长: {formatTime(duration)}
          </div>
        </div>
      )}

      <div className="control-bar">
        <button
          className="play-button"
          onClick={handlePlayPause}
          disabled={!isLoaded}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg
              className="play-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg
              className="play-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.27-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
            </svg>
          )}
        </button>

        <div className="progress-container">
          <span className="progress-time">{formatTime(currentTime)}</span>
          <div className="progress-bar" onClick={handleProgressClick}>
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-time">{formatTime(duration)}</span>
        </div>
      </div>

      {audioFile && bpm > 0 ? null : null}
    </>
  );
}
