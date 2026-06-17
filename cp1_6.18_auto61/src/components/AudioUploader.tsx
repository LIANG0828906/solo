import { useRef, useState, useCallback } from 'react';
import { Upload, Music } from 'lucide-react';
import { useGalleryStore } from '@/store/galleryStore';
import { analyzeAudio } from '@/modules/audioAnalyzer';
import { uploadAudio } from '@/api/mockApi';
import RippleButton from './RippleButton';
import EmotionTag from './EmotionTag';
import type { EmotionResult } from '@/types';

interface AudioUploaderProps {
  onAnalysisComplete?: (result: EmotionResult, file: File) => void;
}

export default function AudioUploader({ onAnalysisComplete }: AudioUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<EmotionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { uploadState, setUploadState, userInfo, addAudio } = useGalleryStore();

  const handleFileSelect = useCallback(async (file: File) => {
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(wav|mp3)$/i)) {
      setUploadState({ error: '请上传 WAV 或 MP3 格式的音频文件' });
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null);
    setUploadState({ error: null, isUploading: false, progress: 0 });

    setIsAnalyzing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));

      if (audioBuffer.duration > 30) {
        setUploadState({ error: '音频时长不能超过 30 秒' });
        setIsAnalyzing(false);
        audioContext.close();
        return;
      }

      audioContext.close();

      const result = await analyzeAudio(arrayBuffer);
      setAnalysisResult(result);
      onAnalysisComplete?.(result, file);

      setUploadState({ isUploading: true, progress: 0 });

      const audioItem = await uploadAudio(
        file,
        result.emotion,
        result.intensity,
        userInfo.id,
        (progress) => setUploadState({ progress })
      );

      addAudio(audioItem);
      setUploadState({ isUploading: false, progress: 100 });
    } catch (error) {
      console.error('Analysis error:', error);
      setUploadState({ error: '音频分析失败，请重试' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [setUploadState, userInfo.id, addAudio, onAnalysisComplete]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.uploadArea,
          ...(isDragging ? styles.uploadAreaDragging : {}),
        }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,.mp3,audio/wav,audio/mpeg"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
        <div style={styles.uploadIcon}>
          <Upload size={48} color="#6C63FF" />
        </div>
        <p style={styles.uploadTitle}>
          {selectedFile ? selectedFile.name : '点击或拖拽上传音频'}
        </p>
        <p style={styles.uploadHint}>支持 WAV 和 MP3 格式，最长 30 秒</p>

        {(uploadState.isUploading || isAnalyzing) && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width: `${isAnalyzing ? 50 : uploadState.progress}%`,
                }}
              />
            </div>
            <p style={styles.progressText}>
              {isAnalyzing ? '分析中...' : `上传中 ${uploadState.progress}%`}
            </p>
          </div>
        )}

        {uploadState.error && (
          <p style={styles.errorText}>{uploadState.error}</p>
        )}
      </div>

      {analysisResult && (
        <div style={styles.resultContainer}>
          <div style={styles.resultHeader}>
            <Music size={20} color="#6C63FF" />
            <span style={styles.resultLabel}>情绪分析结果</span>
          </div>
          <div style={styles.emotionDisplay}>
            <EmotionTag
              emotion={analysisResult.emotion}
              intensity={analysisResult.intensity}
              size="large"
            />
          </div>
        </div>
      )}

      {!selectedFile && (
        <div style={styles.buttonContainer}>
          <RippleButton onClick={handleClick} style={styles.uploadButton}>
            <span style={styles.buttonContent}>
              <Upload size={18} />
              选择文件
            </span>
          </RippleButton>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
  },
  uploadArea: {
    backgroundColor: '#1A1A2E',
    border: '2px dashed #2A2A44',
    borderRadius: '16px',
    padding: '48px 32px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
  },
  uploadAreaDragging: {
    borderColor: '#6C63FF',
    backgroundColor: '#6C63FF10',
  },
  uploadIcon: {
    marginBottom: '16px',
  },
  uploadTitle: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#FFFFFF',
    margin: '0 0 8px 0',
  },
  uploadHint: {
    fontSize: '14px',
    color: '#888899',
    margin: 0,
  },
  progressContainer: {
    marginTop: '24px',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#2A2A44',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6C63FF',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '12px',
    color: '#888899',
    marginTop: '8px',
  },
  errorText: {
    fontSize: '14px',
    color: '#FF6B6B',
    marginTop: '16px',
  },
  resultContainer: {
    marginTop: '32px',
    backgroundColor: '#1A1A2E',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #2A2A44',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  resultLabel: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#FFFFFF',
  },
  emotionDisplay: {
    display: 'flex',
    justifyContent: 'center',
    padding: '16px 0',
  },
  buttonContainer: {
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  uploadButton: {
    padding: '14px 32px',
    fontSize: '16px',
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
