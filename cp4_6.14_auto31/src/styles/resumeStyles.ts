export type Theme = 'light' | 'dark';

interface ThemeConfig {
  primary: string;
  background: string;
  text: string;
  accent: string;
  shadow: string;
  fontHeading: string;
  fontBody: string;
}

export const WIDTH_MM = 210;
export const HEIGHT_MM = 297;

const themeConfigs: Record<Theme, ThemeConfig> = {
  light: {
    primary: '#1e40af',
    background: '#ffffff',
    text: '#1f2937',
    accent: '#3b82f6',
    shadow: 'rgba(0, 0, 0, 0.1)',
    fontHeading: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
  dark: {
    primary: '#60a5fa',
    background: '#111827',
    text: '#f3f4f6',
    accent: '#93c5fd',
    shadow: 'rgba(0, 0, 0, 0.3)',
    fontHeading: "'Inter', system-ui, sans-serif",
    fontBody: "'Inter', system-ui, sans-serif",
  },
};

export function mmToPx(mm: number, dpi: number = 96): number {
  return (mm * dpi) / 25.4;
}

export function generateThemeCSS(theme: Theme): string {
  const config = themeConfigs[theme] || themeConfigs.light;
  
  return `
    --resume-primary: ${config.primary};
    --resume-background: ${config.background};
    --resume-text: ${config.text};
    --resume-accent: ${config.accent};
    --resume-shadow: ${config.shadow};
    --resume-font-heading: ${config.fontHeading};
    --resume-font-body: ${config.fontBody};
    transition: background-color 0.5s ease, color 0.5s ease, border-color 0.5s ease, box-shadow 0.5s ease;
  `;
}

export function applyTheme(theme: Theme): void {
  const cssVariables = generateThemeCSS(theme);
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
