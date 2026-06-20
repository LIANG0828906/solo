import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '@/components/CameraCapture';
import RecordButton from '@/components/RecordButton';
import { useTrainingStore } from '@/stores/trainingStore';
import { compareSequence } from '@/calculators/PoseComparator';
import referencePoses from '@/data/referencePoses.json';
import type { ActionType } from '@/types';
import styles from './TrainingPage.module.css';

const actions: { key: ActionType; label: string; icon: string }[] = [
  { key: 'squat', label: '深蹲', icon: '🦵' },
  { key: 'pushup', label: '俯卧撑', icon: '💪' },
  { key: 'pullup', label: '引体向上', icon: '🏋️' },
];

export default function TrainingPage() {
  const {
    currentAction,
    setCurrentAction,
    recordedFrames,
    recordingStatus,
    startTime,
    saveRecord,
  } = useTrainingStore();
  const [elapsedTime, setElapsedTime] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let interval: number | undefined;
    if (recordingStatus === 'recording' && startTime) {
      interval = window.setInterval(() => {
        setElapsedTime((Date.now() - startTime) / 1000);
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingStatus, startTime]);

  const handleStopRecording = () => {
    if (recordedFrames.length === 0) return;

    const result = compareSequence(recordedFrames, currentAction);
    const duration = (Date.now() - (startTime || Date.now())) / 1000;
    const refPose = referencePoses[currentAction as keyof typeof referencePoses];

    saveRecord(
      refPose?.actionName || currentAction,
      recordedFrames,
      result.frameResults,
      result.deviationMap,
      result.totalScore,
      duration
    );

    navigate('/report');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>开始训练</h1>
        <div className={styles.actionSelector}>
          {actions.map((action) => (
            <button
              key={action.key}
              className={`${styles.actionBtn} ${currentAction === action.key ? styles.active : ''}`}
              onClick={() => setCurrentAction(action.key)}
              disabled={recordingStatus === 'recording'}
            >
              <span className={styles.actionIcon}>{action.icon}</span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.cameraArea}>
        <CameraCapture width={640} height={480} />
      </div>

      <div className={styles.controls}>
        {recordingStatus === 'recording' && (
          <div className={styles.timer}>
            <span className={styles.timerLabel}>录制时长</span>
            <span className={styles.timerValue}>{formatTime(elapsedTime)}</span>
            <div className={styles.recordingIndicator}>
              <span className={styles.recordingDot} />
              录制中
            </div>
          </div>
        )}

        <RecordButton onStop={handleStopRecording} />

        {recordingStatus === 'idle' && recordedFrames.length > 0 && (
          <button
            className={styles.secondaryBtn}
            onClick={handleStopRecording}
          >
            生成报告
          </button>
        )}
      </div>
    </div>
  );
}
