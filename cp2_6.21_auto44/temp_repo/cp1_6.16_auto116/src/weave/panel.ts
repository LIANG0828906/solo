import { useStore } from '../store';
import { CONSTELLATIONS, playClickSound } from '../core/main';
import type { Constellation } from '../core/orb';

export function createConstellationPanel(container: HTMLElement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'ui-panel constellation-panel';
  panel.style.cssText = `
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 250px;
    max-height: 80vh;
    background: rgba(42, 42, 62, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 12px;
    padding: 20px;
    z-index: 100;
    overflow-y: auto;
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
  `;

  const title = document.createElement('h3');
  title.textContent = '二十八星宿';
  title.style.cssText = `
    color: #D4AF37;
    font-size: 18px;
    margin-bottom: 16px;
    text-align: center;
    letter-spacing: 4px;
    font-weight: 400;
  `;
  panel.appendChild(title);

  const subtitle = document.createElement('p');
  subtitle.textContent = '拖拽星宿至天球编织星轨';
  subtitle.style.cssText = `
    color: rgba(224, 240, 255, 0.6);
    font-size: 12px;
    text-align: center;
    margin-bottom: 20px;
    letter-spacing: 1px;
  `;
  panel.appendChild(subtitle);

  const grid = document.createElement('div');
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  `;

  CONSTELLATIONS.forEach((constellation) => {
    const item = createConstellationItem(constellation);
    grid.appendChild(item);
  });

  panel.appendChild(grid);

  const divider = document.createElement('div');
  divider.style.cssText = `
    width: 100%;
    height: 1px;
    background: linear-gradient(to right, transparent, rgba(212, 175, 55, 0.5), transparent);
    margin: 20px 0;
  `;
  panel.appendChild(divider);

  const connectedSection = document.createElement('div');
  connectedSection.style.cssText = `
    margin-top: 10px;
  `;

  const connectedTitle = document.createElement('h4');
  connectedTitle.textContent = '已连接星宿';
  connectedTitle.style.cssText = `
    color: #E0F0FF;
    font-size: 14px;
    margin-bottom: 12px;
    letter-spacing: 2px;
  `;
  connectedSection.appendChild(connectedTitle);

  const connectedList = document.createElement('div');
  connectedList.className = 'connected-list';
  connectedList.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    min-height: 40px;
  `;
  connectedSection.appendChild(connectedList);

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '清空连接';
  clearBtn.style.cssText = `
    width: 100%;
    margin-top: 12px;
    padding: 8px 16px;
    background: rgba(255, 100, 100, 0.2);
    border: 1px solid rgba(255, 100, 100, 0.4);
    color: rgba(255, 150, 150, 0.9);
    border-radius: 6px;
    cursor: pointer;
    font-family: inherit;
    font-size: 12px;
    transition: all 0.3s ease;
    letter-spacing: 2px;
  `;
  clearBtn.addEventListener('mouseenter', () => {
    clearBtn.style.background = 'rgba(255, 100, 100, 0.35)';
    clearBtn.style.borderColor = 'rgba(255, 100, 100, 0.6)';
  });
  clearBtn.addEventListener('mouseleave', () => {
    clearBtn.style.background = 'rgba(255, 100, 100, 0.2)';
    clearBtn.style.borderColor = 'rgba(255, 100, 100, 0.4)';
  });
  clearBtn.addEventListener('click', () => {
    useStore.getState().clearConnections();
    playClickSound();
  });
  connectedSection.appendChild(clearBtn);

  panel.appendChild(connectedSection);

  let prevConnected = useStore.getState().connectedConstellations;
  useStore.subscribe((state) => {
    if (state.connectedConstellations !== prevConnected) {
      prevConnected = state.connectedConstellations;
      updateConnectedList(connectedList, state.connectedConstellations);
    }
  });

  updateConnectedList(connectedList, useStore.getState().connectedConstellations);

  container.appendChild(panel);

  return panel;
}

function createConstellationItem(constellation: Constellation): HTMLElement {
  const item = document.createElement('div');
  item.className = 'constellation-item';
  item.draggable = true;
  item.dataset.id = constellation.id;

  const isConnected = useStore.getState().connectedConstellations.includes(constellation.id);

  item.style.cssText = `
    padding: 12px 8px;
    background: rgba(224, 240, 255, 0.05);
    border: 1px solid ${isConnected ? '#FFBF00' : 'rgba(224, 240, 255, 0.2)'};
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    ${isConnected ? 'box-shadow: 0 0 15px rgba(255, 191, 0, 0.3);' : ''}
  `;

  const icon = createConstellationIcon(constellation, isConnected);
  item.appendChild(icon);

  const name = document.createElement('span');
  name.textContent = constellation.chineseName;
  name.style.cssText = `
    font-size: 12px;
    color: ${isConnected ? '#FFBF00' : '#E0F0FF'};
    transition: color 0.3s ease;
    letter-spacing: 1px;
  `;
  item.appendChild(name);

  item.addEventListener('mouseenter', () => {
    item.style.background = 'rgba(224, 240, 255, 0.12)';
    item.style.transform = 'translateY(-2px)';
  });

  item.addEventListener('mouseleave', () => {
    item.style.background = 'rgba(224, 240, 255, 0.05)';
    item.style.transform = 'translateY(0)';
  });

  item.addEventListener('click', () => {
    const { connectConstellation, connectedConstellations, disconnectConstellation } = useStore.getState();
    if (connectedConstellations.includes(constellation.id)) {
      disconnectConstellation(constellation.id);
    } else {
      connectConstellation(constellation.id);
    }
    playClickSound();
  });

  item.addEventListener('dragstart', (e) => {
    if (e.dataTransfer) {
      e.dataTransfer.setData('constellation-id', constellation.id);
      e.dataTransfer.effectAllowed = 'copy';
    }
    item.style.opacity = '0.5';
  });

  item.addEventListener('dragend', () => {
    item.style.opacity = '1';
  });

  let prevConnected = useStore.getState().connectedConstellations;
  useStore.subscribe((state) => {
    if (state.connectedConstellations === prevConnected) return;
    prevConnected = state.connectedConstellations;
    const connected = state.connectedConstellations.includes(constellation.id);
    item.style.borderColor = connected ? '#FFBF00' : 'rgba(224, 240, 255, 0.2)';
    name.style.color = connected ? '#FFBF00' : '#E0F0FF';
    if (connected) {
      item.style.boxShadow = '0 0 15px rgba(255, 191, 0, 0.3)';
    } else {
      item.style.boxShadow = 'none';
    }
    updateIconColor(icon, connected);
  });

  return item;
}

