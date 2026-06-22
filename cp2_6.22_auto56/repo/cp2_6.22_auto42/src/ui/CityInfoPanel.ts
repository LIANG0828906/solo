// 城市信息面板：根据当前时间步和鼠标点击的城市ID，显示详情、预警图标和受灾预估
// 数据流向：从DataService获取CityImpact数据，渲染到HTML模板

import type { CityImpact, DisasterLevel } from '@/data/DataService';
import { ControlPanel } from './ControlPanel';

export class CityInfoPanel {
  private host: HTMLElement;
  private panel: HTMLElement;
  private backdrop: HTMLElement;
  private closeBtn: HTMLElement;

  private cityData: CityImpact[] = [];
  private currentCityId: string | null = null;
  private currentStep = 0;
  private open = false;

  /** 弹性缓动：cubic-bezier(0.34, 1.56, 0.64, 1) ease-out */
  private static readonly EASE_ELASTIC = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  private static readonly EASE_STD = 'cubic-bezier(0.22, 1, 0.36, 1)';
  private static readonly DURATION_PANEL_MS = 700;
  private static readonly DURATION_BACKDROP_MS = 350;

  constructor(host: HTMLElement) {
    this.host = host;

    // ===== 背景遮罩（虚化） =====
    this.backdrop = document.createElement('div');
    Object.assign(this.backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(5,10,30,0)',
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)',
      zIndex: '100',
      opacity: '0',
      pointerEvents: 'none',
      transition: `opacity ${CityInfoPanel.DURATION_BACKDROP_MS}ms ${CityInfoPanel.EASE_STD},
                   background ${CityInfoPanel.DURATION_BACKDROP_MS}ms ${CityInfoPanel.EASE_STD},
                   backdrop-filter ${CityInfoPanel.DURATION_BACKDROP_MS}ms ${CityInfoPanel.EASE_STD},
                   -webkit-backdrop-filter ${CityInfoPanel.DURATION_BACKDROP_MS}ms ${CityInfoPanel.EASE_STD}`,
    } as unknown as CSSStyleDeclaration);
    this.backdrop.addEventListener('click', () => this.close());

    // ===== 城市信息面板（底部滑入 + 弹性动画） =====
    this.panel = document.createElement('div');
    Object.assign(this.panel.style, {
      position: 'fixed',
      left: '50%',
      bottom: '0',
      transform: 'translate(-50%, 110%)',
      width: 'min(520px, calc(100% - 32px))',
      maxHeight: 'min(78vh, 620px)',
      overflowY: 'auto',
      background: 'rgba(18,28,62,0.88)',
      backdropFilter: 'blur(22px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(22px) saturate(1.4)',
      border: '1px solid rgba(120,180,255,0.22)',
      borderBottom: 'none',
      borderRadius: '24px 24px 0 0',
      zIndex: '101',
      transition: `transform ${CityInfoPanel.DURATION_PANEL_MS}ms ${CityInfoPanel.EASE_ELASTIC}, opacity 400ms ${CityInfoPanel.EASE_STD}`,
      boxShadow: '0 -20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
      padding: '28px 28px 36px',
      color: '#eaf3ff',
      opacity: '0',
      pointerEvents: 'none',
      willChange: 'transform, opacity',
    } as unknown as CSSStyleDeclaration);

    // 响应式布局回调
    const applyMedia = () => {
      if (window.innerWidth < 768) {
        this.panel.style.width = '100%';
        this.panel.style.left = '0';
        this.panel.style.borderRadius = '20px 20px 0 0';
        if (this.open) {
          this.panel.style.transform = 'translateY(0)';
        } else {
          this.panel.style.transform = 'translateY(110%)';
        }
      } else {
        this.panel.style.width = 'min(520px, calc(100% - 32px))';
        this.panel.style.left = '50%';
        this.panel.style.borderRadius = '24px 24px 0 0';
        if (this.open) {
          this.panel.style.transform = 'translate(-50%, -24px)';
        } else {
          this.panel.style.transform = 'translate(-50%, 110%)';
        }
      }
    };
    window.addEventListener('resize', applyMedia);
    this._applyMedia = applyMedia;

    // 关闭按钮（圆形带X图标）
    this.closeBtn = document.createElement('button');
    this.closeBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
    `;
    Object.assign(this.closeBtn.style, {
      position: 'absolute',
      top: '14px',
      right: '14px',
      width: '36px',
      height: '36px',
      borderRadius: '50%',
      border: 'none',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.08)',
      color: '#cfe4ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14)',
      transition: 'all 0.2s ease',
    } as unknown as CSSStyleDeclaration);
    this.closeBtn.addEventListener('mouseenter', () => {
      (this.closeBtn.style as any).background = 'rgba(255,77,77,0.25)';
      this.closeBtn.style.color = '#ff8f8f';
      (this.closeBtn.style as any).boxShadow = 'inset 0 0 0 1px rgba(255,77,77,0.5)';
    });
    this.closeBtn.addEventListener('mouseleave', () => {
      (this.closeBtn.style as any).background = 'rgba(255,255,255,0.08)';
      this.closeBtn.style.color = '#cfe4ff';
      (this.closeBtn.style as any).boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.14)';
    });
    this.closeBtn.addEventListener('click', () => this.close());

    this.panel.appendChild(this.closeBtn);

    this.host.appendChild(this.backdrop);
    this.host.appendChild(this.panel);
  }

  private _applyMedia: () => void = () => {};

  setCityData(list: CityImpact[]): void {
    this.cityData = list.slice();
  }

  setCurrentStep(step: number): void {
    this.currentStep = step;
    if (this.currentCityId) this.renderFor(this.currentCityId);
  }

  /**
   * 打开面板：从底部弹入，带弹性 cubic-bezier 过渡，背景同步虚化
   * 两帧策略：第一帧设为初始偏移（屏幕外），第二帧设为目标位置触发 transition
   */
  openFor(cityId: string): void {
    this.currentCityId = cityId;
    this.open = true;
    this.renderFor(cityId);

    // 第一帧：确保面板在屏幕外 + 可交互（transition 的起始状态）
    this.panel.style.pointerEvents = 'auto';
    this.panel.style.opacity = '0';
    if (window.innerWidth < 768) {
      this.panel.style.transform = 'translateY(110%)';
    } else {
      this.panel.style.transform = 'translate(-50%, 110%)';
    }

    // 背景遮罩：从透明/无模糊开始
    Object.assign(this.backdrop.style, {
      background: 'rgba(5,10,30,0)',
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)',
      pointerEvents: 'auto',
    });

    // 第二帧：浏览器已渲染初始状态，现在设置目标值触发 CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // 面板滑入
        this.panel.style.opacity = '1';
        if (window.innerWidth < 768) {
          this.panel.style.transform = 'translateY(0)';
        } else {
          this.panel.style.transform = 'translate(-50%, -24px)';
        }

        // 背景同步虚化
        Object.assign(this.backdrop.style, {
          opacity: '1',
          background: 'rgba(5,10,30,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        });
      });
    });
  }

  /**
   * 关闭面板：先动画移出，再锁定 pointerEvents
   */
  close(): void {
    this.open = false;
    this.currentCityId = null;

    // 面板滑出（使用 transition 反向动画）
    this.panel.style.opacity = '0';
    if (window.innerWidth < 768) {
      this.panel.style.transform = 'translateY(110%)';
    } else {
      this.panel.style.transform = 'translate(-50%, 110%)';
    }

    // 背景同步淡出 + 去虚化
    Object.assign(this.backdrop.style, {
      opacity: '0',
      background: 'rgba(5,10,30,0)',
      backdropFilter: 'blur(0px)',
      WebkitBackdropFilter: 'blur(0px)',
    });

    // 动画结束后锁定事件
    window.setTimeout(() => {
      if (!this.open) {
        this.panel.style.pointerEvents = 'none';
        this.backdrop.style.pointerEvents = 'none';
      }
    }, CityInfoPanel.DURATION_PANEL_MS);
  }

  private renderFor(cityId: string): void {
    const city = this.cityData.find(c => c.cityId === cityId);
    if (!city) return;
    const step = Math.min(this.currentStep, city.timeline.length - 1);
    const s = city.timeline[step];
    const dl = ControlPanel.disasterLabel(s.disasterLevel);

    const windLabel = windLevelToName(s.windLevel);

    // 预警图标
    const badgeStyle = `
      display:inline-flex; align-items:center; gap:8px;
      padding: 8px 14px; border-radius: 99px;
      color:${dl.color}; background:${dl.bg};
      box-shadow: inset 0 0 0 1px ${dl.color}55, 0 0 18px ${dl.color}33;
      font-weight:700; letter-spacing:1px;
      animation: pulse 1.8s ease-in-out infinite;
    `;

    const iconSVG = (color: string) => `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    `;

    const peopleText = formatPeople(s.affectedPopulation);

    this.panel.innerHTML = '';
    this.panel.appendChild(this.closeBtn);

    this.panel.insertAdjacentHTML('beforeend', `
      <style>
        @keyframes pulse { 0%,100% { box-shadow: inset 0 0 0 1px ${dl.color}55, 0 0 14px ${dl.color}33; } 50% { box-shadow: inset 0 0 0 1px ${dl.color}88, 0 0 26px ${dl.color}66; } }
        @keyframes reveal { from { opacity:0; transform: translateY(10px);} to { opacity:1; transform: none; } }
        .ci-row > * { animation: reveal 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .ci-row > *:nth-child(2) { animation-delay: 0.06s; }
        .ci-row > *:nth-child(3) { animation-delay: 0.12s; }
        .ci-row > *:nth-child(4) { animation-delay: 0.18s; }
      </style>

      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px;">
        <div>
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: rgba(180,200,255,0.5); margin-bottom:6px;">CITY IMPACT REPORT</div>
          <h2 style="font-size: 30px; font-weight: 700; letter-spacing: 1.5px;
                     background: linear-gradient(135deg, #e0f2ff 0%, #90e0ef 100%);
                     -webkit-background-clip: text; -webkit-text-fill-color: transparent;
                     line-height: 1.1;">${city.name}</h2>
          <div style="margin-top:6px; color: rgba(180,200,255,0.65); font-size:12px; font-variant-numeric: tabular-nums;">
            ${formatLL(city.lat, city.lng)} · T+${String(step).padStart(2, '0')} h · ${city.size === 'large' ? '大型城市' : '中小型城市'}
          </div>
        </div>
        <div style="${badgeStyle}">
          ${iconSVG(dl.color)}
          <span>${dl.name}</span>
        </div>
      </div>

      <div class="ci-row" style="display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:12px; margin-bottom:20px;">
        ${this.statCard('风力等级', `${s.windLevel} 级`, windLabel, '#9fd6ff', `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
        `)}
        ${this.statCard('预计降雨量', `${s.rainfall.toFixed(1)} mm`, s.rainfall > 200 ? '特大暴雨' : s.rainfall > 100 ? '大暴雨' : s.rainfall > 50 ? '暴雨' : s.rainfall > 20 ? '大雨' : s.rainfall > 10 ? '中雨' : '小雨', s.rainfall > 100 ? '#ff7a7a' : s.rainfall > 50 ? '#ffb454' : '#9fd6ff', `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.69 5.64 9.05a6.5 6.5 0 1 0 9.19 0Z"/></svg>
        `)}
        ${this.statCard('灾害等级', ['—', '轻度', '中度', '严重'][s.disasterLevel], dl.name, dl.color, iconSVG(dl.color))}
        ${this.statCard('受灾人口预估', peopleText.n, peopleText.unit, '#f0c7ff', `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        `)}
      </div>

      <div style="padding: 16px 18px; border-radius: 14px; background: rgba(0,180,216,0.08);
                  box-shadow: inset 0 0 0 1px rgba(0,180,216,0.25);">
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9fd6ff" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div style="font-size: 12px; letter-spacing:1px; text-transform: uppercase; color: #9fd6ff;">防御指引</div>
        </div>
        <ul style="margin:0; padding-left: 18px; color: rgba(220,235,255,0.8); font-size: 13px; line-height:1.7;">
          ${renderAdvice(s.disasterLevel, s.windLevel).map(x => `<li>${x}</li>`).join('')}
        </ul>
      </div>
    `);
  }

  private statCard(label: string, value: string, sub: string, color: string, icon: string): string {
    return `
      <div style="padding: 16px; border-radius: 14px;
                  background: rgba(255,255,255,0.04);
                  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
                  position: relative; overflow: hidden;">
        <div style="position:absolute; top:-16px; right:-14px; opacity:0.12; color:${color};">
          ${icon}
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
          <span style="color:${color};">${icon}</span>
          <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: rgba(180,200,255,0.55);">${label}</span>
        </div>
        <div style="font-size: 26px; font-weight:700; color:${color}; line-height:1.1; margin-bottom:4px;">${value}</div>
        <div style="font-size: 12px; color: rgba(180,200,255,0.65);">${sub}</div>
      </div>
    `;
  }
}

function windLevelToName(level: number): string {
  const table: [number, string][] = [
    [1, '无风'], [2, '轻风'], [3, '微风'], [4, '和风'],
    [5, '清劲风'], [6, '强风'], [7, '疾风'], [8, '大风'],
    [9, '烈风'], [10, '狂风'], [11, '暴风'], [12, '飓风'],
  ];
  const k = Math.max(1, Math.min(12, Math.round(level)));
  return table.find(x => x[0] === k)?.[1] ?? `${k} 级`;
}

function formatPeople(n: number): { n: string; unit: string } {
  if (n >= 10000) return { n: (n / 10000).toFixed(n >= 100000 ? 0 : 1), unit: '万人' };
  if (n >= 1000) return { n: (n / 1000).toFixed(1), unit: '千人' };
  return { n: String(n), unit: '人' };
}

function formatLL(lat: number, lng: number): string {
  const latH = lat >= 0 ? 'N' : 'S';
  const lngH = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latH}, ${Math.abs(lng).toFixed(2)}°${lngH}`;
}

function renderAdvice(level: DisasterLevel, wind: number): string[] {
  const base: string[] = [];
  if (level >= 1) base.push('密切关注气象部门发布的预警信息，保持通讯畅通。');
  if (level >= 2 || wind >= 8) base.push('尽量减少外出，加固门窗和户外易坠物品，储备必要的饮用水和食品。');
  if (level >= 3 || wind >= 10) {
    base.push('低洼易涝、危房及地质灾害风险区域的居民应听从指挥，及时转移至安全场所。');
    base.push('沿海船只及时回港避風，海上作业人员撤离；暂停高空、户外等危险作业。');
  }
  if (base.length === 0) base.push('保持关注台风最新动态，做好防风防雨的基本准备。');
  return base;
}
