import React from 'react';
import { FaBuilding, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { JobRequirement, MatchResult } from '../types';
import { useAppStore } from '../store';

interface JobCardProps {
  job: JobRequirement;
  onClick: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const { resumeData, matchResults, selectedJobId } = useAppStore();
  const matchResult: MatchResult | undefined = matchResults[job.id];
  const isSelected = selectedJobId === job.id;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

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
    const score = matchResult?.overallScore ?? 0;
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);
    return (
      <div className="ring-progress">
        <svg width="72" height="72" viewBox="0 0 72 72">
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
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 36 36)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="ring-score" style={{ color }}>
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
