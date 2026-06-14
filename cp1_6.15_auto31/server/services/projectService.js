const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const archiver = require('archiver');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const DOWNLOADS_DIR = path.join(PUBLIC_DIR, 'downloads');
const TEMP_DIR = path.join(__dirname, '..', 'temp');

function ensureDirectories() {
  const dirs = [DATA_DIR, PUBLIC_DIR, DOWNLOADS_DIR, TEMP_DIR];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

ensureDirectories();

function getTemplateStyles(templateId) {
  const templates = {
    minimal: {
      bg: '#f5f5f5',
      cardBg: '#ffffff',
      cardText: '#333333',
      accent: '#4a90d9',
      nameColor: '#1a1a2e',
      descColor: '#666666',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    modern: {
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      cardText: '#1a1a2e',
      accent: '#667eea',
      nameColor: '#1a1a2e',
      descColor: '#555555',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    artistic: {
      bg: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
      cardBg: 'rgba(255, 255, 255, 0.9)',
      cardText: '#e94560',
      accent: '#e94560',
      nameColor: '#e94560',
      descColor: '#444444',
      fontFamily: 'Georgia, serif',
    },
  };
  return templates[templateId] || templates.minimal;
}

function escapeHtml(text) {
  if (!text) return '';
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, function (m) {
    return map[m];
  });
}

function generateCSS(state) {
  const { template, settings } = state;
  const styles = getTemplateStyles(template);

  const bgStyle = settings.backgroundColor.startsWith('linear-gradient')
    ? `background: ${settings.backgroundColor};`
    : `background-color: ${settings.backgroundColor};`;

  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: ${settings.fontFamily || styles.fontFamily};
  min-height: 100vh;
  ${bgStyle}
  padding: 40px 20px;
  line-height: 1.6;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 50px;
  padding: 30px 0;
}

.header h1 {
  font-size: 42px;
  color: ${styles.nameColor};
  margin-bottom: 10px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.header p {
  font-size: 18px;
  color: ${styles.descColor};
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: ${settings.spacing}px;
}

.card {
  background: ${styles.cardBg};
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  opacity: 0;
  transform: translateY(40px);
  border-radius: ${settings.borderRadius}px;
}

.card.visible {
  animation: fadeInUp 0.6s ease forwards;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
  border-radius: ${settings.borderRadius}px ${settings.borderRadius}px 0 0;
}

.card-img-placeholder {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  border-radius: ${settings.borderRadius}px ${settings.borderRadius}px 0 0;
}

.card-body {
  padding: 20px;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: ${styles.nameColor};
  margin-bottom: 10px;
  line-height: 1.3;
}

.card-desc {
  font-size: 14px;
  color: ${styles.descColor};
  line-height: 1.6;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.tag {
  padding: 4px 12px;
  background: rgba(233, 69, 96, 0.1);
  color: ${styles.accent};
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.card-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: ${styles.accent};
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.2s ease, gap 0.2s ease;
}

.card-link:hover {
  color: #d63851;
  gap: 8px;
  text-decoration: underline;
}

.footer {
  text-align: center;
  margin-top: 60px;
  padding: 20px;
  color: ${styles.descColor};
  font-size: 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  body {
    padding: 20px 16px;
  }

  .header h1 {
    font-size: 32px;
  }

  .header p {
    font-size: 16px;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .card-title {
    font-size: 18px;
  }

  .card-body {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 20px 0;
    margin-bottom: 30px;
  }

  .header h1 {
    font-size: 28px;
  }
}`;
}

function generateHTML(state, cssFilename) {
  const { template, cards, settings } = state;
  const styles = getTemplateStyles(template);
  const sortedCards = [...cards].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  const cardsHTML = sortedCards
    .map((card, index) => {
      return `    <div class="card" style="animation-delay: ${index * 0.2}s;">
      ${
        card.thumbnailUrl
          ? `<img src="${escapeHtml(card.thumbnailUrl)}" alt="${escapeHtml(
              card.name
            )}" class="card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
          : ''
      }
      ${!card.thumbnailUrl ? `<div class="card-img-placeholder">🖼️</div>` : ''}
      ${
        card.thumbnailUrl
          ? `<div class="card-img-placeholder" style="display:none;">🖼️</div>`
          : ''
      }
      <div class="card-body">
        <h2 class="card-title">${escapeHtml(card.name)}</h2>
        <p class="card-desc">${escapeHtml(card.description)}</p>
        <div class="card-tags">
          ${card.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        ${
          card.link
            ? `<a href="${escapeHtml(
                card.link
              )}" target="_blank" rel="noopener noreferrer" class="card-link">查看项目 <span>→</span></a>`
            : ''
        }
      </div>
    </div>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="我的作品集 - 精心打造的项目展示">
  <title>我的作品集</title>
  <link rel="stylesheet" href="${cssFilename}">
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>我的作品集</h1>
      <p>精心打造的项目展示</p>
    </div>
    <div class="grid">
${
  cardsHTML ||
  '      <p style="text-align:center;color:#888;padding:60px 20px;grid-column:1/-1;font-size:18px;">暂无项目，敬请期待</p>'
}
    </div>
    <div class="footer">
      <p>由作品集生成器创建 © ${new Date().getFullYear()}</p>
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const cards = document.querySelectorAll('.card');
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      cards.forEach((card) => observer.observe(card));
    });
  </script>
</body>
</html>`;
}

function createZipFile(state, projectId) {
  return new Promise((resolve, reject) => {
    const zipFilename = `portfolio-${projectId}.zip`;
    const zipFilePath = path.join(DOWNLOADS_DIR, zipFilename);
    const tempProjectDir = path.join(TEMP_DIR, projectId);

    fs.mkdirSync(tempProjectDir, { recursive: true });

    try {
      const cssContent = generateCSS(state);
      const htmlContent = generateHTML(state, 'styles.css');

      fs.writeFileSync(path.join(tempProjectDir, 'styles.css'), cssContent, 'utf-8');
      fs.writeFileSync(path.join(tempProjectDir, 'index.html'), htmlContent, 'utf-8');

      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 },
      });

      output.on('close', () => {
        fs.rmSync(tempProjectDir, { recursive: true, force: true });
        resolve({
          filename: zipFilename,
          path: zipFilePath,
          size: archive.pointer(),
        });
      });

      output.on('error', (err) => {
        fs.rmSync(tempProjectDir, { recursive: true, force: true });
        reject(err);
      });

      archive.on('error', (err) => {
        output.destroy();
        fs.rmSync(tempProjectDir, { recursive: true, force: true });
        reject(err);
      });

      archive.pipe(output);
      archive.directory(tempProjectDir, false);
      archive.finalize();
    } catch (error) {
      fs.rmSync(tempProjectDir, { recursive: true, force: true });
      reject(error);
    }
  });
}

async function saveProject(state) {
  ensureDirectories();
  const projectId = uuidv4();
  const filePath = path.join(DATA_DIR, `${projectId}.json`);

  fs.writeFileSync(filePath, JSON.stringify(state, null, 2));

  return {
    success: true,
    projectId,
    message: '草稿保存成功！',
  };
}

async function publishProject(state) {
  ensureDirectories();
  const projectId = uuidv4();

  const zipResult = await createZipFile(state, projectId);

  return {
    success: true,
    downloadUrl: `/downloads/${zipResult.filename}`,
    message: `发布成功！ZIP包大小：${(zipResult.size / 1024).toFixed(1)}KB`,
  };
}

async function getProject(projectId) {
  const filePath = path.join(DATA_DIR, `${projectId}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

module.exports = {
  saveProject,
  publishProject,
  getProject,
  generateHTML,
  generateCSS,
};
