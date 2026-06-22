import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaBriefcase, FaGraduationCap, FaCode, FaUsers, FaIndustry, FaEdit } from 'react-icons/fa';
import { useAppStore } from '../store';

const ResumeCard: React.FC = () => {
  const { resumeData } = useAppStore();

  if (!resumeData) return null;

  return (
    <div className="resume-card stagger-item">
      <div className="card-header">
        <h3 className="card-title">
          <FaUser className="title-icon" />
          简历信息
        </h3>
      </div>

      <div className="resume-section">
        <h4 className="section-title">
          <FaUser className="section-icon" /> 基本信息
        </h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">姓名</span>
            <div className="info-value-wrapper">
              <span className="info-value">{resumeData.name}</span>
              <button className="edit-btn"><FaEdit /></button>
            </div>
          </div>
          <div className="info-item">
            <span className="info-label"><FaEnvelope /> 邮箱</span>
            <div className="info-value-wrapper">
              <span className="info-value">{resumeData.email}</span>
              <button className="edit-btn"><FaEdit /></button>
            </div>
          </div>
          <div className="info-item">
            <span className="info-label"><FaPhone /> 电话</span>
            <div className="info-value-wrapper">
              <span className="info-value">{resumeData.phone}</span>
              <button className="edit-btn"><FaEdit /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="resume-section">
        <h4 className="section-title">
          <FaCode className="section-icon" /> 专业技能
        </h4>
        <div className="skills-tags">
          {resumeData.skills.map((skill, idx) => (
            <span key={idx} className="skill-tag skill-matched">{skill}</span>
          ))}
        </div>
      </div>

      <div className="resume-section">
        <h4 className="section-title">
          <FaBriefcase className="section-icon" /> 工作经历
        </h4>
        {resumeData.experience.map((exp, idx) => (
          <div key={idx} className="experience-item">
            <div className="exp-header">
              <span className="exp-position">{exp.position}</span>
              <span className="exp-duration">{exp.duration}</span>
            </div>
            <div className="exp-company">{exp.company}</div>
            {exp.description && <p className="exp-desc">{exp.description}</p>}
          </div>
        ))}
      </div>

      <div className="resume-section">
        <h4 className="section-title">
          <FaGraduationCap className="section-icon" /> 教育背景
        </h4>
        {resumeData.education.map((edu, idx) => (
          <div key={idx} className="education-item">
            <div className="edu-header">
              <span className="edu-school">{edu.school}</span>
              <span className="edu-duration">{edu.duration}</span>
            </div>
            <div className="edu-detail">{edu.degree} · {edu.major}</div>
          </div>
        ))}
      </div>

      <div className="resume-section">
        <h4 className="section-title">
          <FaUsers className="section-icon" /> 软技能
        </h4>
        <div className="skills-tags">
          {resumeData.softSkills.map((s, idx) => (
            <span key={idx} className="skill-tag skill-soft">{s}</span>
          ))}
        </div>
      </div>

      <div className="resume-section">
        <h4 className="section-title">
          <FaIndustry className="section-icon" /> 行业知识
        </h4>
        <div className="skills-tags">
          {resumeData.industryKnowledge.map((s, idx) => (
            <span key={idx} className="skill-tag skill-industry">{s}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeCard;
