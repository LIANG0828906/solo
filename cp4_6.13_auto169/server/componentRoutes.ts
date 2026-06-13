import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
  getMaxOrderIndex,
  ComponentContent,
  ComponentStyle,
} from './componentModel';

const router = Router();

const defaultContentByType: Record<string, ComponentContent> = {
  hero: {
    title: '打造出色的产品体验',
    description: '使用我们的可视化构建器，快速创建专业的响应式落地页，无需编写任何代码。',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20hero%20section%20with%20purple%20blue%20gradient%20background%20and%20product%20showcase&image_size=landscape_16_9',
    ctaText: '立即开始',
    ctaLink: '#',
  },
  feature: {
    title: '强大功能',
    description: '拖拽式操作，所见即所得，轻松创建精美页面。',
    imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=feature%20icon%20with%20purple%20blue%20gradient%20style&image_size=square',
  },
  pricing: {
    title: '专业版',
    description: '适合成长中的团队',
    price: '¥99/月',
    features: ['无限组件', '高级模板', '优先支持', '导出源码'],
  },
  testimonial: {
    title: '',
    description: '这是我用过的最好用的页面构建工具，节省了我大量的开发时间。',
    author: '张三',
    avatar: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20avatar%20portrait%20friendly%20smile&image_size=square',
  },
  footer: {
    title: '准备好开始了吗？',
    description: '立即创建你的第一个落地页，免费开始使用。',
    ctaText: '免费试用',
    ctaLink: '#',
  },
};

const defaultStyleByType: Record<string, ComponentStyle> = {
  hero: {
    backgroundColor: 'transparent',
    fontSize: '16px',
    textColor: '#ffffff',
  },
  feature: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    fontSize: '14px',
    textColor: '#ffffff',
  },
  pricing: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    fontSize: '14px',
    textColor: '#ffffff',
  },
  testimonial: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    fontSize: '14px',
    textColor: '#ffffff',
  },
  footer: {
    backgroundColor: 'transparent',
    fontSize: '16px',
    textColor: '#ffffff',
  },
};

router.get('/components', (req: Request, res: Response) => {
  try {
    const components = getAllComponents();
    res.json(components);
  } catch (error) {
    res.status(500).json({ error: '获取组件失败' });
  }
});

router.get('/components/:id', (req: Request, res: Response) => {
  try {
    const component = getComponentById(req.params.id);
    if (!component) {
      res.status(404).json({ error: '组件不存在' });
      return;
    }
    res.json(component);
  } catch (error) {
    res.status(500).json({ error: '获取组件失败' });
  }
});

router.post('/components', (req: Request, res: Response) => {
  try {
    const { type, width } = req.body;
    if (!type) {
      res.status(400).json({ error: '组件类型不能为空' });
      return;
    }

    const id = uuidv4();
    const maxOrder = getMaxOrderIndex();
    const order_index = maxOrder + 1;

    const defaultContent = defaultContentByType[type] || {};
    const defaultStyle = defaultStyleByType[type] || {};
    const content = JSON.stringify(defaultContent);
    const style = JSON.stringify(defaultStyle);
    const componentWidth = width || '100%';

    const component = createComponent(id, type, order_index, content, style, componentWidth);
    res.status(201).json(component);
  } catch (error) {
    console.error('创建组件错误:', error);
    res.status(500).json({ error: '创建组件失败' });
  }
});

router.put('/components/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, style, width, order_index, type } = req.body;

    const updates: Partial<{ type: string; order_index: number; content: string; style: string; width: string }> = {};

    if (type !== undefined) updates.type = type;
    if (order_index !== undefined) updates.order_index = order_index;
    if (content !== undefined) updates.content = typeof content === 'string' ? content : JSON.stringify(content);
    if (style !== undefined) updates.style = typeof style === 'string' ? style : JSON.stringify(style);
    if (width !== undefined) updates.width = width;

    const component = updateComponent(id, updates);
    if (!component) {
      res.status(404).json({ error: '组件不存在' });
      return;
    }
    res.json(component);
  } catch (error) {
    console.error('更新组件错误:', error);
    res.status(500).json({ error: '更新组件失败' });
  }
});

