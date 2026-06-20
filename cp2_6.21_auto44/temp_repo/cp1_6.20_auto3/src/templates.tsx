import React from 'react';
import { ResumeData } from './hooks/useResumeState';

export type TemplateId = 'minimal' | 'creative' | 'business';

export const renderMinimalTemplate = (data: ResumeData): JSX.Element => {
  const { personalInfo, education, workExperience } = data;

  return (
    <div
      style={{
        fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
        padding: '48px 56px',
        color: '#1a1a1a',
        background: '#ffffff',
        minHeight: '100%',
      }}
    >
      <header style={{ marginBottom: '32px', borderBottom: '2px solid #2C3E50', paddingBottom: '24px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0, color: '#2C3E50', letterSpacing: '-0.5px' }}>
          {personalInfo.name}
        </h1>
        <p style={{ fontSize: '18px', color: '#3498DB', margin: '8px 0 16px 0', fontWeight: 500 }}>
          {personalInfo.title}
        </p>
        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: '#666' }}>
          {personalInfo.email && <span>📧 {personalInfo.email}</span>}
          {personalInfo.phone && <span>📱 {personalInfo.phone}</span>}
          {personalInfo.location && <span>📍 {personalInfo.location}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3E50', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            个人简介
          </h2>
          <p style={{ fontSize: '13px', lineHeight: 1.8, color: '#444', margin: 0 }}>
            {personalInfo.summary}
          </p>
        </section>
      )}

      {workExperience.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3E50', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            工作经历
          </h2>
          {workExperience.map((work) => (
            <div key={work.id} style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                  {work.position} · {work.company}
                </h3>
                <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {work.startDate} - {work.endDate}
                </span>
              </div>
              {work.description && (
                <p style={{ fontSize: '13px', color: '#555', margin: '4px 0 8px 0', lineHeight: 1.6 }}>
                  {work.description}
                </p>
              )}
              {work.highlights.filter((h) => h.trim()).length > 0 && (
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                  {work.highlights.filter((h) => h.trim()).map((highlight, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: '#444', lineHeight: 1.8, marginBottom: '4px' }}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3E50', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            教育经历
          </h2>
          {education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a', margin: 0 }}>
                  {edu.school}
                </h3>
                <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {edu.startDate} - {edu.endDate}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#555', margin: '4px 0' }}>
                {edu.degree} · {edu.major}
              </p>
              {edu.description && (
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{edu.description}</p>
              )}
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export const renderCreativeTemplate = (data: ResumeData): JSX.Element => {
  const { personalInfo, education, workExperience } = data;

  return (
    <div
      style={{
        fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
        background: '#ffffff',
        minHeight: '100%',
        display: 'flex',
      }}
    >
      <div
        style={{
          width: '35%',
          background: 'linear-gradient(180deg, #2C3E50 0%, #34495E 100%)',
          padding: '40px 24px',
          color: '#fff',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3498DB, #2980B9)',
              margin: '0 auto 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '36px',
              fontWeight: 700,
            }}
          >
            {personalInfo.name.charAt(0)}
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>{personalInfo.name}</h1>
          <p style={{ fontSize: '14px', color: '#3498DB', margin: '8px 0 0 0', fontWeight: 500 }}>
            {personalInfo.title}
          </p>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0', color: '#3498DB', textTransform: 'uppercase', letterSpacing: '1px' }}>
            联系方式
          </h3>
          <div style={{ fontSize: '12px', lineHeight: 2 }}>
            {personalInfo.email && <div style={{ marginBottom: '4px' }}>✉️ {personalInfo.email}</div>}
            {personalInfo.phone && <div style={{ marginBottom: '4px' }}>📱 {personalInfo.phone}</div>}
            {personalInfo.location && <div>📍 {personalInfo.location}</div>}
          </div>
        </div>

        {education.length > 0 && (
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0', color: '#3498DB', textTransform: 'uppercase', letterSpacing: '1px' }}>
              教育经历
            </h3>
            {education.map((edu) => (
              <div key={edu.id} style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 500 }}>{edu.school}</div>
                <div style={{ fontSize: '11px', color: '#BDC3C7', marginTop: '2px' }}>
                  {edu.degree} · {edu.major}
                </div>
                <div style={{ fontSize: '11px', color: '#95A5A6', marginTop: '2px' }}>
                  {edu.startDate} - {edu.endDate}
                </div>
                {edu.description && (
                  <div style={{ fontSize: '11px', color: '#BDC3C7', marginTop: '4px', lineHeight: 1.5 }}>
                    {edu.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ width: '65%', padding: '40px 32px' }}>
        {personalInfo.summary && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3E50', margin: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '4px', height: '16px', background: '#3498DB', marginRight: '10px', borderRadius: '2px' }}></span>
              个人简介
            </h2>
            <p style={{ fontSize: '13px', lineHeight: 1.8, color: '#555', margin: 0 }}>
              {personalInfo.summary}
            </p>
          </div>
        )}

        {workExperience.length > 0 && (
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2C3E50', margin: '0 0 20px 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ width: '4px', height: '16px', background: '#3498DB', marginRight: '10px', borderRadius: '2px' }}></span>
              工作经历
            </h2>
            {workExperience.map((work, index) => (
              <div key={work.id} style={{ marginBottom: '24px', position: 'relative', paddingLeft: '20px' }}>
                {index < workExperience.length - 1 && (
                  <div style={{ position: 'absolute', left: '3px', top: '8px', bottom: '-20px', width: '2px', background: '#E8ECF0' }}></div>
                )}
                <div style={{ position: 'absolute', left: '-3px', top: '6px', width: '8px', height: '8px', borderRadius: '50%', background: '#3498DB' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#2C3E50', margin: 0 }}>
                    {work.position}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#888', background: '#F0F4F8', padding: '2px 8px', borderRadius: '4px' }}>
                    {work.startDate} - {work.endDate}
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#3498DB', fontWeight: 500, marginBottom: '6px' }}>
                  {work.company}
                </div>
                {work.description && (
                  <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0', lineHeight: 1.6 }}>
                    {work.description}
                  </p>
                )}
                {work.highlights.filter((h) => h.trim()).length > 0 && (
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '18px' }}>
                    {work.highlights.filter((h) => h.trim()).map((highlight, idx) => (
                      <li key={idx} style={{ fontSize: '12px', color: '#555', lineHeight: 1.8, marginBottom: '3px' }}>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const renderBusinessTemplate = (data: ResumeData): JSX.Element => {
  const { personalInfo, education, workExperience } = data;

  return (
    <div
      style={{
        fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '56px 64px',
        color: '#1a1a1a',
        background: '#ffffff',
        minHeight: '100%',
      }}
    >
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: 300, margin: 0, color: '#2C3E50', letterSpacing: '2px' }}>
          {personalInfo.name.toUpperCase()}
        </h1>
        <div style={{ width: '60px', height: '3px', background: '#3498DB', margin: '16px auto' }}></div>
        <p style={{ fontSize: '16px', color: '#2C3E50', margin: 0, letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 500 }}>
          {personalInfo.title}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '16px', fontSize: '13px', color: '#666' }}>
          {personalInfo.email && <span>{personalInfo.email}</span>}
          {personalInfo.phone && <span>|</span>}
          {personalInfo.phone && <span>{personalInfo.phone}</span>}
          {personalInfo.location && <span>|</span>}
          {personalInfo.location && <span>{personalInfo.location}</span>}
        </div>
      </header>

      {personalInfo.summary && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#2C3E50', margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #E0E0E0', paddingBottom: '8px' }}>
            职业概述
          </h2>
          <p style={{ fontSize: '13px', lineHeight: 1.9, color: '#333', margin: 0, textAlign: 'justify' }}>
            {personalInfo.summary}
          </p>
        </section>
      )}

      {workExperience.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#2C3E50', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #E0E0E0', paddingBottom: '8px' }}>
            职业经历
          </h2>
          {workExperience.map((work) => (
            <div key={work.id} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#2C3E50', margin: 0 }}>
                    {work.company}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#3498DB', margin: '4px 0', fontWeight: 500 }}>
                    {work.position}
                  </p>
                </div>
                <span style={{ fontSize: '12px', color: '#888', fontWeight: 500, whiteSpace: 'nowrap', marginLeft: '16px' }}>
                  {work.startDate} — {work.endDate}
                </span>
              </div>
              {work.description && (
                <p style={{ fontSize: '13px', color: '#555', margin: '8px 0', lineHeight: 1.7 }}>
                  {work.description}
                </p>
              )}
              {work.highlights.filter((h) => h.trim()).length > 0 && (
                <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                  {work.highlights.filter((h) => h.trim()).map((highlight, idx) => (
                    <li key={idx} style={{ fontSize: '13px', color: '#444', lineHeight: 1.9, marginBottom: '4px' }}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#2C3E50', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #E0E0E0', paddingBottom: '8px' }}>
            教育背景
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px' }}>
            {education.map((edu) => (
              <div key={edu.id} style={{ flex: '1', minWidth: '250px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#2C3E50', margin: 0 }}>
                    {edu.school}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#888', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                    {edu.startDate} - {edu.endDate}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#3498DB', margin: '4px 0', fontWeight: 500 }}>
                  {edu.degree} · {edu.major}
                </p>
                {edu.description && (
                  <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{edu.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export const getTemplateRenderer = (templateId: TemplateId): ((data: ResumeData) => JSX.Element) => {
  switch (templateId) {
    case 'minimal':
      return renderMinimalTemplate;
    case 'creative':
      return renderCreativeTemplate;
    case 'business':
      return renderBusinessTemplate;
    default:
      return renderMinimalTemplate;
  }
};

export const templateNames: Record<TemplateId, string> = {
  minimal: '简约风格',
  creative: '创意风格',
  business: '商务风格',
};
