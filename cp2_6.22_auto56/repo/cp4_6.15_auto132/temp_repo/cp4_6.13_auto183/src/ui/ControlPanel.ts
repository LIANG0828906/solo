import type { SculptureMode } from '@/types';

class ControlPanel {
  container: HTMLElement;
  currentMode: SculptureMode = 'deform';
  onModeChange: ((mode: SculptureMode) => void) | null = null;
  onReset: (() => void) | null = null;
  private buttons: HTMLButtonElement[] = [];
  private fpsDisplay: HTMLElement | null = null;
  private isCollapsed: boolean = false;
  private collapseButton: HTMLButtonElement | null = null;
  private controlsContainer: HTMLElement | null = null;

  constructor(sculptureManager: any) {
    this.container = document.createElement('div');
    this.container.style.cssText = 'position: fixed; bottom: 20px; left: 20px; display: flex; gap: 8px; align-items: center; z-index: 1000;';

    this.controlsContainer = document.createElement('div');
    this.controlsContainer.style.cssText = 'display: flex; gap: 8px; align-items: center;';

    const buttonStyle = 'padding: 10px 16px; border-radius: 8px; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); cursor: pointer; backdrop-filter: blur(10px); font-size: 14px; transition: all 0.2s ease;';
    const activeStyle = 'background: rgba(0,212,255,0.3); border-color: rgba(0,212,255,0.5);';

    const modes: { mode: SculptureMode; label: string }[] = [
      { mode: 'deform', label: '形变' },
      { mode: 'rotate', label: '旋转' },
      { mode: 'color', label: '颜色' }
    ];

    modes.forEach(({ mode, label }) => {
      const button = document.createElement('button');
      button.textContent = label;
      button.style.cssText = buttonStyle;
      if (mode === this.currentMode) {
        button.style.cssText += activeStyle;
      }
      button.addEventListener('click', () => {
        this.currentMode = mode;
        this.buttons.forEach(b => {
          b.style.background = 'rgba(255,255,255,0.1)';
          b.style.borderColor = 'rgba(255,255,255,0.2)';
        });
        button.style.background = 'rgba(0,212,255,0.3)';
        button.style.borderColor = 'rgba(0,212,255,0.5)';
        if (this.onModeChange) {
          this.onModeChange(mode);
        }
        if (sculptureManager && sculptureManager.setMode) {
          sculptureManager.setMode(mode);
        }
      });
      this.buttons.push(button);
      this.controlsContainer!.appendChild(button);
    });

    const resetButton = document.createElement('button');
    resetButton.textContent = '重置';
    resetButton.style.cssText = buttonStyle;
    resetButton.addEventListener('click', () => {
      if (this.onReset) {
        this.onReset();
      }
      if (sculptureManager && sculptureManager.reset) {
        sculptureManager.reset();
      }
    });
    this.controlsContainer.appendChild(resetButton);

    this.fpsDisplay = document.createElement('div');
    this.fpsDisplay.style.cssText = 'margin-left: 16px; color: rgba(255,255,255,0.6); font-size: 14px; font-family: monospace;';
    this.fpsDisplay.textContent = 'FPS: 60';
    this.controlsContainer.appendChild(this.fpsDisplay);

    this.collapseButton = document.createElement('button');
    this.collapseButton.style.cssText = 'width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.3); border: 1px solid rgba