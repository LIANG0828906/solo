const GENRE_NAMES = ['古典', '电子', '爵士', '摇滚'];

export function createUIController(onGenreChange: (index: number) => void) {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes auraFadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .aura-panel {
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
      animation: auraFadeIn 0.5s ease-out;
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .aura-panel-title {
      color: #e0e0e0;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      letter-spacing: 0.5px;
    }
    .aura-button-group {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .aura-genre-btn {
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 999px;
      padding: 8px 18px;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.25s ease;
      font-family: inherit;
      outline: none;
      background: rgba(255, 255, 255, 0.06);
      color: #a0a0b0;
      box-shadow: none;
    }
    .aura-genre-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #d0d0e0;
    }
    .aura-genre-btn.active {
      background: rgba(233, 69, 96, 0.25);
      color: #E94560;
      border-color: rgba(233, 69, 96, 0.5);
      box-shadow: 0 0 12px #E94560;
    }
    @media (max-width: 640px) {
      .aura-panel {
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        border-radius: 16px 16px 0 0;
        align-items: center;
        padding: 16px 20px 24px;
        box-sizing: border-box;
        z-index: 1000;
      }
      .aura-button-group {
        width: 100%;
        justify-content: center;
      }
      .aura-genre-btn {
        flex: 1;
        min-width: 70px;
        padding: 10px 12px;
      }
    }
  `;
  document.head.appendChild(style);

  const panel = document.createElement('div');
  panel.className = 'aura-panel';

  const title = document.createElement('div');
  title.className = 'aura-panel-title';
  title.textContent = '🎵 选择流派';
  panel.appendChild(title);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'aura-button-group';
  panel.appendChild(buttonContainer);

  let selectedIndex = 0;
  const buttons: HTMLButtonElement[] = [];

  function updateButtonStyles() {
    buttons.forEach((btn, i) => {
      if (i === selectedIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  GENRE_NAMES.forEach((name, i) => {
    const btn = document.createElement('button');
    btn.className = 'aura-genre-btn';
    btn.textContent = name;
    btn.addEventListener('click', () => {
      selectedIndex = i;
      updateButtonStyles();
      onGenreChange(i);
    });
    buttons.push(btn);
    buttonContainer.appendChild(btn);
  });

  updateButtonStyles();

  document.body.appendChild(panel);

  return { panel };
}
