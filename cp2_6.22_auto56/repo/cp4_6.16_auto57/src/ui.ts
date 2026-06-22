export interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet' | 'nebula';
  color: string;
  colorDesc: string;
  temperature: number;
  distanceFromSun: number;
  size: number;
}

export interface UIActions {
  onSelectCategory: (cat: 'all' | 'star' | 'planet' | 'nebula') => void;
  onClosePanel: () => void;
  onOutsideClick: () => void;
}

export function createUI(actions: UIActions) {
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    @keyframes titleBreath {
      0%, 100% { opacity: .8; }
      50% { opacity: 1; }
    }
    .sd-panel::-webkit-scrollbar {
      width: 6px;
    }
    .sd-panel::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 3px;
    }
    .sd-panel::-webkit-scrollbar-thumb {
      background: rgba(79, 195, 247, 0.4);
      border-radius: 3px;
    }
    .sd-panel::-webkit-scrollbar-thumb:hover {
      background: rgba(79, 195, 247, 0.6);
    }
  `;
  document.head.appendChild(styleTag);

  const isMobile = () => window.innerWidth < 1024;

  const header = document.createElement('div');
  header.style.position = 'fixed';
  header.style.top = '0';
  header.style.left = '0';
  header.style.width = '100%';
  header.style.padding = isMobile() ? '12px 0' : '20px 0';
  header.style.zIndex = '10';
  header.style.display = 'flex';
  header.style.justifyContent = 'center';
  header.style.alignItems = 'center';
  header.style.pointerEvents = 'none';

  const title = document.createElement('div');
  title.textContent = 'StarDrifter';
  title.style.fontFamily = 'sans-serif';
  title.style.fontSize = '28px';
  title.style.fontWeight = 'bold';
  title.style.color = 'white';
  title.style.textShadow = '0 0 12px rgba(79, 195, 247, .6)';
  title.style.animation = 'titleBreath 2s ease-in-out infinite';
  header.appendChild(title);
  document.body.appendChild(header);

  const categoryBar = document.createElement('div');
  categoryBar.style.position = 'fixed';
  categoryBar.style.bottom = isMobile() ? '16px' : '28px';
  categoryBar.style.left = '50%';
  categoryBar.style.transform = 'translateX(-50%)';
  categoryBar.style.display = 'flex';
  categoryBar.style.gap = '16px';
  categoryBar.style.zIndex = '10';

  type CategoryKey = 'star' | 'planet' | 'nebula';
  const categoryConfig: Array<{ key: CategoryKey; emoji: string; label: string }> = [
    { key: 'star', emoji: '⭐', label: '恒星' },
    { key: 'planet', emoji: '🪐', label: '行星' },
    { key: 'nebula', emoji: '🌌', label: '星云' },
  ];

  const categoryButtons: Map<CategoryKey, HTMLDivElement> = new Map();

  categoryConfig.forEach(({ key, emoji, label }) => {
    const btn = document.createElement('div');
    btn.style.width = '40px';
    btn.style.height = '40px';
    btn.style.borderRadius = '50%';
    btn.style.border = '1px solid #4fc3f7';
    btn.style.background = 'rgba(10, 14, 39, 0.5)';
    btn.style.backdropFilter = 'blur(12px)';
    btn.style.color = 'white';
    btn.style.fontSize = '13px';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'all 0.25s ease-out';
    btn.style.opacity = '0.5';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';
    btn.style.position = 'relative';
    btn.style.userSelect = 'none';

    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = emoji;
    emojiSpan.style.lineHeight = '1';
    btn.appendChild(emojiSpan);

    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    labelSpan.style.fontSize = '9px';
    labelSpan.style.position = 'absolute';
    labelSpan.style.bottom = '-16px';
    labelSpan.style.whiteSpace = 'nowrap';
    labelSpan.style.opacity = '0.7';
    btn.appendChild(labelSpan);

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'scale(1.1)';
      btn.style.boxShadow = '0 0 16px rgba(79, 195, 247, 0.5)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'scale(1)';
      btn.style.boxShadow = 'none';
    });
    btn.addEventListener('click', () => {
      actions.onSelectCategory(key);
    });

    categoryButtons.set(key, btn);
    categoryBar.appendChild(btn);
  });
  document.body.appendChild(categoryBar);

  const panel = document.createElement('div');
  panel.className = 'sd-panel';
  panel.style.position = 'fixed';
  panel.style.top = '50%';
  panel.style.transform = 'translateY(-50%) translateX(100%)';
  panel.style.right = '0';
  panel.style.width = isMobile() ? '240px' : '280px';
  panel.style.maxHeight = '80vh';
  panel.style.overflow = 'auto';
  panel.style.background = 'rgba(10, 14, 39, 0.65)';
  panel.style.backdropFilter = 'blur(12px)';
  panel.style.border = '1px solid #4fc3f7';
  panel.style.borderRight = 'none';
  panel.style.borderRadius = '12px 0 0 12px';
  panel.style.padding = '20px';
  panel.style.zIndex = '20';
  panel.style.color = 'white';
  panel.style.transition = 'transform 0.3s ease-out';
  panel.style.lineHeight = '1.8';
  panel.style.boxSizing = 'border-box';
  panel.style.fontFamily = 'sans-serif';

  const closeBtn = document.createElement('div');
  closeBtn.textContent = '×';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '12px';
  closeBtn.style.right = '12px';
  closeBtn.style.width = '24px';
  closeBtn.style.height = '24px';
  closeBtn.style.borderRadius = '50%';
  closeBtn.style.border = '1px solid #4fc3f7';
  closeBtn.style.display = 'flex';
  closeBtn.style.alignItems = 'center';
  closeBtn.style.justifyContent = 'center';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.fontSize = '16px';
  closeBtn.style.lineHeight = '1';
  closeBtn.style.color = '#4fc3f7';
  closeBtn.style.userSelect = 'none';
  closeBtn.style.transition = 'all 0.2s';
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.background = 'rgba(79, 195, 247, 0.2)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.background = 'transparent';
  });
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    actions.onClosePanel();
  });
  panel.appendChild(closeBtn);

  const panelTitle = document.createElement('div');
  panelTitle.style.fontSize = '20px';
  panelTitle.style.fontWeight = 'bold';
  panelTitle.style.marginBottom = '12px';
  panelTitle.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  panelTitle.style.paddingBottom = '8px';
  panelTitle.style.paddingRight = '32px';
  panel.appendChild(panelTitle);

  const infoItems: { label: string; valueEl: HTMLSpanElement }[] = [];
  const createInfoItem = (labelText: string) => {
    const row = document.createElement('div');
    row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.08)';
    row.style.padding = '6px 0';
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'baseline';
    row.style.gap = '8px';

    const label = document.createElement('span');
    label.style.color = '#a0a8c0';
    label.style.fontSize = '12px';
    label.textContent = labelText;

    const value = document.createElement('span');
    value.style.color = 'white';
    value.style.fontSize = '13px';
    value.style.fontWeight = '500';
    value.style.textAlign = 'right';

    row.appendChild(label);
    row.appendChild(value);
    panel.appendChild(row);
    infoItems.push({ label: labelText, valueEl: value });
  };

  createInfoItem('类型');
  createInfoItem('表面温度');
  createInfoItem('与太阳距离');
  createInfoItem('颜色描述');
  createInfoItem('编号ID');

  document.body.appendChild(panel);

  let panelOpen = false;

  document.addEventListener('click', (e) => {
    if (!panelOpen) return;
    if (panel.contains(e.target as Node)) return;
    if (categoryBar.contains(e.target as Node)) return;
    actions.onOutsideClick();
  });

  const applyResponsive = () => {
    header.style.padding = isMobile() ? '12px 0' : '20px 0';
    panel.style.width = isMobile() ? '240px' : '280px';
    categoryBar.style.bottom = isMobile() ? '16px' : '28px';
  };
  window.addEventListener('resize', applyResponsive);

  const typeMap: Record<string, string> = {
    star: '恒星',
    planet: '行星',
    nebula: '星云',
  };

  return {
    showDetails(body: CelestialBody) {
      panelTitle.textContent = body.name;
      infoItems[0].valueEl.textContent = typeMap[body.type] || body.type;
      infoItems[1].valueEl.textContent = `${body.temperature} K`;
      infoItems[2].valueEl.textContent = `${body.distanceFromSun} ly`;
      infoItems[3].valueEl.textContent = body.colorDesc;
      infoItems[4].valueEl.textContent = body.id;
      panelOpen = true;
      requestAnimationFrame(() => {
        panel.style.transform = 'translateY(-50%) translateX(0)';
      });
    },
    hideDetails() {
      panelOpen = false;
      panel.style.transform = 'translateY(-50%) translateX(100%)';
    },
    setActiveCategory(cat: 'all' | 'star' | 'planet' | 'nebula') {
      categoryButtons.forEach((btn, key) => {
        if (cat === 'all' || cat === key) {
          btn.style.background = '#4fc3f7';
          btn.style.opacity = '1';
        } else {
          btn.style.background = 'rgba(10, 14, 39, 0.5)';
          btn.style.opacity = '0.5';
        }
      });
    },
  };
}
