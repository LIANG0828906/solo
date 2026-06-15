import type { ResumeData, TemplateType, ResumeModule, PersonalData, WorkExperience, Education, Skill, Project, ModuleType } from '../client/types.js';
import { MODULE_LABELS } from '../client/types.js';

const MODULE_ORDER: ModuleType[] = ['personal', 'work', 'education', 'skills', 'projects'];

function getModuleByType(modules: ResumeModule[], type: ModuleType): ResumeModule | undefined {
  return modules.find(m => m.type === type);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderPersonalHtml(data: PersonalData, avatarUrl: string, style: 'simple' | 'sidebar' | 'creative'): string {
  const e = escapeHtml;
  if (style === 'sidebar') {
    return `
      <div class="personal-sidebar">
        ${avatarUrl ? `<img class="avatar" src="${e(avatarUrl)}" alt="${e(data.name)}" />` : ''}
        <h1 class="name">${e(data.name)}</h1>
        <p class="title">${e(data.title)}</p>
        <div class="contact-list">
          ${data.email ? `<div class="contact-item">📧 ${e(data.email)}</div>` : ''}
          ${data.phone ? `<div class="contact-item">📱 ${e(data.phone)}</div>` : ''}
          ${data.location ? `<div class="contact-item">📍 ${e(data.location)}</div>` : ''}
        </div>
        ${data.summary ? `<div class="summary">${e(data.summary)}</div>` : ''}
      </div>`;
  }
  if (style === 'creative') {
    return `
      <div class="personal-creative">
        <div class="personal-header">
          ${avatarUrl ? `<img class="avatar" src="${e(avatarUrl)}" alt="${e(data.name)}" />` : ''}
          <div class="personal-header-text">
            <h1 class="name">${e(data.name)}</h1>
            <p class="title">${e(data.title)}</p>
          </div>
        </div>
        <div class="contact-row">
          ${data.email ? `<span class="tag">📧 ${e(data.email)}</span>` : ''}
          ${data.phone ? `<span class="tag">📱 ${e(data.phone)}</span>` : ''}
          ${data.location ? `<span class="tag">📍 ${e(data.location)}</span>` : ''}
        </div>
        ${data.summary ? `<div class="summary-card"><p>${e(data.summary)}</p></div>` : ''}
      </div>`;
  }
  return `
    <div class="personal-simple">
      ${avatarUrl ? `<img class="avatar" src="${e(avatarUrl)}" alt="${e(data.name)}" />` : ''}
      <h1 class="name">${e(data.name)}</h1>
      <p class="title">${e(data.title)}</p>
      <div class="contact-row">
        ${data.email ? `<span>${e(data.email)}</span>` : ''}
        ${data.phone ? `<span>${e(data.phone)}</span>` : ''}
        ${data.location ? `<span>${e(data.location)}</span>` : ''}
      </div>
      ${data.summary ? `<p class="summary">${e(data.summary)}</p>` : ''}
    </div>`;
}

function renderWorkHtml(data: WorkExperience[], style: 'simple' | 'twocolumn' | 'creative'): string {
  if (!data.length) return '';
  const e = escapeHtml;
  if (style === 'creative') {
    const items = data.map(w => `
      <div class="card">
        <div class="card-header">
          <h3>${e(w.position)}</h3>
          <span class="date-tag">${e(w.startDate)} - ${e(w.endDate)}</span>
        </div>
        <p class="company">${e(w.company)}</p>
        ${w.description ? `<p>${e(w.description)}</p>` : ''}
      </div>`).join('');
    return `<div class="section"><h2 class="section-title">${MODULE_LABELS.work}</h2>${items}</div>`;
  }
  const items = data.map(w => `
    <div class="work-item">
      <div class="work-header">
        <h3>${e(w.position)} <span class="company">@ ${e(w.company)}</span></h3>
        <span class="date">${e(w.startDate)} - ${e(w.endDate)}</span>
      </div>
      ${w.description ? `<p>${e(w.description)}</p>` : ''}
    </div>`).join('');
  return `<div class="section"><h2 class="section-title">${MODULE_LABELS.work}</h2>${items}</div>`;
}

function renderEducationHtml(data: Education[], style: 'simple' | 'twocolumn' | 'creative'): string {
  if (!data.length) return '';
  const e = escapeHtml;
  if (style === 'creative') {
    const items = data.map(ed => `
      <div class="card">
        <div class="card-header">
          <h3>${e(ed.school)}</h3>
          <span class="date-tag">${e(ed.startDate)} - ${e(ed.endDate)}</span>
        </div>
        <p>${e(ed.degree)} - ${e(ed.major)}</p>
      </div>`).join('');
    return `<div class="section"><h2 class="section-title">${MODULE_LABELS.education}</h2>${items}</div>`;
  }
  const items = data.map(ed => `
    <div class="edu-item">
      <div class="edu-header">
        <h3>${e(ed.school)}</h3>
        <span class="date">${e(ed.startDate)} - ${e(ed.endDate)}</span>
      </div>
      <p>${e(ed.degree)} - ${e(ed.major)}</p>
    </div>`).join('');
  return `<div class="section"><h2 class="section-title">${MODULE_LABELS.education}</h2>${items}</div>`;
}

function renderSkillsHtml(data: Skill[], style: 'simple' | 'twocolumn' | 'creative'): string {
  if (!data.length) return '';
  const e = escapeHtml;
  if (style === 'creative') {
    const tags = data.map(s => `<span class="skill-tag" style="--level: ${s.level}">${e(s.name)}</span>`).join('');
    return `<div class="section"><h2 class="section-title">${MODULE_LABELS.skills}</h2><div class="skill-tags">${tags}</div></div>`;
  }
  if (style === 'twocolumn') {
    const items = data.map(s => `
      <div class="skill-bar-item">
        <span class="skill-name">${e(s.name)}</span>
        <div class="skill-bar"><div class="skill-bar-fill" style="width: ${s.level * 10}%"></div></div>
      </div>`).join('');
    return `<div class="section sidebar-section"><h2 class="section-title">${MODULE_LABELS.skills}</h2>${items}</div>`;
  }
  const items = data.map(s => `<span class="skill-tag-simple">${e(s.name)}</span>`).join('');
  return `<div class="section"><h2 class="section-title">${MODULE_LABELS.skills}</h2><div class="skill-tags-simple">${items}</div></div>`;
}

function renderProjectsHtml(data: Project[], style: 'simple' | 'twocolumn' | 'creative'): string {
  if (!data.length) return '';
  const e = escapeHtml;
  if (style === 'creative') {
    const items = data.map(p => `
      <div class="card">
        <div class="card-header">
          <h3>${e(p.name)}</h3>
          ${p.url ? `<a class="project-link" href="${e(p.url)}" target="_blank">🔗</a>` : ''}
        </div>
        ${p.description ? `<p>${e(p.description)}</p>` : ''}
        ${p.technologies ? `<div class="tech-tags">${e(p.technologies).split(/[,，、]/).map(t => `<span class="tech-tag">${t.trim()}</span>`).join('')}</div>` : ''}
      </div>`).join('');
    return `<div class="section"><h2 class="section-title">${MODULE_LABELS.projects}</h2>${items}</div>`;
  }
  const items = data.map(p => `
    <div class="project-item">
      <div class="project-header">
        <h3>${e(p.name)}</h3>
        ${p.url ? `<a href="${e(p.url)}" target="_blank">${e(p.url)}</a>` : ''}
      </div>
      ${p.description ? `<p>${e(p.description)}</p>` : ''}
      ${p.technologies ? `<p class="tech">Technologies: ${e(p.technologies)}</p>` : ''}
    </div>`).join('');
  return `<div class="section"><h2 class="section-title">${MODULE_LABELS.projects}</h2>${items}</div>`;
}

function renderSimple(resume: ResumeData): string {
  const personal = getModuleByType(resume.modules, 'personal');
  const work = getModuleByType(resume.modules, 'work');
  const education = getModuleByType(resume.modules, 'education');
  const skills = getModuleByType(resume.modules, 'skills');
  const projects = getModuleByType(resume.modules, 'projects');

  const personalHtml = personal ? renderPersonalHtml(personal.data as PersonalData, resume.avatarUrl, 'simple') : '';
  const workHtml = work ? renderWorkHtml(work.data as WorkExperience[], 'simple') : '';
  const eduHtml = education ? renderEducationHtml(education.data as Education[], 'simple') : '';
  const skillsHtml = skills ? renderSkillsHtml(skills.data as Skill[], 'simple') : '';
  const projectsHtml = projects ? renderProjectsHtml(projects.data as Project[], 'simple') : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #fff; color: #333; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .personal-simple { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4A90D9; padding-bottom: 20px; }
  .personal-simple .avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; }
  .personal-simple .name { font-size: 28px; color: #333; margin-bottom: 4px; }
  .personal-simple .title { font-size: 16px; color: #4A90D9; margin-bottom: 10px; }
  .personal-simple .contact-row { display: flex; justify-content: center; gap: 16px; font-size: 14px; color: #666; flex-wrap: wrap; }
  .personal-simple .summary { margin-top: 12px; font-size: 14px; color: #555; text-align: left; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 18px; color: #4A90D9; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; margin-bottom: 14px; }
  .work-item, .edu-item, .project-item { margin-bottom: 14px; }
  .work-header, .edu-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
  .work-header h3, .edu-header h3 { font-size: 15px; color: #333; }
  .work-header .company { font-weight: normal; color: #4A90D9; font-size: 14px; }
  .date { font-size: 13px; color: #888; }
  .skill-tags-simple { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag-simple { background: #e8f0fe; color: #4A90D9; padding: 4px 12px; border-radius: 4px; font-size: 13px; }
  .project-header { display: flex; justify-content: space-between; align-items: baseline; }
  .project-header h3 { font-size: 15px; }
  .project-header a { font-size: 13px; color: #4A90D9; }
  .tech { font-size: 13px; color: #666; }
</style>
</head>
<body>
<div class="page">
  ${personalHtml}
  ${workHtml}
  ${eduHtml}
  ${skillsHtml}
  ${projectsHtml}
</div>
</body>
</html>`;
}

function renderTwocolumn(resume: ResumeData): string {
  const personal = getModuleByType(resume.modules, 'personal');
  const work = getModuleByType(resume.modules, 'work');
  const education = getModuleByType(resume.modules, 'education');
  const skills = getModuleByType(resume.modules, 'skills');
  const projects = getModuleByType(resume.modules, 'projects');

  const personalHtml = personal ? renderPersonalHtml(personal.data as PersonalData, resume.avatarUrl, 'sidebar') : '';
  const skillsHtml = skills ? renderSkillsHtml(skills.data as Skill[], 'twocolumn') : '';
  const workHtml = work ? renderWorkHtml(work.data as WorkExperience[], 'twocolumn') : '';
  const eduHtml = education ? renderEducationHtml(education.data as Education[], 'twocolumn') : '';
  const projectsHtml = projects ? renderProjectsHtml(projects.data as Project[], 'twocolumn') : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f5f5f5; color: #333; line-height: 1.6; }
  .page { display: flex; max-width: 900px; margin: 0 auto; min-height: 100vh; }
  .sidebar { width: 280px; background: #2C3E50; color: #ecf0f1; padding: 32px 20px; flex-shrink: 0; }
  .content { flex: 1; background: #fff; padding: 32px 28px; }
  .personal-sidebar { text-align: center; }
  .personal-sidebar .avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; border: 3px solid #ecf0f1; }
  .personal-sidebar .name { font-size: 22px; color: #fff; margin-bottom: 4px; }
  .personal-sidebar .title { font-size: 14px; color: #bdc3c7; margin-bottom: 14px; }
  .contact-list { text-align: left; font-size: 13px; }
  .contact-item { margin-bottom: 6px; color: #bdc3c7; }
  .personal-sidebar .summary { margin-top: 16px; font-size: 13px; color: #bdc3c7; text-align: left; line-height: 1.5; }
  .sidebar-section { margin-top: 24px; }
  .sidebar-section .section-title { font-size: 15px; color: #ecf0f1; border-bottom: 1px solid #4a6278; padding-bottom: 6px; margin-bottom: 12px; }
  .skill-bar-item { margin-bottom: 10px; }
  .skill-name { display: block; font-size: 13px; color: #bdc3c7; margin-bottom: 4px; }
  .skill-bar { background: #4a6278; border-radius: 3px; height: 6px; overflow: hidden; }
  .skill-bar-fill { background: #3498db; height: 100%; border-radius: 3px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 17px; color: #2C3E50; border-bottom: 2px solid #2C3E50; padding-bottom: 6px; margin-bottom: 14px; }
  .work-item, .edu-item, .project-item { margin-bottom: 14px; }
  .work-header, .edu-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; }
  .work-header h3, .edu-header h3 { font-size: 15px; color: #2C3E50; }
  .work-header .company { font-weight: normal; color: #3498db; font-size: 14px; }
  .date { font-size: 13px; color: #888; }
  .project-header { display: flex; justify-content: space-between; align-items: baseline; }
  .project-header h3 { font-size: 15px; }
  .project-header a { font-size: 13px; color: #3498db; }
  .tech { font-size: 13px; color: #666; }
</style>
</head>
<body>
<div class="page">
  <div class="sidebar">
    ${personalHtml}
    ${skillsHtml}
  </div>
  <div class="content">
    ${workHtml}
    ${eduHtml}
    ${projectsHtml}
  </div>
</div>
</body>
</html>`;
}

function renderCreative(resume: ResumeData): string {
  const personal = getModuleByType(resume.modules, 'personal');
  const work = getModuleByType(resume.modules, 'work');
  const education = getModuleByType(resume.modules, 'education');
  const skills = getModuleByType(resume.modules, 'skills');
  const projects = getModuleByType(resume.modules, 'projects');

  const personalHtml = personal ? renderPersonalHtml(personal.data as PersonalData, resume.avatarUrl, 'creative') : '';
  const workHtml = work ? renderWorkHtml(work.data as WorkExperience[], 'creative') : '';
  const eduHtml = education ? renderEducationHtml(education.data as Education[], 'creative') : '';
  const skillsHtml = skills ? renderSkillsHtml(skills.data as Skill[], 'creative') : '';
  const projectsHtml = projects ? renderProjectsHtml(projects.data as Project[], 'creative') : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Resume</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; background: #f8f9fc; color: #333; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 36px; }
  .personal-creative { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; border-radius: 16px; padding: 28px; margin-bottom: 28px; }
  .personal-header { display: flex; align-items: center; gap: 20px; }
  .personal-header .avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.5); }
  .personal-header-text .name { font-size: 26px; }
  .personal-header-text .title { font-size: 15px; opacity: 0.9; }
  .contact-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  .tag { background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 13px; }
  .summary-card { background: rgba(255,255,255,0.15); border-radius: 10px; padding: 14px; margin-top: 16px; font-size: 14px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 18px; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 14px; padding-bottom: 6px; border-bottom: 2px solid #e8e0f0; }
  .card { background: #fff; border-radius: 12px; padding: 18px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(102,126,234,0.08); border: 1px solid #f0ecf5; }
  .card-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; flex-wrap: wrap; }
  .card-header h3 { font-size: 15px; color: #333; }
  .date-tag { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 2px 10px; border-radius: 12px; font-size: 12px; }
  .company { color: #764ba2; font-size: 14px; margin-bottom: 4px; }
  .skill-tags { display: flex; flex-wrap: wrap; gap: 8px; }
  .skill-tag { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 5px 14px; border-radius: 20px; font-size: 13px; }
  .project-link { font-size: 18px; text-decoration: none; }
  .tech-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
  .tech-tag { background: #f0ecf5; color: #764ba2; padding: 3px 10px; border-radius: 10px; font-size: 12px; }
</style>
</head>
<body>
<div class="page">
  ${personalHtml}
  ${workHtml}
  ${eduHtml}
  ${skillsHtml}
  ${projectsHtml}
</div>
</body>
</html>`;
}

export function renderTemplate(template: TemplateType, resume: ResumeData): string {
  switch (template) {
    case 'twocolumn':
      return renderTwocolumn(resume);
    case 'creative':
      return renderCreative(resume);
    case 'simple':
    default:
      return renderSimple(resume);
  }
}
