import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import { WireframePage, WireframeElement } from './types';
import { useStore } from './store/useStore';
import { WireframeCard } from './components/WireframeCard';

interface PrototypeRendererProps {
  pages: WireframePage[];
}

export const PrototypeRenderer: React.FC<PrototypeRendererProps> = ({ pages }) => {
  const theme = useStore((state) => state.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const startExport = useStore((state) => state.startExport);
  const setExportProgress = useStore((state) => state.setExportProgress);
  const finishExport = useStore((state) => state.finishExport);

  const generateHTML = (): string => {
    const menuItems = pages.map((page, index) => `
      <div class="menu-item" style="animation-delay: ${index * 0.1}s">
        <a href="#${page.id}" style="color: inherit; text-decoration: none;">${page.title}</a>
      </div>
    `).join('');

    const pageSections = pages.map((page) => `
      <section id="${page.id}" class="page-section">
        <h2>${page.title}</h2>
        <div class="wireframe-content">
          ${page.elements.map(renderElementHTML).join('')}
        </div>
      </section>
    `).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>线框图预览</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      transition: background-color 0.4s ease, color 0.4s ease;
    }

    .navbar {
      position: sticky;
      top: 0;
      background: white;
      padding: 0 24px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #e2e8f0;
      z-index: 100;
    }

    .navbar h1 {
      font-size: 18px;
      font-weight: 600;
      color: #6366f1;
    }

    .hamburger {
      display: none;
      flex-direction: column;
      cursor: pointer;
      padding: 8px;
      transition: transform 0.1s ease;
    }

    .hamburger:active {
      transform: scale(0.95);
    }

    .hamburger span {
      width: 24px;
      height: 2px;
      background: #0f172a;
      margin: 3px 0;
      transition: 0.3s;
    }

    .nav-menu {
      display: flex;
      gap: 24px;
    }

    .menu-item {
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      transition: background-color 0.2s ease;
    }

    .menu-item:hover {
      background-color: #e2e8f0;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 24px;
    }

    .page-section {
      margin-bottom: 48px;
    }

    .page-section h2 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 16px;
      color: #0f172a;
    }

    .wireframe-content {
      position: relative;
      width: 100%;
      min-height: 350px;
      background-color: #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
      padding: 16px;
    }

    .wf-element {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    .wf-element:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .wf-button {
      background-color: #6366f1;
      color: white;
      cursor: pointer;
    }

    .wf-button:active {
      transform: scale(0.95);
    }

    .wf-input {
      background-color: white;
      border: 2px solid #cbd5e1;
      justify-content: flex-start;
      padding-left: 12px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .wf-input:focus {
      outline: none;
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    }

    .wf-nav {
      background-color: white;
      border-bottom: 2px solid #e2e8f0;
      border-radius: 0;
      font-weight: 600;
    }

    .wf-title {
      font-size: 18px;
      font-weight: 700;
      justify-content: flex-start;
    }

    .wf-text {
      background-color: #cbd5e1;
    }

    @media (max-width: 768px) {
      .hamburger {
        display: flex;
      }

      .nav-menu {
        position: absolute;
        top: 56px;
        left: 0;
        right: 0;
        background: white;
        flex-direction: column;
        padding: 16px;
        gap: 8px;
        border-bottom: 1px solid #e2e8f0;
        display: none;
      }

      .nav-menu.open {
        display: flex;
      }

      .menu-item {
        opacity: 0;
        transform: translateY(-10px);
        animation: flyIn 0.3s ease forwards;
      }

      @keyframes flyIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .container {
        padding: 16px;
      }

      .wireframe-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
      }

      .wf-element {
        position: relative !important;
        left: auto !important;
        top: auto !important;
        width: 100% !important;
        height: auto !important;
        min-height: 44px;
      }
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <h1>线框图预览</h1>
    <div class="hamburger" onclick="toggleMenu()">
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="nav-menu" id="navMenu">
      ${menuItems}
    </div>
  </nav>
  <div class="container">
    ${pageSections}
  </div>
  <script>
    function toggleMenu() {
      const menu = document.getElementById('navMenu');
      menu.classList.toggle('open');
    }

    document.querySelectorAll('.wf-button').forEach(btn => {
      btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.style.transform = '';
        }, 100);
      });
    });
  </script>
</body>
</html>`;
  };

  const renderElementHTML = (element: WireframeElement): string => {
    const baseStyle = `left: ${element.x}%; top: ${element.y}%; width: ${element.width}%; height: ${element.height}%;`;
    
    switch (element.type) {
      case 'button':
        return `<div class="wf-element wf-button" style="${baseStyle}">${element.label}</div>`;
      case 'input':
        return `<div class="wf-element wf-input" style="${baseStyle}" tabindex="0">${element.label}</div>`;
      case 'nav':
        return `<div class="wf-element wf-nav" style="${baseStyle}">${element.label}</div>`;
      case 'title':
        return `<div class="wf-element wf-title" style="${baseStyle}">${element.label}</div>`;
      case 'text':
      default:
        return `<div class="wf-element wf-text" style="${baseStyle}">${element.label}</div>`;
    }
  };

  const handleExport = async () => {
    startExport();

    await new Promise((resolve) => setTimeout(resolve, 100));
    setExportProgress(25);

    await new Promise((resolve) => setTimeout(resolve, 300));
    setExportProgress(50);

    await new Promise((resolve) => setTimeout(resolve, 300));
    setExportProgress(75);

    const html = generateHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wireframe-preview.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    await new Promise((resolve) => setTimeout(resolve, 200));
    setExportProgress(100);

    setTimeout(() => {
      finishExport();
    }, 800);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflowY: 'auto',
        padding: '24px',
        backgroundColor: theme.colors.background,
        transition: 'background-color 0.4s ease',
      }}
    >
      {pages.length === 0 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.colors.text,
            opacity: 0.6,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <div style={{ fontSize: '16px' }}>在左侧输入用户故事以生成线框图</div>
        </div>
      ) : (
        <>
          <div
            style={{
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
          >
            <button
              onClick={handleExport}
              style={{
                padding: '10px 20px',
                backgroundColor: theme.colors.accent,
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'transform 0.1s ease, box-shadow 0.25s ease',
              }}
              onMouseDown={(e) => {
                (e.target as HTMLButtonElement).style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                (e.target as HTMLButtonElement).style.transform = '';
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.transform = '';
              }}
            >
              导出 HTML
            </button>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px',
            }}
          >
            {pages.map((page) => (
              <WireframeCard key={page.id} page={page} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
