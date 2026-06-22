import type { ExperienceItem } from '../types';
import { TimelineCard } from './TimelineCard';

interface ExperienceTimelineProps {
  experiences: ExperienceItem[];
}

export function ExperienceTimeline({ experiences }: ExperienceTimelineProps) {
  if (experiences.length === 0) {
    return (
      <div className="chart-card">
        <h3 className="chart-title">工作经历时间线</h3>
        <div
          style={{
            padding: '48px 16px',
            textAlign: 'center',
            color: '#90a4ae',
            fontSize: 14
          }}
        >
          未能从简历中提取到工作经历信息。
          <br />
          请确保简历中有公司名、职位和起止年月。
        </div>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3 className="chart-title">
        工作经历时间线
        <span
          style={{
            fontSize: 12,
            fontWeight: 400,
            color: '#90a4ae',
            marginLeft: 8
          }}
        >
          共 {experiences.length} 段经历，点击卡片展开详情
        </span>
      </h3>
      <div className="timeline">
        {experiences.map((item, idx) => (
          <TimelineCard
            key={item.id}
            item={item}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}

export default ExperienceTimeline;