function createConstellationIcon(constellation: Constellation, isConnected: boolean): SVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '50');
  svg.setAttribute('height', '40');
  svg.setAttribute('viewBox', '0 0 50 40');

  const color = isConnected ? '#FFBF00' : '#E0F0FF';

  const stars = constellation.stars;
  if (stars.length > 1) {
    const minX = Math.min(...stars.map((s) => s.position.x));
    const maxX = Math.max(...stars.map((s) => s.position.x));
    const minY = Math.min(...stars.map((s) => s.position.y));
    const maxY = Math.max(...stars.map((s) => s.position.y));

    const rangeX = maxX - minX || 1;
    const rangeY = maxY - minY || 1;
    const scale = Math.min(40 / rangeX, 30 / rangeY);
    const offsetX = 25 - ((minX + maxX) / 2) * scale;
    const offsetY = 20 - ((minY + maxY) / 2) * scale;

    for (let i = 0; i < stars.length - 1; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', String(stars[i].position.x * scale + offsetX));
      line.setAttribute('y1', String(20 - stars[i].position.y * scale + offsetY));
      line.setAttribute('x2', String(stars[i + 1].position.x * scale + offsetX));
      line.setAttribute('y2', String(20 - stars[i + 1].position.y * scale + offsetY));
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('opacity', '0.6');
      line.classList.add('icon-line');
      svg.appendChild(line);
    }

    stars.forEach((star) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', String(star.position.x * scale + offsetX));
      circle.setAttribute('cy', String(20 - star.position.y * scale + offsetY));
      circle.setAttribute('r', String(1.5 + star.magnitude * 0.3));
      circle.setAttribute('fill', color);
      circle.classList.add('icon-star');
      svg.appendChild(circle);
    });
  }

  return svg;
}

function updateIconColor(svg: SVGElement, isConnected: boolean): void {
  const color = isConnected ? '#FFBF00' : '#E0F0FF';

  const lines = svg.querySelectorAll('.icon-line');
  lines.forEach((line) => {
    line.setAttribute('stroke', color);
  });

  const stars = svg.querySelectorAll('.icon-star');
  stars.forEach((star) => {
    star.setAttribute('fill', color);
  });
}

function updateConnectedList(container: HTMLElement, ids: string[]): void {
  container.innerHTML = '';

  if (ids.length === 0) {
    const empty = document.createElement('span');
    empty.textContent = '暂无连接';
    empty.style.cssText = `
      color: rgba(224, 240, 255, 0.4);
      font-size: 12px;
    `;
    container.appendChild(empty);
    return;
  }

  ids.forEach((id, index) => {
    const constellation = CONSTELLATIONS.find((c) => c.id === id);
    if (!constellation) return;

    const tag = document.createElement('div');
    tag.style.cssText = `
      padding: 4px 10px;
      background: rgba(255, 191, 0, 0.15);
      border: 1px solid rgba(255, 191, 0, 0.4);
      border-radius: 4px;
      font-size: 11px;
      color: #FFBF00;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    `;

    const num = document.createElement('span');
    num.textContent = String(index + 1);
    num.style.cssText = `
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(255, 191, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
    `;
    tag.appendChild(num);

    const name = document.createElement('span');
    name.textContent = constellation.chineseName;
    tag.appendChild(name);

    tag.addEventListener('mouseenter', () => {
      tag.style.background = 'rgba(255, 100, 100, 0.2)';
      tag.style.borderColor = 'rgba(255, 100, 100, 0.5)';
      tag.style.color = '#ff9999';
    });

    tag.addEventListener('mouseleave', () => {
      tag.style.background = 'rgba(255, 191, 0, 0.15)';
      tag.style.borderColor = 'rgba(255, 191, 0, 0.4)';
      tag.style.color = '#FFBF00';
    });

    tag.addEventListener('click', () => {
      useStore.getState().disconnectConstellation(id);
      playClickSound();
    });

    container.appendChild(tag);
  });
}