router.delete('/components/:id', (req: Request, res: Response) => {
  try {
    const deleted = deleteComponent(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: '组件不存在' });
      return;
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除组件失败' });
  }
});

function generateHTML(components: any[]): string {
  const componentsHTML = components
    .sort((a, b) => a.order_index - b.order_index)
    .map((comp) => renderComponentHTML(comp))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Landing Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #2d3436;
      color: #fff;
      min-height: 100vh;
    }
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    .components-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    .component-wrapper {
      flex: 0 0 100%;
      animation: bounceIn 0.2s ease-out;
    }
    .component-wrapper.width-25 { flex: 0 0 calc(25% - 15px); }
    .component-wrapper.width-50 { flex: 0 0 calc(50% - 10px); }
    .component-wrapper.width-75 { flex: 0 0 calc(75% - 5px); }
    .component-wrapper.width-100 { flex: 0 0 100%; }
    @keyframes bounceIn {
      0% { transform: scale(0.8); opacity: 0; }
      60% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    .component-card {
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 24px;
      height: 100%;
    }
    .hero-section {
      text-align: center;
      padding: 60px 40px;
      background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
      border-radius: 16px;
    }
    .hero-section h1 { font-size: 2.5em; margin-bottom: 16px; }
    .hero-section p { font-size: 1.2em; opacity: 0.9; margin-bottom: 24px; }
    .hero-section img { max-width: 100%; border-radius: 12px; margin-top: 20px; }
    .btn {
      display: inline-block;
      padding: 12px 32px;
      background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 15px rgba(108, 92, 231, 0.4);
    }
    .btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(108, 92, 231, 0.5);
    }
    .feature-card h3 { font-size: 1.3em; margin-bottom: 10px; background: linear-gradient(135deg, #6c5ce7, #a29bfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .feature-card p { opacity: 0.8; line-height: 1.6; }
    .feature-card img { width: 60px; height: 60px; border-radius: 12px; margin-bottom: 16px; }
    .pricing-card { text-align: center; }
    .pricing-card h3 { font-size: 1.5em; margin-bottom: 8px; }
    .pricing-card .price { font-size: 2.5em; font-weight: 700; background: linear-gradient(135deg, #6c5ce7, #a29bfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin: 16px 0; }
    .pricing-card .desc { opacity: 0.7; margin-bottom: 20px; }
    .pricing-card ul { list-style: none; text-align: left; margin: 20px 0; }
    .pricing-card li { padding: 8px 0; opacity: 0.9; }
    .pricing-card li::before { content: '✓'; color: #a29bfe; margin-right: 10px; font-weight: bold; }
    .testimonial-card { font-style: italic; }
    .testimonial-card p { opacity: 0.9; line-height: 1.8; margin-bottom: 16px; }
    .testimonial-card .author { display: flex; align-items: center; gap: 12px; }
    .testimonial-card .author img { width: 48px; height: 48px; border-radius: 50%; }
    .testimonial-card .author span { font-weight: 600; font-style: normal; }
    .footer-cta { text-align: center; padding: 40px; }
    .footer-cta h2 { font-size: 2em; margin-bottom: 12px; }
    .footer-cta p { opacity: 0.8; margin-bottom: 24px; }
    @media (max-width: 1024px) {
      .component-wrapper.width-25, .component-wrapper.width-50, .component-wrapper.width-75 { flex: 0 0 calc(50% - 10px); }
    }
    @media (max-width: 768px) {
      .component-wrapper.width-25, .component-wrapper.width-50, .component-wrapper.width-75, .component-wrapper.width-100 { flex: 0 0 100%; }
      .hero-section { padding: 40px 20px; }
      .hero-section h1 { font-size: 1.8em; }
    }
  </style>
</head>
<body>
  <div class="page-container">
    <div class="components-grid">
      ${componentsHTML}
    </div>
  </div>
</body>
</html>`;
}

function renderComponentHTML(comp: any): string {
  let content: any = {};
  let style: any = {};
  try {
    content = typeof comp.content === 'string' ? JSON.parse(comp.content) : comp.content;
    style = typeof comp.style === 'string' ? JSON.parse(comp.style) : comp.style;
  } catch (e) {}

  const widthClass = `width-${comp.width?.replace('%', '') || '100'}`;
  const bgStyle = style.backgroundColor ? `background-color: ${style.backgroundColor};` : '';
  const fontSizeStyle = style.fontSize ? `font-size: ${style.fontSize};` : '';
  const textColorStyle = style.textColor ? `color: ${style.textColor};` : '';

  switch (comp.type) {
    case 'hero':
      return `<div class="component-wrapper ${widthClass}">
  <div class="component-card hero-section" style="${bgStyle}${fontSizeStyle}${textColorStyle}">
    <h1>${content.title || '标题'}</h1>
    <p>${content.description || '描述文字'}</p>
    ${content.ctaText ? `<a href="${content.ctaLink || '#'}" class="btn">${content.ctaText}</a>` : ''}
    ${content.imageUrl ? `<img src="${content.imageUrl}" alt="hero image" />` : ''}
  </div>
</div>`;
    case 'feature':
      return `<div class="component-wrapper ${widthClass}">
  <div class="component-card feature-card" style="${bgStyle}${fontSizeStyle}${textColorStyle}">
    ${content.imageUrl ? `<img src="${content.imageUrl}" alt="feature icon" />` : ''}
    <h3>${content.title || '功能标题'}</h3>
    <p>${content.description || '功能描述'}</p>
  </div>
</div>`;
    case 'pricing':
      const featuresList = (content.features || []).map((f: string) => `<li>${f}</li>`).join('');
      return `<div class="component-wrapper ${widthClass}">
  <div class="component-card pricing-card" style="${bgStyle}${fontSizeStyle}${textColorStyle}">
    <h3>${content.title || '方案名称'}</h3>
    <p class="desc">${content.description || ''}</p>
    <div class="price">${content.price || '¥0'}</div>
    <ul>${featuresList}</ul>
    <button class="btn">立即购买</button>
  </div>
</div>`;
    case 'testimonial':
      return `<div class="component-wrapper ${widthClass}">
  <div class="component-card testimonial-card" style="${bgStyle}${fontSizeStyle}${textColorStyle}">
    <p>"${content.description || '评价内容'}"</p>
    <div class="author">
      ${content.avatar ? `<img src="${content.avatar}" alt="${content.author || ''}" />` : ''}
      <span>${content.author || '匿名用户'}</span>
    </div>
  </div>
</div>`;
    case 'footer':
      return `<div class="component-wrapper ${widthClass}">
  <div class="component-card footer-cta" style="${bgStyle}${fontSizeStyle}${textColorStyle}">
    <h2>${content.title || 'CTA标题'}</h2>
    <p>${content.description || '描述文字'}</p>
    ${content.ctaText ? `<a href="${content.ctaLink || '#'}" class="btn">${content.ctaText}</a>` : ''}
  </div>
</div>`;
    default:
      return `<div class="component-wrapper ${widthClass}"><div class="component-card" style="${bgStyle}">未知组件</div></div>`;
  }
}

router.get('/export', (req: Request, res: Response) => {
  try {
    const components = getAllComponents();
    const html = generateHTML(components);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="landing-page.zip"');

    const zipContent = createZipFile(html);
    res.send(Buffer.from(zipContent, 'binary'));
  } catch (error) {
    console.error('导出错误:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

function createZipFile(htmlContent: string): string {
  const filename = 'index.html';
  const fileContent = htmlContent;

  const crc32 = (data: string): number => {
    let crc = 0xffffffff;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < data.length; i++) {
      crc = table[(crc ^ data.charCodeAt(i)) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  };

  const crc = crc32(fileContent);
  const uncompressedSize = fileContent.length;
  const compressedSize = fileContent.length;

  let localFileHeader = '';
  localFileHeader += String.fromCharCode(0x50, 0x4b, 0x03, 0x04);
  localFileHeader += String.fromCharCode(0x0a, 0x00);
  localFileHeader += String.fromCharCode(0x00, 0x00);
  localFileHeader += String.fromCharCode(0x00, 0x00);
  localFileHeader += String.fromCharCode(0x00, 0x00);
  localFileHeader += String.fromCharCode(0x00, 0x00);
  localFileHeader += String.fromCharCode(0x00, 0x00);
  localFileHeader += String.fromCharCode(crc & 0xff, (crc >> 8) & 0xff, (crc >> 16) & 0xff, (crc >> 24) & 0xff);
  localFileHeader += String.fromCharCode(compressedSize & 0xff, (compressedSize >> 8) & 0xff, (compressedSize >> 16) & 0xff, (compressedSize >> 24) & 0xff);
  localFileHeader += String.fromCharCode(uncompressedSize & 0xff, (uncompressedSize >> 8) & 0xff, (uncompressedSize >> 16) & 0xff, (uncompressedSize >> 24) & 0xff);
  localFileHeader += String.fromCharCode(filename.length & 0xff, (filename.length >> 8) & 0xff);
  localFileHeader += String.fromCharCode(0x00, 0x00);
  localFileHeader += filename;

  let centralDirHeader = '';
  centralDirHeader += String.fromCharCode(0x50, 0x4b, 0x01, 0x02);
  centralDirHeader += String.fromCharCode(0x14, 0x00);
  centralDirHeader += String.fromCharCode(0x0a, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(crc & 0xff, (crc >> 8) & 0xff, (crc >> 16) & 0xff, (crc >> 24) & 0xff);
  centralDirHeader += String.fromCharCode(compressedSize & 0xff, (compressedSize >> 8) & 0xff, (compressedSize >> 16) & 0xff, (compressedSize >> 24) & 0xff);
  centralDirHeader += String.fromCharCode(uncompressedSize & 0xff, (uncompressedSize >> 8) & 0xff, (uncompressedSize >> 16) & 0xff, (uncompressedSize >> 24) & 0xff);
  centralDirHeader += String.fromCharCode(filename.length & 0xff, (filename.length >> 8) & 0xff);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x20, 0x00, 0x00, 0x00);
  centralDirHeader += String.fromCharCode(0x00, 0x00, 0x00, 0x00);
  centralDirHeader += filename;

  const endOfCentralDir = ''
    + String.fromCharCode(0x50, 0x4b, 0x05, 0x06)
    + String.fromCharCode(0x00, 0x00)
    + String.fromCharCode(0x00, 0x00)
    + String.fromCharCode(0x01, 0x00)
    + String.fromCharCode(0x01, 0x00)
    + String.fromCharCode((centralDirHeader.length & 0xff), ((centralDirHeader.length >> 8) & 0xff), ((centralDirHeader.length >> 16) & 0xff), ((centralDirHeader.length >> 24) & 0xff))
    + String.fromCharCode(((localFileHeader.length + fileContent.length) & 0xff), (((localFileHeader.length + fileContent.length) >> 8) & 0xff), (((localFileHeader.length + fileContent.length) >> 16) & 0xff), (((localFileHeader.length + fileContent.length) >> 24) & 0xff))
    + String.fromCharCode(0x00, 0x00, 0x00, 0x00);

  return localFileHeader + fileContent + centralDirHeader + endOfCentralDir;
}

export default router;
