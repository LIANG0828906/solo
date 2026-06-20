import { useState, useEffect, useRef, useCallback } from 'react';
import { useTrainingStore } from '@/stores/trainingStore';
import { getScoreColor, getSeverityColor } from '@/calculators/PoseComparator';
import { POSE_CONNECTIONS } from '@/types';
import type { Landmark, DeviationMap, FrameComparisonResult } from '@/types';
import referencePoses from '@/data/referencePoses.json';
import styles from './TrainingReport.module.css';

interface TrainingReportProps {
  recordId?: string;
}

export default function TrainingReport({ recordId }: TrainingReportProps) {
  const { currentReport, history, currentAction } = useTrainingStore();
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const userCanvasRef = useRef<HTMLCanvasElement>(null);
  const refCanvasRef = useRef<HTMLCanvasElement>(null);

  const record = recordId
    ? history.find((r) => r.id === recordId)
    : currentReport;

  const score = record?.totalScore || 0;
  const deviationMap = record?.deviationMap || {};
  const frameResults = record?.frameResults || [];
  const frames = record?.frames || [];

  const currentFrameResult: FrameComparisonResult | undefined =
    frameResults[currentFrameIndex];

  const drawSkeleton = useCallback(
    (
      canvas: HTMLCanvasElement,
      landmarks: Landmark[],
      deviations?: DeviationMap
    ) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const getLandmarkColor = (index: number): string => {
        if (!deviations) return '#00FF88';
        for (const data of Object.values(deviations)) {
          if (data.landmarkIndices.includes(index)) {
            return getSeverityColor(data.severity);
          }
        }
        return '#00FF88';
      };

      for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (!start || !end) continue;

        const startColor = getLandmarkColor(startIdx);
        const endColor = getLandmarkColor(endIdx);

        const gradient = ctx.createLinearGradient(
          start.x * canvas.width,
          start.y * canvas.height,
          end.x * canvas.width,
          end.y * canvas.height
        );
        gradient.addColorStop(0, startColor);
        gradient.addColorStop(1, endColor);

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.8;
        ctx.moveTo(start.x * canvas.width, start.y * canvas.height);
        ctx.lineTo(end.x * canvas.width, end.y * canvas.height);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      for (let i = 0; i < landmarks.length; i++) {
        const landmark = landmarks[i];
        if (!landmark) continue;

        const color = getLandmarkColor(i);

        ctx.beginPath();
        ctx.arc(
          landmark.x * canvas.width,
          landmark.y * canvas.height,
          5,
          0,
          2 * Math.PI
        );
        ctx.fillStyle = color;
        ctx.fill();

        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    },
    []
  );

  useEffect(() => {
    if (!record || frames.length === 0) return;

    const userLandmarks = frames[currentFrameIndex]?.landmarks || [];
    const refPose = referencePoses[currentAction as keyof typeof referencePoses];

    if (userCanvasRef.current && userLandmarks.length > 0) {
      drawSkeleton(
        userCanvasRef.current,
        userLandmarks,
        currentFrameResult?.deviations
      );
    }

    if (refCanvasRef.current && refPose) {
      drawSkeleton(refCanvasRef.current, refPose.landmarks);
    }
  }, [currentFrameIndex, record, frames, currentAction, currentFrameResult, drawSkeleton]);

  const bodyParts = [
    { key: 'head', label: '头部' },
    { key: 'shoulders', label: '肩部' },
    { key: 'leftArm', label: '左臂' },
    { key: 'rightArm', label: '右臂' },
    { key: 'torso', label: '躯干' },
    { key: 'leftLeg', label: '左腿' },
    { key: 'rightLeg', label: '右腿' },
  ];

  if (!record) {
    return (
      <div className={styles.empty}>
        <p>暂无训练数据</p>
      </div>
    );
  }

  return (
    <div className={styles.report}>
      <div className={styles.scoreSection}>
        <div className={styles.scoreLabel}>综合评分</div>
        <div
          className={styles.scoreValue}
          style={{ color: getScoreColor(score) }}
        >
          {score}
        </div>
        <div className={styles.scoreSubtitle}>
          {score >= 85 ? '动作标准，继续保持！' : score >= 60 ? '动作基本标准，仍有提升空间' : '动作需要改进'}
        </div>
      </div>

      <div className={styles.heatmapSection}>
        <h3 className={styles.sectionTitle}>偏差热力图</h3>
        <div className={styles.heatmapBody}>
          <div className={styles.bodyOutline}>
            <svg viewBox="0 0 200 400" className={styles.bodySvg}>
              <ellipse cx="100" cy="40" rx="30" ry="35" fill="#2D2D3F" />
              <rect x="70" y="70" width="60" height="100" rx="10" fill="#2D2D3F" />
              <rect x="20" y="75" width="45" height="15" rx="7" fill="#2D2D3F" />
              <rect x="135" y="75" width="45" height="15" rx="7" fill="#2D2D3F" />
              <rect x="30" y="85" width="12" height="80" rx="6" fill="#2D2D3F" />
              <rect x="158" y="85" width="12" height="80" rx="6" fill="#2D2D3F" />
              <rect x="75" y="165" width="20" height="110" rx="10" fill="#2D2D3F" />
              <rect x="105" y="165" width="20" height="110" rx="10" fill="#2D2D3F" />
              <rect x="72" y="270" width="25" height="80" rx="12" fill="#2D2D3F" />
              <rect x="103" y="270" width="25" height="80" rx="12" fill="#2D2D3F" />

              <ellipse
                cx="100"
                cy="40"
                rx="30"
                ry="35"
                fill={getSeverityColor(deviationMap.head?.severity || 'good')}
                opacity={deviationMap.head ? 0.6 : 0.2}
              />
              <rect
                x="70"
                y="65"
                width="60"
                height="25"
                rx="10"
                fill={getSeverityColor(deviationMap.shoulders?.severity || 'good')}
                opacity={deviationMap.shoulders ? 0.6 : 0.2}
              />
              <rect
                x="20"
                y="75"
                width="45"
                height="90"
                rx="7"
                fill={getSeverityColor(deviationMap.leftArm?.severity || 'good')}
                opacity={deviationMap.leftArm ? 0.6 : 0.2}
              />
              <rect
                x="135"
                y="75"
                width="45"
                height="90"
                rx="7"
                fill={getSeverityColor(deviationMap.rightArm?.severity || 'good')}
                opacity={deviationMap.rightArm ? 0.6 : 0.2}
              />
              <rect
                x="70"
                y="85"
                width="60"
                height="85"
                rx="10"
                fill={getSeverityColor(deviationMap.torso?.severity || 'good')}
                opacity={deviationMap.torso ? 0.6 : 0.2}
              />
              <rect
                x="75"
                y="165"
                width="20"
                height="185"
                rx="10"
                fill={getSeverityColor(deviationMap.leftLeg?.severity || 'good')}
                opacity={deviationMap.leftLeg ? 0.6 : 0.2}
              />
              <rect
                x="105"
                y="165"
                width="20"
                height="185"
                rx="10"
                fill={getSeverityColor(deviationMap.rightLeg?.severity || 'good')}
                opacity={deviationMap.rightLeg ? 0.6 : 0.2}
              />
            </svg>
          </div>

          <div className={styles.heatmapLegend}>
            {bodyParts.map((part) => {
              const data = deviationMap[part.key];
              return (
                <div key={part.key} className={styles.legendItem}>
                  <div
                    className={styles.legendColor}
                    style={{
                      backgroundColor: data
                        ? getSeverityColor(data.severity)
                        : '#2D2D3F',
                    }}
                  />
                  <span className={styles.legendLabel}>{part.label}</span>
                  <span className={styles.legendValue}>
                    {data ? `${Math.round(data.deviationPercent * 100)}%` : '--'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.playbackSection}>
        <h3 className={styles.sectionTitle}>逐帧回放</h3>

        <div className={styles.frameComparison}>
          <div className={styles.frameBox}>
            <div className={styles.frameLabel}>你的动作</div>
            <canvas
              ref={userCanvasRef}
              className={styles.frameCanvas}
              width={300}
              height={400}
            />
            <div className={styles.frameScore} style={{ color: getScoreColor(currentFrameResult?.totalScore || 0) }}>
              {Math.round(currentFrameResult?.totalScore || 0)} 分
            </div>
          </div>

          <div className={styles.frameBox}>
            <div className={styles.frameLabel}>标准动作</div>
            <canvas
              ref={refCanvasRef}
              className={styles.frameCanvas}
              width={300}
              height={400}
            />
            <div className={styles.frameScoreReference}>参考</div>
          </div>
        </div>

        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max={Math.max(0, frames.length - 1)}
            value={currentFrameIndex}
            onChange={(e) => setCurrentFrameIndex(Number(e.target.value))}
            className={styles.slider}
          />
          <div className={styles.sliderInfo}>
            <span>帧 {currentFrameIndex + 1}</span>
            <span>共 {frames.length} 帧</span>
          </div>
        </div>
      </div>
    </div>
  );
}
