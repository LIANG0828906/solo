import React from 'react';
import { FaBuilding, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { JobRequirement, MatchResult } from '../types';
import { useAppStore } from '../store';

interface JobCardProps {
  job: JobRequirement;
  onClick: () => void;
}

function getScoreGradientStops(score: number): string {
  if (score <= 0) return '#f44336';
  if (score <= 30) {
    const t = score / 30;
    const r = 244;
    const g = Math.round(67 + t * (152 - 67));
    const b = Math.round(54 + t * (0 - 54));
    return `rgb(${r},${g},${b})`;
  }
  if (score <= 70) {
    const t = (score - 30) / 40;
    const r = Math.round(255 - t * (255 - 76));
    const g = Math.round(152 + t * (175 - 152));
    const b = Math.round(0 + t * (80 - 0));
    return `rgb(${r},${g},${b})`;
  }
  const t = (score - 70) / 30;
  const r = Math.round(76 - t * 28);
  const g = Math.round(175 - t * 4);
  const b = Math.round(80 - t * 0);
  return `rgb(${r},${g},${b})`;
}

function getRingGradientId(jobId: string): string {
  return `ring-grad-${jobId}`;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const { resumeData, matchResults, selectedJobId } = useAppStore();
  const matchResult: MatchResult | undefined = matchResults[job.id];
  const isSelected = selectedJobId === job.id;

  const score = matchResult?.overallScore ?? 0;
  const gradientId = getRingGradientId(job.id);
  const startColor = getScoreGradientStops(Math.max(score - 20, 0));
  const endColor = getScoreGradientStops(score);
  const textColor = getScoreGradientStops(score);

  const renderSkillTags = () => {
    if (!resumeData || !matchResult) {
      return job.requiredSkills.slice(0, 4).map((skill, idx) => (
        <span key={idx} className="job-skill-tag skill-neutral">{skill}</span>
      ));
    }
    return job.requiredSkills.slice(0, 4).map((skill, idx) => {
      const isMatched = matchResult.matchedSkills.some(
        (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
      );
      const isMissing = matchResult.missingSkills.some(
        (s) => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase())
      );
      let cls = 'skill-neutral';
      if (isMatched) cls = 'skill-matched';
      else if (isMissing) cls = 'skill-missing';
      return <span key={idx} className={`job-skill-tag ${cls}`}>{skill}</span>;
    });
  };

  const renderRingProgress = () => {
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
      <div className="ring-progress">
        <svg width="72" height="72" viewBox="0 0 72 72">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="#3a3a4e"
            strokeWidth="8"
          />
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="ring-score" style={{ color: textColor }}>
          {matchResult ? `${score}%` : '--'}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`job-card stagger-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="job-card-header">
        <div className="job-info">
          <h4 className="job-title">{job.title}</h4>
          <div className="job-meta">
            <span className="job-meta-item">
              <FaBuilding /> {job.company}
            </span>
            <span className="job-meta-item">
              <FaMapMarkerAlt /> {job.location}
            </span>
          </div>
        </div>
        {renderRingProgress()}
      </div>
      <p className="job-desc">{job.description}</p>
      <div className="job-skill-tags">
        {renderSkillTags()}
        {job.requiredSkills.length > 4 && (
          <span className="job-skill-tag skill-neutral">+{job.requiredSkills.length - 4}</span>
        )}
      </div>
      <div className="job-footer">
        <span className="job-industry">
          <FaStar /> {job.industry}
        </span>
        <span className="job-exp">需{job.experienceYears}年+</span>
      </div>
    </div>
  );
};

export default JobCard;
