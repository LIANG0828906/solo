import { parseInputText, ImageryData } from '../engine/semanticParser';

export type GenerateCallback = (imageryList: ImageryData[]) => void;
export type ClearCallback = () => void;

export class InputPanel {
  private container: HTMLElement;
  private panel: HTMLDivElement;
  private textarea: HTMLTextAreaElement;
  private generateBtn: HTMLButtonElement;
  private clearBtn: HTMLButtonElement;
  private generateCallback: GenerateCallback | null = null;
  private clearCallback: ClearCallback | null = null;
  private placeholderText: string = '描述你的梦境...';

  constructor(container: HTMLElement) {
    this.container = container;
    this.panel = document.createElement('div');
    this.textarea = document.createElement('textarea');
    this.generateBtn = document.createElement('button');
    this.clearBtn = document.createElement('button');

    this.setupStyles();
    this.setupEvents();
    this.build();
  }

  private setupStyles(): void {
    this.panel.style.cssText = `
      position: absolute;
      top: 40px;
      left: 40px;
      width: 300px;
      min-height: 280px;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid #4A4A6E;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 100;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      font-family: inherit;
    `;

    const panelHeaderStyle = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    `;

    const titleStyle = `
      color: #C0C0E0;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 1px;
    `;

    this.clearBtn.style.cssText = `
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #4A4A6E;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.3s ease;
      position: relative;
      flex-shrink: 0;
    `;

    this.textarea.style.cssText = `
      flex: 1;
      min-height: 120px;
      max-height: 180px;
      resize: none;
      background: rgba(0, 0, 0, 0.3);
      color: #E0E0FF;
      border: 1px solid #6A6A8E;
      border-radius: 8px;
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.6;
      outline: none;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
      font-family: inherit;
    `;

    this.generateBtn.style.cssText = `
      width: 100%;
      height: 44px;
      border: none;
      border-radius: 8px;
      background: linear-gradient(135deg, #6A5ACD 0%, #7B68EE 100%);
      color: #FFFFFF;
      font-size: 14px;
      font-weight: 600;
      letter-spacing: 2px;
      cursor: pointer;
      transition: transform 0.25s ease, filter 0.25s ease, box-shadow 0.25s ease;
      position: relative;
      overflow: hidden;
      font-family: inherit;
      box-shadow: 0 4px 15px rgba(106, 90, 205, 0.3);
    `;
  }

  private setupEvents(): void {
    this.clearBtn.addEventListener('mouseenter', () => {
      this.clearBtn.style.background = '#6A6A8E';
    });
    this.clearBtn.addEventListener('mouseleave', () => {
      this.clearBtn.style.background = '#4A4A6E';
    });
    this.clearBtn.addEventListener('click', () => {
      this.handleClear();
    });

    this.textarea.addEventListener('focus', () => {
      this.textarea.style.borderColor = '#8A8ABE';
      this.textarea.style.boxShadow = '0 0 0 3px rgba(138, 138, 190, 0.15)';
    });
    this.textarea.addEventListener('blur', () => {
      this.textarea.style.borderColor = '#6A6A8E';
      this.textarea.style.boxShadow = 'none';
    });

    this.generateBtn.addEventListener('mouseenter', () => {
      this.generateBtn.style.transform = 'translateX(4px)';
      this.generateBtn.style.filter = 'brightness(1.1)';
      this.generateBtn.style.boxShadow = '0 6px 20px rgba(106, 90, 205, 0.45)';
    });
    this.generateBtn.addEventListener('mouseleave', () => {
      this.generateBtn.style.transform = 'translateX(0)';
      this.generateBtn.style.filter = 'brightness(1)';
      this.generateBtn.style.boxShadow = '0 4px 15px rgba(106, 90, 205, 0.3)';
    });
    this.generateBtn.addEventListener('mousedown', () => {
      this.generateBtn.style.transform = 'translateX(4px) scale(0.95)';
    });
    this.generateBtn.addEventListener('mouseup', () => {
      this.generateBtn.style.transform = 'translateX(4px) scale(1)';
    });
    this.generateBtn.addEventListener('click', () => {
      this.handleGenerate();
    });

    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.handleGenerate();
      }
    });
  }

  private build(): void {
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    `;

    const title = document.createElement('span');
    title.textContent = '梦境树洞';
    title.style.cssText = `
      color: #C0C0E0;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 1px;
    `;

    this.clearBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C0C0E0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    this.clearBtn.title = '清空场景';

    header.appendChild(title);
    header.appendChild(this.clearBtn);

    this.textarea.placeholder = this.placeholderText;
    this.textarea.value = '';

    this.generateBtn.textContent = '生成梦境';

    this.panel.appendChild(header);
    this.panel.appendChild(this.textarea);
    this.panel.appendChild(this.generateBtn);

    this.container.appendChild(this.panel);
  }

  private handleGenerate(): void {
    const text = this.textarea.value.trim();
    if (!text) {
      this.shakePanel();
      return;
    }

    const imageryList = parseInputText(text);
    if (imageryList.length === 0) {
      this.shakePanel();
      return;
    }

    if (this.generateCallback) {
      this.generateCallback(imageryList);
    }
  }

  private handleClear(): void {
    this.textarea.value = '';
    if (this.clearCallback) {
      this.clearCallback();
    }
  }

  private shakePanel(): void {
    this.panel.style.animation = 'none';
    this.panel.offsetHeight;
    this.panel.style.animation = 'shake 0.4s ease';
  }

  public setGenerateCallback(callback: GenerateCallback): void {
    this.generateCallback = callback;
  }

  public setClearCallback(callback: ClearCallback): void {
    this.clearCallback = callback;
  }

  public getInputText(): string {
    return this.textarea.value;
  }

  public setInputText(text: string): void {
    this.textarea.value = text;
  }

  public mount(): void {
    if (!document.getElementById('dream-shake-style')) {
      const style = document.createElement('style');
      style.id = 'dream-shake-style';
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `;
      document.head.appendChild(style);
    }
  }

  public destroy(): void {
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}
