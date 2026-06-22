import React from 'react';
import { FaBuilding, FaMapMarkerAlt, FaStar } from 'react-icons/fa';
import { JobRequirement, MatchResult } from '../types';
import { useAppStore } from '../store';

interface JobCardProps {
  job: JobRequirement;
  onClick: () => void;
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

function hsl(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  return `rgb(${r},${g},${b})`;
}

function getScoreColorHsl(score: number): { h: number; s: number; l: number } {
  const redH = 0;
  const redS = 0.8;
  const redL = 0.58;
  const orangeH = 28;
  const orangeS = 0.95;
  const orangeL = 0.53;
  const greenH = 142;
  const greenS = 0.6;
  const greenL = 0.45;

  let h: number, s: number, l: number;
  if (score <= 50) {
    const t = score / 50;
    h = redH + (orangeH - redH) * t;
    s = redS + (orangeS - redS) * t;
    l = redL + (orangeL - redL) * t;
  } else {
    const t = (score - 50) / 50;
    h = orangeH + (greenH - orangeH) * t;
    s = orangeS + (greenS - orangeS) * t;
    l = orangeL + (greenL - orangeL) * t;
  }
  return { h, s, l };
}

function getScoreColor(score: number): string {
  const { h, s, l } = getScoreColorHsl(score);
  return hsl(h, s, l);
}

function lighterColor(score: number, factor: number = 0.2): string {
  const { h, s, l } = getScoreColorHsl(score);
  const newL = Math.min(1, l + factor * (1 - l));
  return hsl(h, s, newL);
}

function darkerColor(score: number, factor: number = 0.15): string {
  const { h, s, l } = getScoreColorHsl(score);
  const newL = Math.max(0, l * (1 - factor));
  return hsl(h, s, newL);
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
  const startColor = darkerColor(Math.max(score - 30, 0), 0.05);
  const midColor = lighterColor(Math.max(score - 15, 0), 0.1);
  const endColor = getScoreColor(score);
  const textColor = getScoreColor(score);

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
              <stop offset="50%" stopColor={midColor} />
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
            style={{
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease',
            }}
          />
        </svg>
        <div
          className="ring-score"
          style={{
            color: textColor,
            transition: 'color 0.4s ease',
            textShadow: score > 70 ? '0 0 8px rgba(76, 175, 80, 0.3)' : 'none',
          }}
        >
          {matchResult ? `${score}%` : '--'}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`job-card stagger-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{
        willChange: 'transform, box-shadow',
      }}
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
