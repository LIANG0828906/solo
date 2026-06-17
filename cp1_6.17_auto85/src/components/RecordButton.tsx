import { useState } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import styles from './RecordButton.module.css';

interface RecordButtonProps {
  onStop?: () => void;
}

export default function RecordButton({ onStop }: RecordButtonProps) {
  const { recordingStatus, startRecording, stopRecording } = useTrainingStore();
  const [isPressed, setIsPressed] = useState(false);

  const isRecording = recordingStatus === 'recording';

  const handleClick = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);

    if (isRecording) {
      stopRecording();
      onStop?.();
    } else {
      startRecording();
    }
  };

  return (
    <button
      className={`${styles.recordButton} ${isRecording ? styles.recording : ''} ${isPressed ? styles.pressed : ''}`}
      onClick={handleClick}
      aria-label={isRecording ? '停止录制' : '开始录制'}
    >
      {isRecording && <div className={styles.pulseRing} />}
      {isRecording && <div className={styles.pulseRing2} />}
      <div className={styles.innerCircle}>
        {isRecording ? (
          <div className={styles.stopIcon} />
        ) : (
          <div className={styles.playIcon} />
        )}
      </div>
    </button>
  );
}
