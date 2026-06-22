import express, { type Request, type Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const iconList = [
  { id: 'book', name: '书本', category: '教育' },
  { id: 'lightbulb', name: '灯泡', category: '创意' },
  { id: 'tree', name: '树木', category: '自然' },
  { id: 'star', name: '星星', category: '通用' },
  { id: 'heart', name: '爱心', category: '情感' },
  { id: 'rocket', name: '火箭', category: '科技' },
  { id: 'coffee', name: '咖啡', category: '生活' },
  { id: 'music', name: '音乐', category: '娱乐' },
  { id: 'camera', name: '相机', category: '摄影' },
  { id: 'pencil', name: '铅笔', category: '工具' },
  { id: 'target', name: '目标', category: '商业' },
  { id: 'trophy', name: '奖杯', category: '成就' },
  { id: 'clock', name: '时钟', category: '时间' },
  { id: 'globe', name: '地球', category: '世界' },
  { id: 'briefcase', name: '公文包', category: '商务' },
  { id: 'zap', name: '闪电', category: '能量' },
  { id: 'gift', name: '礼物', category: '生活' },
  { id: 'message', name: '消息', category: '沟通' },
  { id: 'users', name: '用户', category: '社交' },
  { id: 'settings', name: '设置', category: '工具' },
  { id: 'smile', name: '笑脸', category: '情感' },
  { id: 'sun', name: '太阳', category: '自然' },
  { id: 'moon', name: '月亮', category: '自然' },
  { id: 'cloud', name: '云朵', category: '自然' },
  { id: 'umbrella', name: '雨伞', category: '天气' },
  { id: 'headphone', name: '耳机', category: '音频' },
  { id: 'mic', name: '麦克风', category: '音频' },
  { id: 'video', name: '视频', category: '媒体' },
  { id: 'image', name: '图片', category: '媒体' },
  { id: 'file', name: '文件', category: '文档' },
  { id: 'folder', name: '文件夹', category: '文档' },
  { id: 'tag', name: '标签', category: '通用' },
  { id: 'bookmark', name: '书签', category: '工具' },
  { id: 'flag', name: '旗帜', category: '通用' },
  { id: 'home', name: '首页', category: '导航' },
  { id: 'search', name: '搜索', category: '工具' },
  { id: 'bell', name: '铃铛', category: '通知' },
  { id: 'check', name: '勾选', category: '操作' },
  { id: 'plus', name: '加号', category: '操作' },
  { id: 'download', name: '下载', category: '操作' },
  { id: 'upload', name: '上传', category: '操作' },
  { id: 'share', name: '分享', category: '社交' },
  { id: 'link', name: '链接', category: '通用' },
  { id: 'lock', name: '锁', category: '安全' },
  { id: 'eye', name: '眼睛', category: '查看' },
  { id: 'edit', name: '编辑', category: '操作' },
  { id: 'trash', name: '垃圾桶', category: '操作' },
  { id: 'copy', name: '复制', category: '操作' },
  { id: 'refresh', name: '刷新', category: '操作' },
  { id: 'filter', name: '筛选', category: '工具' },
  { id: 'menu', name: '菜单', category: '导航' },
  { id: 'help', name: '帮助', category: '通用' },
  { id: 'info', name: '信息', category: '通用' },
  { id: 'alert', name: '警告', category: '通知' },
  { id: 'flame', name: '火焰', category: '能量' },
  { id: 'leaf', name: '叶子', category: '自然' },
  { id: 'flower', name: '花朵', category: '自然' },
  { id: 'crown', name: '皇冠', category: '成就' },
  { id: 'diamond', name: '钻石', category: '珠宝' },
  { id: 'shield', name: '盾牌', category: '安全' },
  { id: 'anchor', name: '船锚', category: '旅行' },
  { id: 'compass', name: '指南针', category: '旅行' },
  { id: 'map', name: '地图', category: '旅行' },
  { id: 'pin', name: '定位', category: '旅行' },
  { id: 'train', name: '火车', category: '交通' },
  { id: 'car', name: '汽车', category: '交通' },
  { id: 'plane', name: '飞机', category: '交通' },
  { id: 'bike', name: '自行车', category: '交通' },
  { id: 'shopping', name: '购物', category: '商业' },
  { id: 'credit', name: '信用卡', category: '金融' },
  { id: 'wallet', name: '钱包', category: '金融' },
  { id: 'chart', name: '图表', category: '数据' },
  { id: 'pie', name: '饼图', category: '数据' },
  { id: 'bar', name: '柱状图', category: '数据' },
  { id: 'activity', name: '活动', category: '数据' },
  { id: 'layers', name: '图层', category: '设计' },
  { id: 'grid', name: '网格', category: '布局' },
  { id: 'list', name: '列表', category: '布局' },
  { id: 'calendar', name: '日历', category: '时间' },
  { id: 'mailbox', name: '邮箱', category: '沟通' },
  { id: 'quote', name: '引用', category: '文本' },
  { id: 'code', name: '代码', category: '开发' },
  { id: 'terminal', name: '终端', category: '开发' },
  { id: 'cpu', name: '处理器', category: '硬件' },
  { id: 'database', name: '数据库', category: '数据' },
  { id: 'server', name: '服务器', category: '硬件' },
  { id: 'wifi', name: 'WiFi', category: '网络' },
  { id: 'battery', name: '电池', category: '硬件' },
  { id: 'play', name: '播放', category: '控制' },
  { id: 'pause', name: '暂停', category: '控制' },
  { id: 'sparkle', name: '闪光', category: '装饰' },
  { id: 'idea', name: '创意', category: '创意' },
  { id: 'growth', name: '增长', category: '商业' },
  { id: 'money', name: '金钱', category: '金融' },
  { id: 'medal', name: '奖章', category: '成就' },
  { id: 'thumbsUp', name: '点赞', category: '社交' },
  { id: 'chat', name: '聊天', category: '沟通' },
  { id: 'send', name: '发送', category: '操作' },
  { id: 'paw', name: '爪印', category: '动物' },
  { id: 'fish', name: '鱼', category: '动物' },
  { id: 'bird', name: '鸟', category: '动物' },
  { id: 'cat', name: '猫', category: '动物' },
  { id: 'dog', name: '狗', category: '动物' },
];

app.get('/api/icons', (req: Request, res: Response) => {
  res.json({
    icons: iconList,
  });
});

app.post('/api/export', (req: Request, res: Response) => {
  const { cards, theme, font, transition } = req.body;

  const themeStyles: Record<string, { bg: string; cardBg: string; text: string }> = {
    light: { bg: '#ffffff', cardBg: '#f5f5f5', text: '#333333' },
    warm: { bg: '#FFF8E7', cardBg: '#F5E6D3', text: '#5D4E37' },
    dark: { bg: '#1a1a2e', cardBg: '#16213e', text: '#e0e0e0' },
  };

  const fontFamilies: Record<string, string> = {
    noto: "'Noto Sans SC', sans-serif",
    kuaile: "'ZCOOL KuaiLe', cursive",
    serif: "'Noto Serif SC', serif",
  };

  const themeStyle = themeStyles[theme as string] || themeStyles.light;
  const fontFamily = fontFamilies[font as string] || fontFamilies.noto;

  const cardsHtml = cards.map((card: any, index: number) => `
    <div class="card-slide" data-index="${index}">
      <div class="card-inner" style="background-color: ${card.themeColor}">
        <div class="card-header">
          <div class="card-icon-wrapper">
            <div class="card-icon" id="icon-${index}"></div>
          </div>
          <div class="card-index">${index + 1} / ${cards.length}</div>
        </div>
        <div class="card-content">
          <div class="card-text">${escapeHtml(card.text)}</div>
        </div>
      </div>
    </div>
  `).join('');

  const transitionCss = getTransitionCss(transition as string);

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>拆文成卡 - 导出</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=ZCOOL+KuaiLe&family=Noto+Serif+SC:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${fontFamily};
      background: ${themeStyle.bg};
      color: ${themeStyle.text};
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .card-container {
      width: 360px;
      height: 640px;
      position: relative;
      perspective: 1000px;
    }
    
    .card-slide {
      position: absolute;
      inset: 0;
      ${transitionCss.style}
    }
    
    .card-slide.active {
      ${transitionCss.active}
      z-index: 1;
    }
    
    .card-slide.prev {
      ${transitionCss.prev}
      z-index: 0;
    }
    
    .card-inner {
      width: 100%;
      height: 100%;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      padding: 32px;
      display: flex;
      flex-direction: column;
      color: #fff;
    }
    
    .card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    
    .card-icon-wrapper {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .card-icon {
      width: 48px;
      height: 48px;
      animation: iconFloat 0.4s ease-out;
    }
    
    .card-icon svg {
      width: 100%;
      height: 100%;
    }
    
    @keyframes iconFloat {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .card-index {
      font-size: 14px;
      font-weight: 500;
      opacity: 0.8;
      background: rgba(255, 255, 255, 0.25);
      padding: 6px 14px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }
    
    .card-content {
      flex: 1;
      overflow: hidden;
    }
    
    .card-text {
      font-size: 16px;
      line-height: 1.8;
      word-break: break-word;
      white-space: pre-wrap;
    }
    
    .controls {
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      align-items: center;
    }
    
    .nav-btn {
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 50%;
      background: rgba(102, 126, 234, 0.9);
      color: white;
      font-size: 24px;
      cursor: pointer;
      transition: all 0.3s;
      font-family: inherit;
    }
    
    .nav-btn:hover {
      transform: scale(1.1);
      background: rgba(102, 126, 234, 1);
    }
    
    .nav-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
      transform: none;
    }
    
    .indicator {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ddd;
      transition: all 0.3s;
      cursor: pointer;
    }
    
    .indicator-dot.active {
      background: #667eea;
      transform: scale(1.3);
    }
    
    .info {
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 14px;
      opacity: 0.6;
    }
  </style>
</head>
<body>
  <div class="info">使用键盘左右键或点击按钮翻页</div>
  
  <div class="card-container">
    ${cardsHtml}
  </div>
  
  <div class="controls">
    <button class="nav-btn" id="prevBtn">‹</button>
    <div class="indicator" id="indicator"></div>
    <button class="nav-btn" id="nextBtn">›</button>
  </div>

  <script>
    const iconData = ${JSON.stringify(cards.map((c: any) => ({ id: c.iconId, color: getComplementary(c.themeColor) })))};
    
    const iconSvgs = {
${generateIconSvgs()}
    };
    
    function getComplementary(hex) {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      h = (h + 0.5) % 1;
      
      let r2, g2, b2;
      if (s === 0) {
        r2 = g2 = b2 = l;
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r2 = hue2rgb(p, q, h + 1/3);
        g2 = hue2rgb(p, q, h);
        b2 = hue2rgb(p, q, h - 1/3);
      }
      
      const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      return '#' + toHex(r2) + toHex(g2) + toHex(b2);
    }
    
    let currentIndex = 0;
    const totalSlides = ${cards.length};
    const slides = document.querySelectorAll('.card-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const indicator = document.getElementById('indicator');
    
    function initIcons() {
      iconData.forEach((item, index) => {
        const iconEl = document.getElementById('icon-' + index);
        if (iconEl && iconSvgs[item.id]) {
          iconEl.innerHTML = iconSvgs[item.id].replace(
            '<svg',
            '<svg style="color: ' + item.color + '"'
          );
        }
      });
    }
    
    function initIndicators() {
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = 'indicator-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', () => goToSlide(i));
        indicator.appendChild(dot);
      }
    }
    
    function updateSlides() {
      slides.forEach((slide, index) => {
        slide.classList.remove('active', 'prev');
        if (index === currentIndex) {
          slide.classList.add('active');
        } else if (index === currentIndex - 1 || (currentIndex === 0 && index === totalSlides - 1)) {
          slide.classList.add('prev');
        }
      });
      
      document.querySelectorAll('.indicator-dot').forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
      });
      
      prevBtn.disabled = currentIndex === 0;
      nextBtn.disabled = currentIndex === totalSlides - 1;
    }
    
    function goToSlide(index) {
      if (index < 0 || index >= totalSlides) return;
      currentIndex = index;
      updateSlides();
    }
    
    function nextSlide() {
      if (currentIndex < totalSlides - 1) {
        currentIndex++;
        updateSlides();
      }
    }
    
    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex--;
        updateSlides();
      }
    }
    
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    });
    
    initIcons();
    initIndicators();
    updateSlides();
  </script>
