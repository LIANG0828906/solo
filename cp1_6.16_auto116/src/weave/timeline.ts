import { useStore } from '../store';
import { playClickSound, rotateToView, createTrailPath, startFlyingStar, CONSTELLATIONS } from '../core/main';
import * as THREE from 'three';

export function createTimelinePanel(container: HTMLElement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'ui-panel timeline-panel';
  panel.style.cssText = `
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 280px;
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
  title.textContent = '星轨长卷';
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
  subtitle.textContent = '点击条目回放星轨动画';
  subtitle.style.cssText = `
    color: rgba(224, 240, 255, 0.6);
    font-size: 12px;
    text-align: center;
    margin-bottom: 20px;
    letter-spacing: 1px;
  `;
  panel.appendChild(subtitle);

  const list = document.createElement('div');
  list.className = 'timeline-list';
  list.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;
  panel.appendChild(list);

  let prevTrails = useStore.getState().savedTrails;
  useStore.subscribe((state) => {
    if (state.savedTrails !== prevTrails) {
      prevTrails = state.savedTrails;
      renderTimelineList(list, state.savedTrails);
    }
  });

  renderTimelineList(list, useStore.getState().savedTrails);

  container.appendChild(panel);

  return panel;
}

function renderTimelineList(container: HTMLElement, trails: any[]): void {
  container.innerHTML = '';

  if (trails.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = `
      text-align: center;
      padding: 30px 10px;
      color: rgba(224, 240, 255, 0.4);
      font-size: 13px;
      line-height: 1.8;
    `;
    empty.innerHTML = '暂无星轨<br><span style="font-size: 11px;">编织星轨后将保存于此</span>';
    container.appendChild(empty);
    return;
  }

  trails.forEach((trail) => {
    const item = createTimelineItem(trail);
    container.appendChild(item);
  });
}

function createTimelineItem(trail: any): HTMLElement {
  const item = document.createElement('div');
  item.className = 'timeline-item';
  item.dataset.id = trail.id;

  const isCurrent = useStore.getState().currentTrailId === trail.id;

  item.style.cssText = `
    background: rgba(224, 240, 255, 0.05);
    border: 1px solid ${isCurrent ? 'rgba(255, 191, 0, 0.6)' : 'rgba(224, 240, 255, 0.15)'};
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    ${isCurrent ? 'box-shadow: 0 0 15px rgba(255, 191, 0, 0.2);' : ''}
  `;

  const topRow = document.createElement('div');
  topRow.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  `;

  const thumbnail = document.createElement('canvas');
  thumbnail.width = 80;
  thumbnail.height = 40;
  thumbnail.style.cssText = `
    border-radius: 4px;
    border: 1px solid rgba(212, 175, 55, 0.3);
    flex-shrink: 0;
  `;
  renderThumbnail(thumbnail, trail);
  topRow.appendChild(thumbnail);

  const infoCol = document.createElement('div');
  infoCol.style.cssText = `
    flex: 1;
    min-width: 0;
  `;

  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.value = trail.name;
  nameInput.style.cssText = `
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid transparent;
    color: #E0F0FF;
    font-size: 13px;
    font-family: inherit;
    padding: 2px 0;
    outline: none;
    transition: border-color 0.3s ease;
    letter-spacing: 1px;
  `;
  nameInput.addEventListener('focus', () => {
    nameInput.style.borderBottomColor = 'rgba(212, 175, 55, 0.5)';
  });
  nameInput.addEventListener('blur', () => {
    nameInput.style.borderBottomColor = 'transparent';
    if (nameInput.value.trim() && nameInput.value !== trail.name) {
      useStore.getState().renameTrail(trail.id, nameInput.value.trim());
      playClickSound();
    }
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      nameInput.blur();
    }
  });
  infoCol.appendChild(nameInput);

  const time = document.createElement('div');
  time.textContent = formatDate(trail.createdAt);
  time.style.cssText = `
    font-size: 11px;
    color: rgba(224, 240, 255, 0.5);
    margin-top: 4px;
  `;
  infoCol.appendChild(time);

  topRow.appendChild(infoCol);
  item.appendChild(topRow);

  const constellationsRow = document.createElement('div');
  constellationsRow.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  `;

  trail.constellationIds.forEach((id: string) => {
    const c = CONSTELLATIONS.find((cItem) => cItem.id === id);
    if (c) {
      const tag = document.createElement('span');
      tag.textContent = c.chineseName;
      tag.style.cssText = `
        font-size: 10px;
        padding: 2px 6px;
        background: rgba(255, 191, 0, 0.15);
        color: #FFBF00;
        border-radius: 3px;
      `;
      constellationsRow.appendChild(tag);
    }
  });

  item.appendChild(constellationsRow);

  const actionRow = document.createElement('div');
  actionRow.style.cssText = `
    display: flex;
    gap: 8px;
    margin-top: 10px;
  `;

  const playBtn = document.createElement('button');
  playBtn.textContent = isCurrent ? '回放中...' : '回放';
  playBtn.style.cssText = `
    flex: 1;
    padding: 6px 12px;
    background: rgba(64, 224, 208, 0.15);
    border: 1px solid rgba(64, 224, 208, 0.4);
    color: #40E0D0;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    transition: all 0.3s ease;
    letter-spacing: 2px;
  `;
  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playTrail(trail);
  });
  playBtn.addEventListener('mouseenter', () => {
    playBtn.style.background = 'rgba(64, 224, 208, 0.25)';
  });
  playBtn.addEventListener('mouseleave', () => {
    playBtn.style.background = 'rgba(64, 224, 208, 0.15)';
  });
  actionRow.appendChild(playBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '删除';
  deleteBtn.style.cssText = `
    flex: 1;
    padding: 6px 12px;
    background: rgba(255, 100, 100, 0.15);
    border: 1px solid rgba(255, 100, 100, 0.4);
    color: #ff8888;
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    font-family: inherit;
    transition: all 0.3s ease;
    letter-spacing: 2px;
  `;
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    useStore.getState().removeTrail(trail.id);
    playClickSound();
  });
  deleteBtn.addEventListener('mouseenter', () => {
    deleteBtn.style.background = 'rgba(255, 100, 100, 0.25)';
  });
  deleteBtn.addEventListener('mouseleave', () => {
    deleteBtn.style.background = 'rgba(255, 100, 100, 0.15)';
  });
  actionRow.appendChild(deleteBtn);

  item.appendChild(actionRow);

  item.addEventListener('click', () => {
    playTrail(trail);
  });

  let prevCurrentId = useStore.getState().currentTrailId;
  useStore.subscribe((state) => {
    if (state.currentTrailId === prevCurrentId) return;
    prevCurrentId = state.currentTrailId;
    const active = state.currentTrailId === trail.id;
    item.style.borderColor = active ? 'rgba(255, 191, 0, 0.6)' : 'rgba(224, 240, 255, 0.15)';
    if (active) {
      item.style.boxShadow = '0 0 15px rgba(255, 191, 0, 0.2)';
    } else {
      item.style.boxShadow = 'none';
    }
    playBtn.textContent = active ? '回放中...' : '回放';
  });

  return item;
}

function playTrail(trail: any): void {
  const points: THREE.Vector3[] = [];
  trail.constellationIds.forEach((id: string) => {
    const c = CONSTELLATIONS.find((cItem) => cItem.id === id);
    if (c && c.stars.length > 0) {
      const centerIdx = Math.floor(c.stars.length / 2);
      points.push(c.stars[centerIdx].position.clone());
    }
  });

  if (points.length < 2) return;

  useStore.getState().setCurrentTrailId(trail.id);
  createTrailPath(points, trail.colorStart, trail.colorEnd);
  rotateToView(points);

  setTimeout(() => {
    startFlyingStar();
  }, 1000);

  playClickSound();
}

function renderThumbnail(canvas: HTMLCanvasElement, trail: any): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, 80, 40);

  const points: { x: number; y: number }[] = [];
  trail.constellationIds.forEach((id: string) => {
    const c = CONSTELLATIONS.find((cItem) => cItem.id === id);
    if (c && c.stars.length > 0) {
      const s = c.stars[Math.floor(c.stars.length / 2)];
      points.push({
        x: 40 + s.position.x * 15,
        y: 20 - s.position.y * 15,
      });
    }
  });

  if (points.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 80, 0);
    gradient.addColorStop(0, trail.colorStart);
    gradient.addColorStop(1, trail.colorEnd);

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#E0F0FF';
    ctx.fill();
  });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}-${day} ${hours}:${minutes}`;
}

export function generateThumbnailFromPoints(
  points: THREE.Vector3[],
  colorStart: string,
  colorEnd: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 80;
  canvas.height = 40;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, 80, 40);

  const projected = points.map((p) => ({
    x: 40 + p.x * 15,
    y: 20 - p.y * 15,
  }));

  if (projected.length >= 2) {
    const gradient = ctx.createLinearGradient(0, 0, 80, 0);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);

    ctx.beginPath();
    ctx.moveTo(projected[0].x, projected[0].y);
    for (let i = 1; i < projected.length; i++) {
      ctx.lineTo(projected[i].x, projected[i].y);
    }
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  projected.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#E0F0FF';
    ctx.fill();
  });

  return canvas.toDataURL('image/png');
}
