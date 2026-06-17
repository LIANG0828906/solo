import React, { useState, useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { getDurationColor, getDurationRingSize, textDiff } from '../utils';
import type { Step } from '../types';

interface TimelineReviewProps {
  projectId: string;
}

export const TimelineReview: React.FC<TimelineReviewProps> = ({ projectId }) => {
  const { getProjectById } = useProjectStore();
  const project = getProjectById(projectId);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareStepA, setCompareStepA] = useState<string | null>(null);
  const [compareStepB, setCompareStepB] = useState<string | null>(null);
  const [compareImageA, setCompareImageA] = useState<number>(0);
  const [compareImageB, setCompareImageB] = useState<number>(0);

  if (!project) {
    return <div className="empty-state">项目不存在</div>;
  }

  const sortedSteps = useMemo(
    () => [...project.steps].sort((a, b) => a.createdAt - b.createdAt),
    [project.steps]
  );

  const stepA = sortedSteps.find(s => s.id === compareStepA) || null;
  const stepB = sortedSteps.find(s => s.id === compareStepB) || null;

  const diffResult = useMemo(() => {
    if (!stepA || !stepB) return [];
    return textDiff(stepA.notes, stepB.notes);
  }, [stepA, stepB]);

  const toggleExpand = (stepId: string) => {
    setExpandedStepId(expandedStepId === stepId ? null : stepId);
  };

  const getStepImageOptions = (step: Step | null) => {
    if (!step || step.images.length === 0) return [];
    return step.images.map((_, idx) => ({ value: idx, label: `图片 ${idx + 1}` }));
  };

  return (
    <div>
      <div className="review-controls">
        <button
          className={`btn ${compareMode ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCompareMode(!compareMode)}
        >
          {compareMode ? '退出对比模式' : '🔍 对比模式'}
        </button>
      </div>

      {compareMode && (
        <div className="compare-section">
          <div className="compare-images">
            <div className="compare-image-slot">
              {stepA && stepA.images[compareImageA] ? (
                <img src={stepA.images[compareImageA]} alt={stepA.title} />
              ) : (
                <div className="compare-image-placeholder">
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>选择步骤 A 的图片</div>
                </div>
              )}
              <div className="compare-selector">
                <select
                  value={compareStepA || ''}
                  onChange={(e) => {
                    setCompareStepA(e.target.value || null);
                    setCompareImageA(0);
                  }}
                >
                  <option value="">-- 选择步骤 A --</option>
                  {sortedSteps.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {stepA && stepA.images.length > 1 && (
                  <select
                    value={compareImageA}
                    onChange={(e) => setCompareImageA(parseInt(e.target.value))}
                    style={{ marginTop: '8px' }}
                  >
                    {getStepImageOptions(stepA).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="compare-image-slot">
              {stepB && stepB.images[compareImageB] ? (
                <img src={stepB.images[compareImageB]} alt={stepB.title} />
              ) : (
                <div className="compare-image-placeholder">
                  <div style={{ fontSize: '14px', marginBottom: '8px' }}>选择步骤 B 的图片</div>
                </div>
              )}
              <div className="compare-selector">
                <select
                  value={compareStepB || ''}
                  onChange={(e) => {
                    setCompareStepB(e.target.value || null);
                    setCompareImageB(0);
                  }}
                >
                  <option value="">-- 选择步骤 B --</option>
                  {sortedSteps.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
                {stepB && stepB.images.length > 1 && (
                  <select
                    value={compareImageB}
                    onChange={(e) => setCompareImageB(parseInt(e.target.value))}
                    style={{ marginTop: '8px' }}
                  >
                    {getStepImageOptions(stepB).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="compare-diff">
            <div className="diff-title">📝 笔记差异对比</div>
            {stepA && stepB ? (
              <div className="diff-content">
                {diffResult.length === 0 ? (
                  <p className="diff-unchanged">两段笔记内容完全相同</p>
                ) : (
                  diffResult.map((item, idx) => (
                    <p key={idx} className={`diff-${item.type}`}>
                      {item.type === 'added' && <strong>[新增] </strong>}
                      {item.type === 'removed' && <strong>[删除] </strong>}
                      {item.content}
                    </p>
                  ))
                )}
              </div>
            ) : (
              <div style={{ color: '#95a5a6', fontSize: '14px' }}>
                请选择两个步骤进行笔记对比
              </div>
            )}
          </div>
        </div>
      )}

      <div className="timeline" style={{ marginTop: compareMode ? '32px' : '0' }}>
        {sortedSteps.map((step, index) => {
          const ringColor = getDurationColor(step.duration);
          const ringSize = getDurationRingSize(step.duration);
          const isExpanded = expandedStepId === step.id;

          return (
            <div key={step.id} className="timeline-item">
              <div className="timeline-node">
                <div
                  className="duration-ring"
                  style={{
                    width: `${ringSize}px`,
                    height: `${ringSize}px`,
                    backgroundColor: ringColor,
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  {step.duration}'
                </div>
              </div>

              <div className="timeline-content" onClick={() => toggleExpand(step.id)}>
                <div className="timeline-header">
                  <div className="timeline-title">{step.title}</div>
                  <div className="timeline-stars">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span key={star} className={`star ${star <= step.quality ? 'filled' : ''}`}>
                        ★
                      </span>
                    ))}
                  </div>
                </div>

                {!isExpanded ? (
                  <div className="timeline-notes-summary">
                    {step.notes || '暂无笔记'}
                  </div>
                ) : (
                  <div className="timeline-expanded">
                    <div className="timeline-notes">{step.notes || '暂无笔记'}</div>
                    {step.images.length > 0 && (
                      <div className="timeline-images">
                        {step.images.map((img, imgIdx) => (
                          <img
                            key={imgIdx}
                            src={img}
                            alt={`${step.title} 图片 ${imgIdx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