</body>
</html>`;

  res.json({ html });
});

function escapeHtml(text: string): string {
  const div = document.createElement?.('div') || { innerHTML: '', textContent: '' };
  if (div.textContent) {
    div.textContent = text;
    return div.innerHTML;
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getTransitionCss(type: string) {
  switch (type) {
    case 'slide':
      return {
        style: 'transform: translateX(100%); opacity: 0; transition: all 0.5s ease;',
        active: 'transform: translateX(0); opacity: 1;',
        prev: 'transform: translateX(-100%); opacity: 0;',
      };
    case 'flip':
      return {
        style: 'transform: rotateX(90deg); opacity: 0; transition: all 0.5s ease; transform-origin: center;',
        active: 'transform: rotateX(0); opacity: 1;',
        prev: 'transform: rotateX(-90deg); opacity: 0;',
      };
    case 'zoom':
      return {
        style: 'transform: scale(0.8); opacity: 0; transition: all 0.5s ease;',
        active: 'transform: scale(1); opacity: 1;',
        prev: 'transform: scale(1.2); opacity: 0;',
      };
    case 'fade':
    default:
      return {
        style: 'opacity: 0; transition: opacity 0.5s ease;',
        active: 'opacity: 1;',
        prev: 'opacity: 0;',
      };
  }
}

function generateIconSvgs(): string {
  const icons: Record<string, string> = {
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>',
    lightbulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
    rocket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/></svg>',
    coffee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14Z"/><path d="M6 2v2"/></svg>',
  };

  let result = '';
  for (const [id, svg] of Object.entries(icons)) {
    result += `      ${JSON.stringify(id)}: ${JSON.stringify(svg)},\n`;
  }
  return result;
}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

export default app;
