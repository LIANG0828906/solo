import { useMemo, useState, useEffect } from 'react';
import type {
  JobRole,
  ParsedResult,
  MatchResult
} from '../types';
import { JOB_TEMPLATES, DEFAULT_JOB } from '../constants/jobTemplates';
import { computeMatchScore } from '../engine/ParserEngine';
import { MatchBarChart } from './MatchBarChart';
import { KeywordComparison } from './KeywordComparison';

interface MatchScoreProps {
  parsed: ParsedResult;
  initialJob?: JobRole;
  onJobChange?: (job: JobRole) => void;
  animationKey?: string | number;
}

const JOB_OPTIONS: JobRole[] = ['前端工程师', '数据工程师', '产品经理'];

export function MatchScore({
  parsed,
  initialJob = DEFAULT_JOB,
  onJobChange,
  animationKey
}: MatchScoreProps) {
  const [job, setJob] = useState<JobRole>(initialJob);
  const [barAnimKey, setBarAnimKey] = useState(0);

  useEffect(() => {
    if (initialJob && initialJob !== job) {
      setJob(initialJob);
    }
  }, [initialJob]);

  const result: MatchResult = useMemo(() => {
    const tpl = JOB_TEMPLATES[job];
    return computeMatchScore(
      parsed.skillScores,
      tpl.baseline,
      tpl.keywords,
      parsed.wordFrequencies
    );
  }, [parsed, job]);

  const handleJobChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as JobRole;
    setJob(next);
    setBarAnimKey((k) => k + 1);
    onJobChange?.(next);
  };

  const scoreTips =
    result.scoreColor === 'green'
      ? '整体匹配度优秀，可以投递该岗位'
      : result.scoreColor === 'orange'
      ? '整体匹配度中等，建议重点补齐薄弱维度'
      : '匹配度偏低，建议针对性提升核心技能';

  return (
    <div className="match-section">
      <div className="match-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select
            className="job-select"
            value={job}
            onChange={handleJobChange}
          >
            {JOB_OPTIONS.map((o) => (
              <option key={o} value={o}>
                🎯 {o}
              </option>
            ))}
          </select>
          <span
            style={{
              fontSize: 12,
              color: '#78909c',
              lineHeight: 1.6,
              maxWidth: 420
            }}
          >
            {JOB_TEMPLATES[job].description}
          </span>
        </div>

        <div className="match-score">
          <span className="match-score-label">岗位匹配总分</span>
          <span className={`match-score-value ${result.scoreColor}`}>
            {result.totalScore}
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#90a4ae',
              marginTop: 4,
              letterSpacing: 1
            }}
          >
            / 100
          </span>
        </div>
      </div>

      <div
        style={{
          padding: '10px 16px',
          borderRadius: 10,
          background:
            result.scoreColor === 'green'
              ? 'rgba(76,175,80,0.1)'
              : result.scoreColor === 'orange'
              ? 'rgba(255,152,0,0.1)'
              : 'rgba(244,67,54,0.08)',
          fontSize: 13,
          color:
            result.scoreColor === 'green'
              ? '#2e7d32'
              : result.scoreColor === 'orange'
              ? '#e65100'
              : '#c62828',
          fontWeight: 500
        }}
      >
        {scoreTips}
      </div>

      <MatchBarChart
        comparisons={result.comparisons}
        animationKey={`${animationKey}-${barAnimKey}`}
      />

      <KeywordComparison result={result} />
    </div>
  );
}

export default MatchScore;
