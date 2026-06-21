import React, { useState, useRef } from 'react';
import { useUploadStore } from '@/stores/uploadStore';
import styles from './UploadPanel.module.css';

export const UploadPanel: React.FC = () => {
  const {
    status,
    uploadProgress,
    transcribeProgress,
    transcript,
    fileName,
    error,
    uploadFile,
    loadDemoData,
    reset,
    renameSpeaker,
    setSpeakerNote,
  } = useUploadStore();

  const [isDragOver, setIsDragOver] = useState(false);
  const [editingSpeakerId, setEditingSpeakerId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/wav' || file.type === 'audio/x-wav' || file.name.endsWith('.mp3') || file.name.endsWith('.wav'))) {
      uploadFile(file);
    } else {
      alert('请上传MP3或WAV格式的音频文件');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRenameClick = (speakerId: string, currentName: string) => {
    setEditingSpeakerId(speakerId);
    setEditName(currentName);
  };

  const handleRenameSubmit = (speakerId: string) => {
    if (editName.trim()) {
      renameSpeaker(speakerId, editName.trim());
    }
    setEditingSpeakerId(null);
  };

  const handleNoteClick = (speakerId: string, currentNote: string) => {
    setEditingNoteId(speakerId);
    setEditNote(currentNote || '');
  };

  const handleNoteSubmit = (speakerId: string) => {
    setSpeakerNote(speakerId, editNote);
    setEditingNoteId(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>音频转写</h2>

      {status === 'idle' && (
        <>
          <div
            className={`${styles.uploadArea} ${isDragOver ? styles.uploadAreaDragOver : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleButtonClick}
          >
            <div className={styles.uploadIcon}>🎵</div>
            <p className={styles.uploadText}>拖拽音频文件到此处</p>
            <p className={styles.uploadHint}>支持 MP3 / WAV 格式，最大 50MB</p>
            <button className={styles.uploadButton} onClick={handleButtonClick}>
              选择文件
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,audio/mpeg,audio/wav"
              style={{ display: 'none' }}
              onChange={handleInputChange}
            />
          </div>
          <div style={{ textAlign: 'center' }}>
            <button
              className={styles.demoButton}
              onClick={(e) => {
                e.stopPropagation();
                loadDemoData();
              }}
            >
              加载示例数据体验
            </button>
          </div>
        </>
      )}

      {(status === 'uploading' || status === 'transcribing') && (
        <div className={styles.progressSection}>
          <div className={styles.progressLabel}>
            <span>{fileName}</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${uploadProgress}%` }}
            />
          </div>

          {status === 'transcribing' && (
            <>
              <div className={styles.transcribingIndicator}>
                <div className={styles.pulseAnimation}>
                  <div className={styles.pulseBar} />
                  <div className={styles.pulseBar} />
                  <div className={styles.pulseBar} />
                  <div className={styles.pulseBar} />
                  <div className={styles.pulseBar} />
                </div>
                <span className={styles.transcribingText}>
                  转写中... {transcribeProgress}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {status === 'completed' && (
        <div className={styles.fileInfo}>
          <span>{fileName}</span>
          <button className={styles.resetButton} onClick={reset}>
            重新上传
          </button>
        </div>
      )}

      {error && <div className={styles.errorText}>{error}</div>}

      <div className={styles.speakerSection}>
        <h3 className={styles.sectionTitle}>说话人</h3>
        {transcript?.speakers && transcript.speakers.length > 0 ? (
          <div className={styles.speakerList}>
            {transcript.speakers.map((speaker) => (
              <div
                key={speaker.id}
                className={styles.speakerItem}
                style={{ borderLeft: `4px solid ${speaker.color}` }}
              >
                <div className={styles.speakerHeader}>
                  <div
                    className={styles.speakerColorDot}
                    style={{ background: speaker.color }}
                  />
                  {editingSpeakerId === speaker.id ? (
                    <input
                      className={styles.renameInput}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => handleRenameSubmit(speaker.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRenameSubmit(speaker.id);
                        }
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      className={styles.speakerName}
                      onClick={() => handleRenameClick(speaker.id, speaker.name)}
                      title="点击重命名"
                    >
                      {speaker.name}
                    </span>
                  )}
                  <button
                    className={styles.actionButton}
                    onClick={() => handleRenameClick(speaker.id, speaker.name)}
                  >
                    ✏️
                  </button>
                </div>
                {editingNoteId === speaker.id ? (
                  <textarea
                    className={styles.noteInput}
                    value={editNote}
                    onChange={(e) => setEditNote(e.target.value)}
                    onBlur={() => handleNoteSubmit(speaker.id)}
                    placeholder="添加备注..."
                    autoFocus
                  />
                ) : (
                  <div
                    className={styles.speakerNote}
                    onClick={() => handleNoteClick(speaker.id, speaker.note || '')}
                    title="点击添加备注"
                  >
                    {speaker.note || '点击添加备注...'}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptySpeakers}>
            上传音频后将自动识别说话人
          </div>
        )}
      </div>
    </div>
  );
};
