const GENRE_NAMES = ['古典', '电子', '爵士', '摇滚'];

export function createUIController(onGenreChange: (index: number) => void) {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed;
    left: 20px;
    bottom: 20px;
    background: rgba(26, 26, 46, 0.85);
    border-radius: 16px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    z-index: 100;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    animation: fadeIn 0.5s ease-out;
  `;

  const title = document.createElement('div');
  title.textContent = '🎵 选择流派';
  title.style.cssText = `
    color: #e0e0e0;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
    letter-spacing: 0.5px;
  `;
  panel.appendChild(title);

  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  `;
  panel.appendChild(buttonContainer);

  let selectedIndex = 0;
  const buttons: HTMLButtonElement[] = [];

  function updateButtonStyles() {
    buttons.forEach((btn, i) => {
      if (i === selectedIndex) {
        btn.style.background = 'rgba(233, 69, 96, 0.25)';
        btn.style.color = '#E94560';
        btn.style.boxShadow = '0 0 12px #E94560';
      } else {
        btn.style.background = 'rgba(255, 255, 255, 0.06)';
        btn.style.color = '#a0a0b0';
        btn.style.boxShadow = 'none';
      }
    });
  }

  GENRE_NAMES.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.style.cssText = `
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      padding: 8px 18px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: inherit;
      outline: none;
    `;
    btn.addEventListener('click', () => {
      selectedIndex = i;
      updateButtonStyles();
      onGenreChange(i);
    });
    buttons.push(btn);
    buttonContainer.appendChild(btn);
  });

  updateButtonStyles();

  const mobileStyle = document.createElement('style');
  mobileStyle.textContent = `
    @media (max-width: 640px) {
      #aura-panel {
        left: 0 !important;
        bottom: 0 !important;
        right: 0 !important;
        border-radius: 16px 16px 0 0 !important;
        align-items: center;
      }
      #aura-buttons {
        width: 100%;
        justify-content: center;
      }
    }
  `;
  document.head.appendChild(mobileStyle);

  panel.id = 'aura-panel';
  buttonContainer.id = 'aura-buttons';

  document.body.appendChild(panel);

  return { panel };
}
