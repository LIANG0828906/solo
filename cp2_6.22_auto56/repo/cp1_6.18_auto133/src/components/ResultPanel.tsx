import React from 'react';
import type { Option } from '@/stores/selectionStore';
import type { FeedbackEntry } from '@/data/feedbackPool';

interface ResultPanelProps {
  lockedOption: Option;
  feedback: FeedbackEntry;
}

const ResultPanel: React.FC<ResultPanelProps> = React.memo(
  ({ lockedOption, feedback }) => {
    return (
      <div className="result-panel">
        <div className="result-header">
          ✦ 已锁定: {lockedOption.title}
        </div>
        <div className="result-row result-stage">{feedback.stageDesc}</div>
        <div className="result-row result-sound">
          ♪ {feedback.soundEffect}
        </div>
        <div className="result-row result-filter">
          <span>色彩滤镜</span>
          <div
            className="color-swatch"
            style={{ background: feedback.colorFilter }}
          />
          <span className="filter-hex">{feedback.colorFilter}</span>
        </div>
      </div>
    );
  }
);

ResultPanel.displayName = 'ResultPanel';

export default ResultPanel;
