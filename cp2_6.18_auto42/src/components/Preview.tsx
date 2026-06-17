import { useRef, useEffect, useState } from 'react';
import { useCardStore } from '@/store';
import { getTemplateByName, CARD_WIDTH, CARD_HEIGHT, TITLE_MAX_LENGTH } from '@/constants/templates';
import { exportCardAsPng, generateCardHtml, copyToClipboard } from '@/utils/exportUtils';

export function Preview() {
  const { currentCard, showToast, saveHistory } = useCardStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const [titleFontSize, setTitleFontSize] = useState(36);
  const [isExporting, setIsExporting] = useState(false);

  const template = getTemplateByName(currentCard.template);

  useEffect(() => {
    if (!cardRef.current) return;
    const titleEl = cardRef.current.querySelector('.card-title') as HTMLElement | null;
    if (!titleEl) return;

    const maxWidth = CARD_WIDTH - 48;
    let size = 48;
    titleEl.style.fontSize = size + 'px';
    titleEl.textContent = currentCard.title;

    while (size > 24 && titleEl.scrollWidth > maxWidth) {
      size -= 2;
      titleEl.style.fontSize = size + 'px';
    }

    setTitleFontSize(size);
  }, [currentCard.title]);

  const handleExportPng = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportCardAsPng(cardRef.current);
      showToast('已导出 PNG 图片');
      saveHistory();
    } catch (err) {
      console.error(err);
      showToast('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyHtml = async () => {
    const html = generateCardHtml({
      title: currentCard.title,
      body: currentCard.body,
      emoji: currentCard.emoji,
      colors: currentCard.colors,
      fontFamily: template.fontFamily,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
    try {
      await copyToClipboard(html);
      showToast('已复制');
      saveHistory();
    } catch {
      showToast('复制失败，请重试');
    }
  };

  return (
    <div className="preview-container">
      <div
        ref={cardRef}
        className="card-preview"
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          background: currentCard.colors.background,
          borderColor: currentCard.colors.accent,
          fontFamily: template.fontFamily,
          transitionProperty: 'background-color, border-color, color',
          transitionDuration: '0.4s',
          transitionTimingFunction: 'ease-out',
        }}
      >
        <div className="card-emoji">
          <span className="emoji-text">{currentCard.emoji}</span>
        </div>
        <div
          className="card-title"
          style={{
            color: currentCard.colors.title,
            fontSize: titleFontSize,
            transition: 'color 0.4s ease-out',
          }}
        >
          {currentCard.title}
        </div>
        <div
          className="card-body"
          style={{
            color: currentCard.colors.body,
            transition: 'color 0.4s ease-out',
          }}
        >
          {currentCard.body}
        </div>
      </div>

      <div className="export-buttons">
        <button
          className="primary-btn"
          onClick={handleExportPng}
          disabled={isExporting}
        >
          📷 导出 PNG
        </button>
        <button className="primary-btn" onClick={handleCopyHtml}>
          📋 复制 HTML
        </button>
      </div>
    </div>
  );
}
