import { COLORS, SPICE_PRESETS, SpiceType } from './types';

export function createMenuBar(): HTMLElement {
  const bar = document.createElement('div');
  bar.style.cssText = `
    width: 100%;
    max-width: 1280px;
    height: 56px;
    background: linear-gradient(180deg, ${COLORS.boardYellow} 0%, #E8D4A8 100%);
    border: 2px solid ${COLORS.inkBlack};
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    position: relative;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.6),
      inset 0 -2px 0 rgba(47,47,47,0.1),
      0 4px 12px rgba(47,47,47,0.15);
    transition: all 0.3s ease;
  `;

  const scrollEndLeft = document.createElement('div');
  scrollEndLeft.style.cssText = `
    position: absolute;
    left: -8px; top: -4px; bottom: -4px;
    width: 20px;
    background: ${COLORS.inkBlack};
    border-radius: 4px;
  `;
  const scrollEndRight = scrollEndLeft.cloneNode() as HTMLElement;
  scrollEndRight.style.left = 'auto';
  scrollEndRight.style.right = '-8px';

  const title = document.createElement('div');
  title.textContent = '宋 代 酒 楼 · 后 厨';
  title.style.cssText = `
    font-family: 'Ma Shan Zheng', 'KaiTi', serif;
    font-size: 22px;
    color: ${COLORS.woodBrown};
    letter-spacing: 6px;
    text-shadow: 1px 1px 0 rgba(255,255,255,0.4);
  `;

  const hint = document.createElement('div');
  hint.textContent = '拖拽菜刀切食材 · 拖食材入锅 · 点香料加味';
  hint.style.cssText = `
    font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
    font-size: 13px;
    color: ${COLORS.brickGray};
    letter-spacing: 2px;
  `;

  bar.appendChild(scrollEndLeft);
  bar.appendChild(title);
  bar.appendChild(hint);
  bar.appendChild(scrollEndRight);

  return bar;
}

export function createCanvas(width: number, height: number, id: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.id = id;
  canvas.width = width;
  canvas.height = height;
  canvas.style.cssText = `
    display: block;
    width: ${width}px;
    height: ${height}px;
    cursor: default;
    max-width: 100%;
    height: auto;
  `;
  return canvas;
}

