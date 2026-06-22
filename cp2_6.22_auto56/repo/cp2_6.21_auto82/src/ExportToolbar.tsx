import React, { useState } from 'react';
import { FileCode, Image, FileJson, Download } from 'lucide-react';
import {
  PaletteColor,
  copyToClipboard,
  exportCSSVariables,
  exportJSON,
  generateSVGSwatch,
} from './colorEngine';

export interface ExportToolbarProps {
  colors: PaletteColor[];
  onToast: (msg: string, ok?: boolean) => void;
}

const ExportToolbar: React.FC<ExportToolbarProps> = ({ colors, onToast }) => {
  const [, setDummy] = useState(0);
  void setDummy;
  const filled = colors.filter((c) => c.hex).map((c) => c.hex);
  const disabled = filled.length === 0;

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportCSS = async () => {
    if (disabled) return;
    const vars = exportCSSVariables(filled);
    const css = `:root {\n${vars.split('\n').map((l) => `  ${l}`).join('\n')}\n}\n`;
    const ok = await copyToClipboard(css);
    if (ok) {
      onToast('CSS变量已复制到剪贴板', true);
      downloadFile(css, 'palette.css', 'text/css');
    } else {
      downloadFile(css, 'palette.css', 'text/css');
      onToast('CSS变量已下载', true);
    }
  };

  const handleExportSVG = () => {
    if (disabled) return;
    const svg = generateSVGSwatch(filled);
    downloadFile(svg, 'palette.svg', 'image/svg+xml');
    onToast('SVG色板已下载 (1200 × 200)', true);
  };

  const handleExportJSON = async () => {
    if (disabled) return;
    const json = exportJSON(filled);
    const ok = await copyToClipboard(json);
    if (ok) {
      onToast('JSON已复制到剪贴板', true);
      downloadFile(json, 'palette.json', 'application/json');
    } else {
      downloadFile(json, 'palette.json', 'application/json');
      onToast('JSON已下载', true);
    }
  };

  return (
    <div className="export-section">
      <div className="panel-title">
        <Download className="panel-title-icon" size={18} />
        导出与保存
      </div>

      <div className="export-buttons">
        <button
          className="export-btn"
          onClick={handleExportCSS}
          disabled={disabled}
          style={{
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <FileCode size={22} className="export-btn-icon" />
          <span className="export-btn-label">CSS 变量</span>
          <span className="export-btn-sub">复制 + 下载</span>
        </button>

        <button
          className="export-btn"
          onClick={handleExportSVG}
          disabled={disabled}
          style={{
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <Image size={22} className="export-btn-icon" />
          <span className="export-btn-label">SVG 色板</span>
          <span className="export-btn-sub">1200 × 200</span>
        </button>

        <button
          className="export-btn"
          onClick={handleExportJSON}
          disabled={disabled}
          style={{
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          <FileJson size={22} className="export-btn-icon" />
          <span className="export-btn-label">JSON 数组</span>
          <span className="export-btn-sub">复制 + 下载</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(ExportToolbar);
