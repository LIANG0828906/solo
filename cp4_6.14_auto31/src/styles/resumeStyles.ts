// 主题类型：支持5种主题（简洁灰、商务蓝、极简白、暖橙、深色专业）
export type Theme = string;

// 主题配置接口：定义主题所需的所有颜色和字体属性
interface ThemeConfig {
  primary: string;       // 主色
  background: string;    // 背景色
  text: string;          // 文字色
  accent: string;        // 强调色
  cardShadow: string;    // 卡片阴影（完整的box-shadow值）
  fontHeading: string;   // 标题字体
  fontBody: string;      // 正文字体
}

// A4纸尺寸常量（单位：毫米）
export const WIDTH_MM = 210;
export const HEIGHT_MM = 297;

// 系统字体栈（兼容各平台的无衬线字体）
const systemFontStack = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";

// 5种主题配置
const themeConfigs: Record<string, ThemeConfig> = {
  '简洁灰': {
    primary: '#607D8B',
    background: '#FAFAFA',
    text: '#37474F',
    accent: '#455A64',
    cardShadow: '0 2px 8px rgba(96,125,139,0.15)',
    fontHeading: systemFontStack,
    fontBody: systemFontStack,
  },
  '商务蓝': {
    primary: '#1976D2',
    background: '#FFFFFF',
    text: '#1A237E',
    accent: '#FFC107',
    cardShadow: '0 2px 8px rgba(25,118,210,0.2)',
    fontHeading: systemFontStack,
    fontBody: systemFontStack,
  },
  '极简白': {
    primary: '#212121',
    background: '#FFFFFF',
    text: '#212121',
    accent: '#F44336',
    cardShadow: '0 1px 4px rgba(0,0,0,0.08)',
    fontHeading: systemFontStack,
    fontBody: systemFontStack,
  },
  '暖橙': {
    primary: '#FF9800',
    background: '#FFF8E1',
    text: '#BF360C',
    accent: '#5D4037',
    cardShadow: '0 2px 8px rgba(255,152,0,0.25)',
    fontHeading: systemFontStack,
    fontBody: systemFontStack,
  },
  '深色专业': {
    primary: '#1DE9B6',
    background: '#263238',
    text: '#ECEFF1',
    accent: '#00BFA5',
    cardShadow: '0 4px 16px rgba(0,0,0,0.3)',
    fontHeading: systemFontStack,
    fontBody: systemFontStack,
  },
};

// 毫米转像素函数（默认96DPI）
export function mmToPx(mm: number, dpi: number = 96): number {
  return (mm * dpi) / 25.4;
}

// 生成主题CSS变量字符串
// 包含所有主题相关的CSS自定义属性和过渡动画
export function generateThemeCSS(themeName: string): string {
  const config = themeConfigs[themeName] || themeConfigs['简洁灰'];
  
  return `
    --resume-primary: ${config.primary};
    --resume-background: ${config.background};
    --resume-text: ${config.text};
    --resume-accent: ${config.accent};
    --resume-card-shadow: ${config.cardShadow};
    --resume-font-heading: ${config.fontHeading};
    --resume-font-body: ${config.fontBody};
    transition: all 0.5s ease;
  `;
}

// 应用主题到根元素
// 将CSS变量设置到document.documentElement，使全局生效
export function applyTheme(themeName: string): void {
  const cssVariables = generateThemeCSS(themeName);
  document.documentElement.style.cssText += cssVariables;
}

export const resumePrintStyles = `
  @media print {
    @page {
      size: A4;
      margin: 10mm;
    }
    
    body {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      background: white !important;
      color: black !important;
    }
    
    .resume-container {
      width: ${WIDTH_MM}mm;
      min-height: ${HEIGHT_MM}mm;
      box-shadow: none !important;
      margin: 0;
      padding: 0;
    }
    
    .no-print {
      display: none !important;
    }
    
    .resume-content {
      page-break-inside: avoid;
    }
    
    .section-break {
      page-break-before: always;
    }
    
    h1, h2, h3, h4 {
      page-break-after: avoid;
    }
    
    table, figure, pre, code {
      page-break-inside: avoid;
    }
    
    ul, ol {
      page-break-before: avoid;
    }
  }
`;