export function createSpiceRack(onSpiceClick: (type: SpiceType) => void): HTMLElement {
  const rack = document.createElement('div');
  rack.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 12px;
    background: linear-gradient(180deg, ${COLORS.woodBrown} 0%, #3E2612 100%);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(47,47,47,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  `;

  const label = document.createElement('div');
  label.textContent = '香 料 架';
  label.style.cssText = `
    font-family: 'Ma Shan Zheng', 'KaiTi', serif;
    font-size: 18px;
    color: ${COLORS.boardYellow};
    text-align: center;
    letter-spacing: 4px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(245, 222, 179, 0.3);
    margin-bottom: 4px;
  `;
  rack.appendChild(label);

  (Object.keys(SPICE_PRESETS) as SpiceType[]).forEach((type) => {
    const preset = SPICE_PRESETS[type];
    const jar = document.createElement('div');
    jar.style.cssText = `
      width: 72px;
      height: 80px;
      background: linear-gradient(180deg, rgba(245,222,179,0.25) 0%, rgba(245,222,179,0.08) 100%);
      border: 1px solid rgba(245,222,179,0.35);
      border-radius: 8px 8px 6px 6px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      padding: 6px 4px 8px;
      cursor: pointer;
      transition: all 0.25s ease;
      position: relative;
    `;

    const lid = document.createElement('div');
    lid.style.cssText = `
      position: absolute;
      top: -4px; left: 6px; right: 6px;
      height: 14px;
      background: ${COLORS.inkBlack};
      border-radius: 4px 4px 2px 2px;
    `;
    jar.appendChild(lid);

    const content = document.createElement('div');
    content.style.cssText = `
      width: 70%;
      height: 44px;
      background: ${preset.color};
      border-radius: 4px 4px 6px 6px;
      opacity: 0.85;
      box-shadow: inset 0 2px 6px rgba(0,0,0,0.3);
    `;
    jar.appendChild(content);

    const name = document.createElement('div');
    name.textContent = preset.name;
    name.style.cssText = `
      margin-top: 4px;
      font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
      font-size: 13px;
      color: ${COLORS.boardYellow};
      letter-spacing: 2px;
    `;
    jar.appendChild(name);

    jar.addEventListener('mouseenter', () => {
      jar.style.transform = 'translateY(-3px) scale(1.04)';
      jar.style.boxShadow = '0 6px 16px rgba(255,140,0,0.25)';
    });
    jar.addEventListener('mouseleave', () => {
      jar.style.transform = '';
      jar.style.boxShadow = '';
    });
    jar.addEventListener('click', () => onSpiceClick(type));

    rack.appendChild(jar);
  });

  return rack;
}

export function createDishPlate(): { container: HTMLElement; canvas: HTMLCanvasElement } {
  const container = document.createElement('div');
  container.style.cssText = `
    width: 340px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  `;

  const label = document.createElement('div');
  label.textContent = '盛 菜 盘';
  label.style.cssText = `
    position: absolute;
    top: -4px; left: 50%;
    transform: translateX(-50%);
    font-family: 'Ma Shan Zheng', 'KaiTi', serif;
    font-size: 16px;
    color: ${COLORS.woodBrown};
    letter-spacing: 4px;
  `;
  container.appendChild(label);

  const plate = document.createElement('div');
  plate.style.cssText = `
    width: 320px;
    height: 200px;
    background:
      radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.9) 0%, rgba(240,240,240,0.95) 40%, rgba(230,230,230,1) 100%);
    border-radius: 160px / 100px;
    box-shadow:
      0 6px 20px rgba(47,47,47,0.25),
      inset 0 2px 6px rgba(255,255,255,0.8),
      inset 0 -4px 10px rgba(0,0,0,0.08);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #F8F8F8;
  `;

  const blueRimOuter = document.createElement('div');
  blueRimOuter.style.cssText = `
    position: absolute;
    top: 8px; left: 8px; right: 8px; bottom: 8px;
    border: 2px solid rgba(30, 80, 160, 0.6);
    border-radius: 150px / 92px;
    pointer-events: none;
  `;
  const blueRimInner = blueRimOuter.cloneNode() as HTMLElement;
  blueRimInner.style.top = '14px';
  blueRimInner.style.left = '14px';
  blueRimInner.style.right = '14px';
  blueRimInner.style.bottom = '14px';
  blueRimInner.style.border = '1px solid rgba(30, 80, 160, 0.4)';
  blueRimInner.style.borderRadius = '142px / 84px';

  plate.appendChild(blueRimOuter);
  plate.appendChild(blueRimInner);

  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 180;
  canvas.style.cssText = `
    position: relative;
    z-index: 2;
    pointer-events: none;
  `;
  plate.appendChild(canvas);

  container.appendChild(plate);
  return { container, canvas };
}

export function createIngredientTray(
  types: Array<{ type: string; name: string; color: string }>,
  onPick: (type: string) => void
): HTMLElement {
  const tray = document.createElement('div');
  tray.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px 10px;
    background: linear-gradient(180deg, #8B7355 0%, #6B5344 100%);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(47,47,47,0.25);
  `;

  const label = document.createElement('div');
  label.textContent = '食 材 架';
  label.style.cssText = `
    font-family: 'Ma Shan Zheng', 'KaiTi', serif;
    font-size: 16px;
    color: ${COLORS.boardYellow};
    text-align: center;
    letter-spacing: 4px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(245,222,179,0.25);
  `;
  tray.appendChild(label);

  types.forEach((item) => {
    const btn = document.createElement('div');
    btn.style.cssText = `
      width: 76px;
      height: 56px;
      background: rgba(245,222,179,0.12);
      border: 1px solid rgba(245,222,179,0.3);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.25s ease;
      flex-direction: column;
      gap: 4px;
    `;

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 28px; height: 22px;
      background: ${item.color};
      border-radius: 50%;
      box-shadow: inset 0 1px 3px rgba(255,255,255,0.3), inset 0 -1px 3px rgba(0,0,0,0.2);
    `;

    const name = document.createElement('span');
    name.textContent = item.name;
    name.style.cssText = `
      font-family: 'ZCOOL XiaoWei', 'KaiTi', serif;
      font-size: 12px;
      color: ${COLORS.boardYellow};
    `;

    btn.appendChild(dot);
    btn.appendChild(name);

    btn.addEventListener('mouseenter', () => {
      btn.style.transform = 'translateY(-2px)';
      btn.style.background = 'rgba(245,222,179,0.22)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
      btn.style.background = 'rgba(245,222,179,0.12)';
    });
    btn.addEventListener('click', () => onPick(item.type));

    tray.appendChild(btn);
  });

  return tray;
}
