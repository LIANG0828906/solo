import { ColorTheme } from './particleSystem';

export interface UIControlHandlers {
    onEmissionRateChange: (rate: number) => void;
    onLifeChange: (life: number) => void;
    onSpeedChange: (speed: number) => void;
    onColorThemeChange: (theme: ColorTheme) => void;
    onGravityMassChange: (mass: number) => void;
    onVortexStrengthChange: (strength: number) => void;
    onReset: () => void;
    onScreenshot: () => void;
}

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string }[] = [
    { value: 'pinkPurple', label: '粉紫星云' },
    { value: 'cyanBlue', label: '青蓝星云' },
    { value: 'orangeRed', label: '橙红星云' },
    { value: 'silverWhite', label: '银白云雾' }
];

export class UIControls {
    private _container: HTMLDivElement;
    private _panel: HTMLDivElement;
    private _handlers: UIControlHandlers;
    private _statsDisplay: HTMLDivElement | null = null;

    constructor(handlers: UIControlHandlers) {
        this._handlers = handlers;
        this._container = document.getElementById('app') as HTMLDivElement;
        this._panel = this._createPanel();
        this._injectStyles();
        this._container.appendChild(this._panel);
    }

    private _injectStyles(): void {
        const styleId = 'nebula-controls-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .nebula-control-panel {
                position: fixed;
                left: 16px;
                top: 50%;
                transform: translateY(-50%);
                width: 280px;
                background: rgba(10, 10, 20, 0.7);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 18px 18px 20px;
                z-index: 1000;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 40px rgba(120, 80, 200, 0.1);
                user-select: none;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
                color: #e0e0ff;
            }
            .nebula-panel-title {
                font-size: 14px;
                font-weight: 600;
                letter-spacing: 1px;
                margin-bottom: 4px;
                background: linear-gradient(90deg, #ff80ff, #80ffff);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
            .nebula-panel-subtitle {
                font-size: 11px;
                color: rgba(200, 200, 255, 0.5);
                margin-bottom: 16px;
                letter-spacing: 0.5px;
            }
            .nebula-control-group {
                margin-bottom: 14px;
            }
            .nebula-control-label {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: rgba(220, 220, 255, 0.85);
                margin-bottom: 6px;
                letter-spacing: 0.3px;
            }
            .nebula-control-value {
                font-size: 11px;
                color: #80ffff;
                font-weight: 600;
                font-variant-numeric: tabular-nums;
                background: rgba(128, 255, 255, 0.08);
                padding: 2px 8px;
                border-radius: 4px;
                min-width: 42px;
                text-align: right;
            }
            .nebula-slider {
                -webkit-appearance: none;
                appearance: none;
                width: 100%;
                height: 4px;
                border-radius: 2px;
                background: linear-gradient(90deg, rgba(255, 128, 255, 0.3), rgba(128, 255, 255, 0.3));
                outline: none;
                cursor: pointer;
                transition: height 0.3s ease;
            }
            .nebula-slider:hover {
                height: 5px;
            }
            .nebula-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff80ff, #80ffff);
                cursor: pointer;
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 0 10px rgba(200, 150, 255, 0.6);
                transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .nebula-slider::-webkit-slider-thumb:hover {
                transform: scale(1.15);
                box-shadow: 0 0 16px rgba(200, 150, 255, 0.9);
            }
            .nebula-slider::-moz-range-thumb {
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: linear-gradient(135deg, #ff80ff, #80ffff);
                cursor: pointer;
                border: 2px solid rgba(255, 255, 255, 0.9);
                box-shadow: 0 0 10px rgba(200, 150, 255, 0.6);
            }
            .nebula-select {
                width: 100%;
                padding: 7px 10px;
                border-radius: 6px;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #e0e0ff;
                font-size: 12px;
                font-family: inherit;
                cursor: pointer;
                outline: none;
                transition: border-color 0.3s ease, background 0.3s ease;
            }
            .nebula-select:hover {
                border-color: rgba(200, 150, 255, 0.5);
                background: rgba(255, 255, 255, 0.09);
            }
            .nebula-select:focus {
                border-color: rgba(200, 150, 255, 0.8);
            }
            .nebula-select option {
                background: #1a0a2e;
                color: #e0e0ff;
                border: none;
            }
            .nebula-button-row {
                display: flex;
                gap: 10px;
                margin-top: 18px;
            }
            .nebula-button {
                flex: 1;
                padding: 9px 12px;
                border-radius: 6px;
                border: 1px solid rgba(255, 255, 255, 0.12);
                background: rgba(255, 255, 255, 0.08);
                color: #e0e0ff;
                font-size: 12px;
                font-weight: 500;
                font-family: inherit;
                cursor: pointer;
                letter-spacing: 0.5px;
                transition: all 0.3s ease;
            }
            .nebula-button:hover {
                background: rgba(200, 150, 255, 0.2);
                border-color: rgba(200, 150, 255, 0.5);
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(200, 150, 255, 0.2);
            }
            .nebula-button:active {
                transform: translateY(0);
            }
            .nebula-button--primary {
                background: linear-gradient(135deg, rgba(255, 128, 255, 0.25), rgba(128, 255, 255, 0.25));
                border-color: rgba(200, 150, 255, 0.4);
            }
            .nebula-button--primary:hover {
                background: linear-gradient(135deg, rgba(255, 128, 255, 0.4), rgba(128, 255, 255, 0.4));
            }
            .nebula-divider {
                height: 1px;
                background: linear-gradient(90deg, transparent, rgba(200, 150, 255, 0.3), transparent);
                margin: 16px 0;
            }
            .nebula-section-label {
                font-size: 10px;
                letter-spacing: 1.5px;
                color: rgba(200, 150, 255, 0.6);
                text-transform: uppercase;
                margin-bottom: 10px;
                margin-top: 4px;
            }
            .nebula-stats {
                position: fixed;
                right: 16px;
                top: 16px;
                padding: 10px 14px;
                background: rgba(10, 10, 20, 0.6);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 8px;
                font-family: 'Segoe UI', system-ui, sans-serif;
                font-size: 11px;
                color: rgba(220, 220, 255, 0.8);
                z-index: 1000;
                line-height: 1.7;
                font-variant-numeric: tabular-nums;
            }
            .nebula-stats-item span {
                color: #80ffff;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }

    private _createPanel(): HTMLDivElement {
        const panel = document.createElement('div');
        panel.className = 'nebula-control-panel';
        panel.innerHTML = `
            <div class="nebula-panel-title">✦ NEBULA CONTROLS</div>
            <div class="nebula-panel-subtitle">星云粒子参数控制面板</div>

            <div class="nebula-section-label">粒子发射</div>

            <div class="nebula-control-group">
                <div class="nebula-control-label">
                    <span>发射速率</span>
                    <span class="nebula-control-value" id="val-emission">200</span>
                </div>
                <input type="range" class="nebula-slider" id="slider-emission"
                    min="50" max="500" step="1" value="200">
            </div>

            <div class="nebula-control-group">
                <div class="nebula-control-label">
                    <span>粒子寿命 (秒)</span>
                    <span class="nebula-control-value" id="val-life">15</span>
                </div>
                <input type="range" class="nebula-slider" id="slider-life"
                    min="5" max="30" step="1" value="15">
            </div>

            <div class="nebula-control-group">
                <div class="nebula-control-label">
                    <span>速度幅度</span>
                    <span class="nebula-control-value" id="val-speed">1.25</span>
                </div>
                <input type="range" class="nebula-slider" id="slider-speed"
                    min="0.5" max="5.0" step="0.05" value="1.25">
            </div>

            <div class="nebula-control-group">
                <div class="nebula-control-label">
                    <span>颜色主题</span>
                </div>
                <select class="nebula-select" id="select-theme">
                    ${COLOR_THEME_OPTIONS.map(opt =>
                        `<option value="${opt.value}">${opt.label}</option>`
                    ).join('')}
                </select>
            </div>

            <div class="nebula-divider"></div>
            <div class="nebula-section-label">力场调节</div>

            <div class="nebula-control-group">
                <div class="nebula-control-label">
                    <span>引力点质量</span>
                    <span class="nebula-control-value" id="val-gravity">0.5</span>
                </div>
                <input type="range" class="nebula-slider" id="slider-gravity"
                    min="0.1" max="2.0" step="0.05" value="0.5">
            </div>

            <div class="nebula-control-group">
                <div class="nebula-control-label">
                    <span>涡旋强度</span>
                    <span class="nebula-control-value" id="val-vortex">1.0</span>
                </div>
                <input type="range" class="nebula-slider" id="slider-vortex"
                    min="0.1" max="3.0" step="0.05" value="1.0">
            </div>

            <div class="nebula-button-row">
                <button class="nebula-button" id="btn-reset">↺ 重置粒子</button>
                <button class="nebula-button nebula-button--primary" id="btn-screenshot">⤓ 截图保存</button>
            </div>
        `;

        this._bindEvents(panel);
        this._createStatsDisplay();

        return panel;
    }

    private _bindEvents(panel: HTMLDivElement): void {
        const emissionSlider = panel.querySelector('#slider-emission') as HTMLInputElement;
        const emissionVal = panel.querySelector('#val-emission') as HTMLSpanElement;
        emissionSlider.addEventListener('input', (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            emissionVal.textContent = String(v);
            this._handlers.onEmissionRateChange(v);
        });

        const lifeSlider = panel.querySelector('#slider-life') as HTMLInputElement;
        const lifeVal = panel.querySelector('#val-life') as HTMLSpanElement;
        lifeSlider.addEventListener('input', (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            lifeVal.textContent = String(v);
            this._handlers.onLifeChange(v);
        });

        const speedSlider = panel.querySelector('#slider-speed') as HTMLInputElement;
        const speedVal = panel.querySelector('#val-speed') as HTMLSpanElement;
        speedSlider.addEventListener('input', (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            speedVal.textContent = v.toFixed(2);
            this._handlers.onSpeedChange(v);
        });

        const themeSelect = panel.querySelector('#select-theme') as HTMLSelectElement;
        themeSelect.addEventListener('change', (e) => {
            const v = (e.target as HTMLSelectElement).value as ColorTheme;
            this._handlers.onColorThemeChange(v);
        });

        const gravitySlider = panel.querySelector('#slider-gravity') as HTMLInputElement;
        const gravityVal = panel.querySelector('#val-gravity') as HTMLSpanElement;
        gravitySlider.addEventListener('input', (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            gravityVal.textContent = v.toFixed(2);
            this._handlers.onGravityMassChange(v);
        });

        const vortexSlider = panel.querySelector('#slider-vortex') as HTMLInputElement;
        const vortexVal = panel.querySelector('#val-vortex') as HTMLSpanElement;
        vortexSlider.addEventListener('input', (e) => {
            const v = Number((e.target as HTMLInputElement).value);
            vortexVal.textContent = v.toFixed(2);
            this._handlers.onVortexStrengthChange(v);
        });

        const resetBtn = panel.querySelector('#btn-reset') as HTMLButtonElement;
        resetBtn.addEventListener('click', () => this._handlers.onReset());

        const screenshotBtn = panel.querySelector('#btn-screenshot') as HTMLButtonElement;
        screenshotBtn.addEventListener('click', () => this._handlers.onScreenshot());
    }

    private _createStatsDisplay(): void {
        this._statsDisplay = document.createElement('div');
        this._statsDisplay.className = 'nebula-stats';
        this._statsDisplay.innerHTML = `
            <div class="nebula-stats-item">FPS: <span id="stat-fps">0</span></div>
            <div class="nebula-stats-item">粒子数: <span id="stat-count">0</span></div>
        `;
        this._container.appendChild(this._statsDisplay);
    }

    public updateStats(fps: number, particleCount: number): void {
        if (!this._statsDisplay) return;
        const fpsEl = this._statsDisplay.querySelector('#stat-fps');
        const countEl = this._statsDisplay.querySelector('#stat-count');
        if (fpsEl) fpsEl.textContent = fps.toFixed(0);
        if (countEl) countEl.textContent = particleCount.toString();
    }
}
