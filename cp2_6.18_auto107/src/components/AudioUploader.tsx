import React, { useRef, useCallback } from 'react';
import { useAudioStore } from '../store/audioStore';
import { analyzeAudio } from '../utils/audioAnalyzer';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp3'];

export const AudioUploader: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setAudioFile, setFileName, setDuration, setBpm, setIsPlaying } =
    useAudioStore();
  const analysisRef = useRef<ReturnType<typeof useAudioStore> | null>(null);
  const storeRef = useRef(useAudioStore);

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav)$/i)) {
        alert('Please upload an MP3 or WAV file');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        alert('File size exceeds 20MB limit');
        return;
      }

      try {
        const result = await analyzeAudio(file);
        setAudioFile(file);
        setFileName(file.name);
        setDuration(result.duration);
        setBpm(result.bpm);
        setIsPlaying(true);

        result.source.start(0);

        (window as any).__audioAnalysis = result;
        (window as any).__audioStore = storeRef.current;

        result.source.onended = () => {
          useAudioStore.getState().setIsPlaying(false);
        };
      } catch (e) {
        console.error('Failed to analyze audio:', e);
        alert('Failed to process audio file');
      }
    },
    [setAudioFile, setFileName, setDuration, setBpm, setIsPlaying]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="uploader-wrapper">
      <input
        ref={inputRef}
        type="file"
        accept=".mp3,.wav"
        style={{ display: 'none' }}
        onChange={onInputChange}
      />
      <button
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
      >
        Upload Audio
      </button>
    </div>
  );
};
