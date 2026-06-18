import { ParticleGroup } from '../engine/particleEngine';

export class InfoPanel {
  private container: HTMLElement;
  private panel: HTMLDivElement;
  private handle: HTMLDivElement;
  private content: HTMLDivElement;
  private isExpanded: boolean = false;
  private currentGroup: ParticleGroup | null = null;
  private autoCloseTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.panel = document.createElement('div');
    this.handle = document.createElement('div');
    this.content = document.createElement('div');

    this.setupStyles();
    this.setupEvents();
    this.build();
  }

  private setupStyles(): void {
    this.panel.style.cssText = `
      position: absolute;
      top: 40px;
      right: 0;
      width: 200px;
      transform: translateX(calc(100% - 40px));
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 100;
      font-family: inherit;
      pointer-events: auto;
    `;

    this.handle.style.cssText = `
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 40px;
      height: 80px;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid #4A4A6E;
      border-right: none;
      border-radius: 12px 0 0 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.3s ease;
      user-select: none;
    `;

    this.content.style.cssText = `
      margin-left: 40px;
      min-height: 200px;
      max-height: 70vh;
      overflow-y: auto;
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid #4A4A6E;
      border-left: none;
      border-radius: 0 16px 16px 0;
      padding: 20px 16px;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.2);
    `;
  }

  private setupEvents(): void {
    this.handle.addEventListener('mouseenter', () => {
      this.handle.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    this.handle.addEventListener('mouseleave', () => {
      this.handle.style.background = 'rgba(255, 255, 255, 0.06)';
    });
    this.handle.addEventListener('click', () => {
      this.toggle();
    });

    this.content.addEventListener('scroll', () => {
      this.resetAutoClose();
    });
  }

  private build(): void {
    const arrowIcon = document.createElement('div');
    arrowIcon.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8A8ABE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="handle-arrow">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    `;
    arrowIcon.style.cssText = `
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    arrowIcon.className = 'handle-icon-wrapper';
    this.handle.appendChild(arrowIcon);

    this.content.innerHTML = this.getEmptyContentHTML();

    this.panel.appendChild(this.handle);
    this.panel.appendChild(this.content);
    this.container.appendChild(this.panel);
  }

  private getEmptyContentHTML(): string {
    return `
      <div style="color: #6A6A8E; font-size: 12px; text-align: center; padding: 40px 0; line-height: 1.8;">
        <div style="margin-bottom: 12px; opacity: 0.6;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6A6A8E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto; display: block;">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        点击场景中的粒子群<br>查看梦境意象
      </div>
    `;
  }

  private getGroupContentHTML(group: ParticleGroup): string {
    const { imageryData } = group;
    const tagsHTML = imageryData.emotionTags
      .map(tag => `
        <span style="
          display: inline-block;
          padding: 3px 10px;
          background: ${imageryData.color}22;
          border: 1px solid ${imageryData.color}55;
          color: ${imageryData.color};
          border-radius: 12px;
          font-size: 11px;
          margin: 0 4px 4px 0;
          letter-spacing: 0.5px;
        ">${tag}</span>
      `).join('');

    return `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #4A4A6E55;">
        <div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: ${imageryData.color};
          box-shadow: 0 0 16px ${imageryData.color}88;
          flex-shrink: 0;
        "></div>
        <div style="
          color: #E0E0FF;
          font-size: 18px;
          font-weight: 600;
          letter-spacing: 2px;
        ">${imageryData.keyword}</div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="
          color: #8A8ABE;
          font-size: 11px;
          letter-spacing: 1px;
          margin-bottom: 8px;
          text-transform: uppercase;
        ">情绪标签</div>
        <div>${tagsHTML}</div>
      </div>

      <div style="margin-bottom: 16px;">
        <div style="
          color: #8A8ABE;
          font-size: 11px;
          letter-spacing: 1px;
          margin-bottom: 8px;
          text-transform: uppercase;
        ">相关片段</div>
        <div style="
          color: #C0C0E0;
          font-size: 12px;
          line-height: 1.7;
          background: rgba(0, 0, 0, 0.2);
          padding: 10px 12px;
          border-radius: 8px;
          border-left: 3px solid ${imageryData.color};
        ">${imageryData.textSnippet}</div>
      </div>

      <div style="
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 12px;
        border-top: 1px solid #4A4A6E55;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          color: #6A6A8E;
          font-size: 11px;
        ">
          <span>粒子数量</span>
          <span style="color: #E0E0FF;">${imageryData.particleCount.toLocaleString()}</span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          color: #6A6A8E;
          font-size: 11px;
        ">
          <span>运动周期</span>
          <span style="color: #E0E0FF;">${imageryData.motionParams.periodMin}-${imageryData.motionParams.periodMax}s</span>
        </div>
        <div style="
          display: flex;
          justify-content: space-between;
          color: #6A6A8E;
          font-size: 11px;
        ">
          <span>色值</span>
          <span style="color: ${imageryData.color}; font-family: monospace;">${imageryData.color}</span>
        </div>
      </div>
    `;
  }

  public showGroup(group: ParticleGroup): void {
    this.currentGroup = group;
    this.content.innerHTML = this.getGroupContentHTML(group);
    this.expand();
    this.resetAutoClose();
  }

  public expand(): void {
    if (this.isExpanded) return;
    this.isExpanded = true;
    this.panel.style.transform = 'translateX(0)';

    const arrow = this.handle.querySelector('.handle-arrow') as HTMLElement | null;
    if (arrow) {
      arrow.style.transform = 'rotate(180deg)';
    }
  }

  public collapse(): void {
    if (!this.isExpanded) return;
    this.isExpanded = false;
    this.panel.style.transform = 'translateX(calc(100% - 40px))';

    const arrow = this.handle.querySelector('.handle-arrow') as HTMLElement | null;
    if (arrow) {
      arrow.style.transform = 'rotate(0deg)';
    }
  }

  public toggle(): void {
    if (this.isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  private resetAutoClose(): void {
    if (this.autoCloseTimer !== null) {
      window.clearTimeout(this.autoCloseTimer);
    }
    this.autoCloseTimer = window.setTimeout(() => {
      if (this.isExpanded) {
        // Auto collapse after 10 seconds of inactivity
      }
    }, 10000);
  }

  public mount(): void {
    // Mount is handled in constructor build
  }

  public destroy(): void {
    if (this.autoCloseTimer !== null) {
      window.clearTimeout(this.autoCloseTimer);
    }
    if (this.panel.parentNode) {
      this.panel.parentNode.removeChild(this.panel);
    }
  }
}
