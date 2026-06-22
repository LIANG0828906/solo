import React, { useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { Theme } from '../styles/themes';
import SkillRadar from './SkillRadar';
import { ResumeData } from './ResumeForm';

interface ResumePreviewProps {
  data: ResumeData;
  theme: Theme;
}

export interface ResumePreviewRef {
  getResumeElement: () => HTMLDivElement | null;
}

const ResumePreview = forwardRef<ResumePreviewRef, ResumePreviewProps>(
  ({ data, theme }, ref) => {
    const resumeRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      getResumeElement: () => resumeRef.current
    }));

    const resumeStyle: React.CSSProperties = {
      backgroundColor: theme.backgroundColor,
      color: theme.textColor,
      fontFamily: theme.bodyFont,
      transition: 'background-color 0.4s ease, color 0.4s ease, font-family 0.4s ease'
    };

    const headingStyle: React.CSSProperties = {
      color: theme.primaryColor,
      fontFamily: theme.headingFont,
      transition: 'color 0.4s ease, font-family 0.4s ease'
    };

    const accentStyle: React.CSSProperties = {
      color: theme.accentColor,
      transition: 'color 0.4s ease'
    };

    const sectionBorderStyle: React.CSSProperties = {
      borderColor: theme.primaryColor,
      transition: 'border-color 0.4s ease'
    };

    return (
      <div style={styles.previewContainer}>
        <div style={styles.paperWrapper}>
          <div
            ref={resumeRef}
            style={{ ...styles.resumePaper, ...resumeStyle }}
          >
            <div style={styles.header}>
              <h1 style={{ ...styles.name, ...headingStyle }}>
                {data.basicInfo.name || '您的姓名'}
              </h1>
              <p style={{ ...styles.title, ...accentStyle }}>
                {data.basicInfo.title || '目标职位'}
              </p>
              <div style={styles.contactInfo}>
                {data.basicInfo.email && (
                  <span style={styles.contactItem}>📧 {data.basicInfo.email}</span>
                )}
                {data.basicInfo.phone && (
                  <span style={styles.contactItem}>📱 {data.basicInfo.phone}</span>
                )}
              </div>
            </div>

            {data.basicInfo.summary && (
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, ...headingStyle, ...sectionBorderStyle }}>
                  个人简介
                </h2>
                <p style={styles.sectionContent}>{data.basicInfo.summary}</p>
              </div>
            )}

            {data.workExperience.length > 0 && (
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, ...headingStyle, ...sectionBorderStyle }}>
                  工作经历
                </h2>
                {data.workExperience.map((work) => (
                  <div key={work.id} style={styles.experienceItem}>
                    <div style={styles.experienceHeader}>
                      <h3 style={{ ...styles.experienceTitle, ...headingStyle }}>
                        {work.position || '职位'}
                      </h3>
                      <span style={{ ...styles.experiencePeriod, ...accentStyle }}>
                        {work.period || '时间'}
                      </span>
                    </div>
                    <p style={{ ...styles.experienceCompany, ...accentStyle }}>
                      {work.company || '公司名称'}
                    </p>
                    {work.description && (
                      <p style={styles.sectionContent}>{work.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {data.education.length > 0 && (
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, ...headingStyle, ...sectionBorderStyle }}>
                  教育经历
                </h2>
                {data.education.map((edu) => (
                  <div key={edu.id} style={styles.experienceItem}>
                    <div style={styles.experienceHeader}>
                      <h3 style={{ ...styles.experienceTitle, ...headingStyle }}>
                        {edu.school || '学校名称'}
                      </h3>
                      <span style={{ ...styles.experiencePeriod, ...accentStyle }}>
                        {edu.period || '时间'}
                      </span>
                    </div>
                    <p style={{ ...styles.experienceCompany, ...accentStyle }}>
                      {edu.major || '专业'}
                    </p>
                    {edu.description && (
                      <p style={styles.sectionContent}>{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {data.skills.length > 0 && (
              <div style={styles.section}>
                <h2 style={{ ...styles.sectionTitle, ...headingStyle, ...sectionBorderStyle }}>
                  技能雷达图
                </h2>
                <div style={styles.radarContainer}>
                  <SkillRadar skills={data.skills} theme={theme} size={220} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = 'ResumePreview';

const styles: Record<string, React.CSSProperties> = {
  previewContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '24px',
    backgroundColor: '#fafafa',
    overflow: 'auto'
  },
  paperWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    flex: 1
  },
  resumePaper: {
    width: '794px',
    minHeight: '1123px',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
    padding: '60px 50px',
    overflow: 'hidden'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '2px solid #eee'
  },
  name: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '8px'
  },
  title: {
    fontSize: '18px',
    fontWeight: 500,
    marginBottom: '12px'
  },
  contactInfo: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    fontSize: '13px'
  },
  contactItem: {
    color: '#666'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '2px solid'
  },
  sectionContent: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#555'
  },
  experienceItem: {
    marginBottom: '16px'
  },
  experienceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  experienceTitle: {
    fontSize: '15px',
    fontWeight: 600
  },
  experiencePeriod: {
    fontSize: '13px',
    fontWeight: 500
  },
  experienceCompany: {
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '6px'
  },
  radarContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '10px 0'
  }
};

export default memo(ResumePreview);
