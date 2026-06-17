import { useRef, useEffect, useState, useCallback } from 'react';
import { useCardStore } from '@/store';
import { getTemplateByName, CARD_WIDTH, CARD_HEIGHT, TITLE_MAX_LENGTH } from '@/constants/templates';
import { exportCardAsPng, generateCardHtml, copyToClipboard, generateThumbnail } from '@/utils/exportUtils';

export function Preview() {
  const { currentCard, showToast, saveHistory } = useCardStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [titleFontSize, setTitleFontSize] = useState(36);
  const [isExporting, setIsExporting] = useState(false);
  const [cardDisplayWidth, setCardDisplayWidth] = useState(CARD_WIDTH);
  const [cardDisplayHeight, setCardDisplayHeight] = useState(CARD_HEIGHT);

  const template = getTemplateByName(currentCard.template);

  const calculateTitleFontSize = useCallback((titleEl: HTMLElement, maxWidth: number): number => {
    let size = 48;
    titleEl.style.fontSize = size + 'px';
    titleEl.textContent = currentCard.title;
    while (size > 24 && titleEl.scrollWidth > maxWidth) {
      size -= 2;
      titleEl.style.fontSize = size + 'px';
    }
    return size;
  }, [currentCard.title]);

  const updateCardSize = useCallback(() => {
    if (!containerRef.current) return;
    const containerEl = containerRef.current;
    const computedStyle = getComputedStyle(containerEl);
    const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(computedStyle.paddingRight) || 0;
    const availableWidth = containerEl.clientWidth - paddingLeft - paddingRight;
    const displayWidth = Math.min(availableWidth, CARD_WIDTH);
    const displayHeight = displayWidth * 0.75;
    setCardDisplayWidth(displayWidth);
    setCardDisplayHeight(displayHeight);
  }, []);

  useEffect(() => {
    updateCardSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCardSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateCardSize]);

  useEffect(() => {
    if (!cardRef.current) return;
    const titleEl = cardRef.current.querySelector('.card-title') as HTMLElement | null;
    if (!titleEl) return;

    const maxWidth = cardDisplayWidth - 48;
    const size = calculateTitleFontSize(titleEl, maxWidth);
    setTitleFontSize(size);
  }, [currentCard.title, cardDisplayWidth, calculateTitleFontSize]);

  const handleExportPng = async () => {
    if (!cardRef.current || isExporting) return;
    setIsExporting(true);
    try {
      const cardEl = cardRef.current;
      const titleEl = cardEl.querySelector('.card-title') as HTMLElement | null;
      const prevWidth = cardEl.style.width;
      const prevHeight = cardEl.style.height;
      const prevTitleFontSize = titleEl?.style.fontSize;

      cardEl.style.width = CARD_WIDTH + 'px';
      cardEl.style.height = CARD_HEIGHT + 'px';

      if (titleEl) {
        calculateTitleFontSize(titleEl, CARD_WIDTH - 48);
      }

      await exportCardAsPng(cardEl);

      let thumbnail: string | undefined;
      try {
        thumbnail = await generateThumbnail(cardEl, 160, 120);
      } catch {
        thumbnail = undefined;
      }

      cardEl.style.width = prevWidth;
      cardEl.style.height = prevHeight;
      if (titleEl && prevTitleFontSize) {
        titleEl.style.fontSize = prevTitleFontSize;
      }

      showToast('已导出 PNG 图片');
      saveHistory(thumbnail);
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

      let thumbnail: string | undefined;
      if (cardRef.current) {
        const cardEl = cardRef.current;
        const titleEl = cardEl.querySelector('.card-title') as HTMLElement | null;
        const prevWidth = cardEl.style.width;
        const prevHeight = cardEl.style.height;
        const prevTitleFontSize = titleEl?.style.fontSize;

        cardEl.style.width = CARD_WIDTH + 'px';
        cardEl.style.height = CARD_HEIGHT + 'px';
        if (titleEl) {
          calculateTitleFontSize(titleEl, CARD_WIDTH - 48);
        }

        try {
          thumbnail = await generateThumbnail(cardEl, 160, 120);
        } catch {
          thumbnail = undefined;
        }

        cardEl.style.width = prevWidth;
        cardEl.style.height = prevHeight;
        if (titleEl && prevTitleFontSize) {
          titleEl.style.fontSize = prevTitleFontSize;
        }
      }

      showToast('已复制');
      saveHistory(thumbnail);
    } catch {
      showToast('复制失败，请重试');
    }
  };

  return (
    <div ref={containerRef} className="preview-container">
      <div
        ref={cardRef}
        className="card-preview"
        style={{
          width: cardDisplayWidth,
          height: cardDisplayHeight,
          maxWidth: CARD_WIDTH,
          aspectRatio: '4 / 3',
          background: currentCard.colors.background,
          borderColor: currentCard.colors.accent,
          fontFamily: template.fontFamily,
          transitionProperty: 'background-color, border-color, color, width, height',
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
