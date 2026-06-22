import { parseCode, type DependencyNode } from './parser';
import { GraphManager, type LayoutType } from './graph-manager';
import { Renderer } from './renderer';
import { ControlPanel } from './control-panel';

const SAMPLE_CODE = `import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { debounce } from 'lodash-es';
import { join } from 'path';
import { readFileSync } from 'fs';
import utils from './utils';
import config from '../config';
import { authService } from '/services/auth';

export const API_BASE = '/api/v1';

export function fetchUser(id: number) {
  return axios.get(API_BASE + '/users/' + id);
}

export default function App() {
  const [data, setData] = useState(null);
  return React.createElement('div', null, data);
}
`;

let graphManager: GraphManager | null = null;
let renderer: Renderer | null = null;

function showInfoCard(node: DependencyNode, screenX: number, screenY: number): void {
  const card = document.getElementById('info-card') as HTMLElement;
  const content = document.getElementById('info-card-content') as HTMLElement;
  if (!card || !content) return;

  const typeLabel =
    node.type === 'local' ? '本地文件' :
    node.type === 'third-party' ? '第三方包' : '内置模块';
  const typeClass = `type-${node.type}`;

  const typeBadge = `<span class="info-card-type ${typeClass}">${typeLabel}</span>`;
  const refList = node.referencedBy.length
    ? node.referencedBy.map(r => `<div>• ${r}</div>`).join('')
    : '<div style="color:#888">(根节点/无被引用)</div>';
  const expList = node.exports.length
    ? node.exports.map(e => `<div>• ${e}</div>`).join('')
    : '<div style="color:#888">(无 export 信息)</div>';

  content.innerHTML = `
    <div class="info-card-title">${node.id}${typeBadge}</div>
    <div class="info-card-section">
      <div class="info-card-section-title">导入路径</div>
      <div class="info-card-list">${node.label}</div>
    </div>
    <div class="info-card-section">
      <div class="info-card-section-title">被引用（${node.referencedBy.length}）</div>
      <div class="info-card-list">${refList}</div>
    </div>
    <div class="info-card-section">
      <div class="info-card-section-title">导出成员（${node.exports.length}）</div>
      <div class="info-card-list">${expList}</div>
    </div>
  `;

  card.classList.add('show');

  const padding = 20;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const rect = card.getBoundingClientRect();
  let x = screenX + 20;
  let y = screenY + 10;
  if (x + rect.width > vw - padding) x = screenX - rect.width - 20;
  if (y + rect.height > vh - padding) y = vh - rect.height - padding;
  if (y < 70) y = 70;
  card.style.left = `${x}px`;
  card.style.top = `${y}px`;
}

function hideInfoCard(): void {
  const card = document.getElementById('info-card');
  if (card) card.classList.remove('show');
}

function rerender(): void {
  renderer?.render();
}

function handleParse(code: string, filename?: string): void {
  const result = parseCode(code, filename);
  if (result.nodes.length === 0) {
    alert('未解析到任何 import/require 语句');
    return;
  }

  const container = document.getElementById('canvas-container');
  const cw = container?.clientWidth || window.innerWidth;
  const ch = container?.clientHeight || window.innerHeight - 60;

  if (!graphManager) {
    graphManager = new GraphManager(result.nodes, result.edges, {
      onLayoutUpdate: rerender,
      forceStrength: 1.0,
    });
    graphManager.centerX = cw / 2;
    graphManager.centerY = ch / 2;
  } else {
    graphManager.setNodesAndEdges(result.nodes, result.edges);
    graphManager.centerX = cw / 2;
    graphManager.centerY = ch / 2;
  }

  renderer?.setNodesAndEdges(result.nodes, result.edges);

  const layout = (document.getElementById('layout-select') as HTMLSelectElement)?.value as LayoutType;
  if (layout) {
    graphManager.setLayout(layout);
  } else {
    graphManager.setLayout('force');
  }

  rerender();
}

function exportToJSON(): void {
  if (!graphManager) {
    alert('先解析代码才能导出');
    return;
  }
  const data = graphManager.exportJSON();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dependency-graph-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function getCanvasRelativeXY(e: MouseEvent): { x: number; y: number } {
  const canvas = document.getElementById('graph-canvas') as HTMLCanvasElement;
  if (!canvas) return { x: 0, y: 0 };
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function initMain(): void {
  const canvas = document.getElementById('graph-canvas') as HTMLCanvasElement;
  const container = document.getElementById('canvas-container');
  const cw = container?.clientWidth || window.innerWidth;
  const ch = container?.clientHeight || window.innerHeight - 60;

  renderer = new Renderer(canvas, {
    canvasWidth: cw,
    canvasHeight: ch,
    showLabels: true,
  });

  const controlPanel = new ControlPanel({
    onLayoutChange: (layout: LayoutType) => {
      graphManager?.setLayout(layout);
      rerender();
    },
    onLabelToggle: (show: boolean) => {
      renderer?.setShowLabels(show);
      rerender();
    },
    onForceStrengthChange: (strength: number) => {
      graphManager?.setForceStrength(strength);
    },
  });
  controlPanel.init();

  // 导航栏事件
  const uploadBtn = document.getElementById('upload-btn');
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const parseBtn = document.getElementById('parse-btn');
  const codeInput = document.getElementById('code-input') as HTMLInputElement;
  const exportBtn = document.getElementById('export-btn');
  const helpBtn = document.getElementById('help-btn');
  const helpTooltip = document.getElementById('help-tooltip');
  const infoCardClose = document.getElementById('info-card-close');

  uploadBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const code = String(reader.result ?? '');
      codeInput.value = file.name;
      handleParse(code, file.name);
    };
    reader.readAsText(file);
  });

  parseBtn?.addEventListener('click', () => {
    const text = codeInput?.value?.trim() ?? '';
    if (!text) {
      alert('请先粘贴代码或上传文件');
      return;
    }
    if (text.includes('import') || text.includes('require') || text.includes('export')) {
      handleParse(text, codeInput.value || 'pasted-code');
    } else {
      alert('输入内容中未检测到 import / require / export 语句');
    }
  });

  codeInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter') parseBtn?.click();
  });

  exportBtn?.addEventListener('click', exportToJSON);

  helpBtn?.addEventListener('click', (e: Event) => {
    e.stopPropagation();
    helpTooltip?.classList.toggle('show');
  });

  document.addEventListener('click', (e: Event) => {
    if (!helpBtn?.contains(e.target as Node) && !helpTooltip?.contains(e.target as Node)) {
      helpTooltip?.classList.remove('show');
    }
  });

  infoCardClose?.addEventListener('click', hideInfoCard);

  // Canvas 交互
  let canvasMouseDown = false;
  let justDragged = false;
  let hasMoved = false;

  canvas.addEventListener('mousedown', (e: MouseEvent) => {
    canvasMouseDown = true;
    justDragged = false;
    hasMoved = false;
    const { x, y } = getCanvasRelativeXY(e);
    const node = renderer?.getNodeAtPosition(x, y);
    if (node && renderer) {
      renderer.startDrag(node, x, y);
    }
  });

  canvas.addEventListener('mousemove', (e: MouseEvent) => {
    const { x, y } = getCanvasRelativeXY(e);

    if (renderer?.isDragging) {
      renderer.updateDrag(x, y);
      hasMoved = true;
      justDragged = true;
      rerender();
    } else if (canvasMouseDown) {
      renderer?.pan(e.movementX, e.movementY);
      hasMoved = true;
      rerender();
    } else {
      const hit = renderer?.getNodeAtPosition(x, y);
      if (renderer) {
        const prevHover = renderer.hoveredNode;
        renderer.hoveredNode = hit ?? null;
        if ((prevHover?.id) !== (renderer.hoveredNode?.id)) rerender();
      }
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  });

  canvas.addEventListener('mouseup', (e: MouseEvent) => {
    const wasDragging = renderer?.isDragging;
    renderer?.endDrag();
    canvasMouseDown = false;

    if (!hasMoved && !wasDragging) {
      const { x, y } = getCanvasRelativeXY(e);
      const hit = renderer?.getNodeAtPosition(x, y);
      if (hit) {
        renderer?.selectNode(hit);
        showInfoCard(hit, e.clientX, e.clientY);
      } else {
        renderer?.selectNode(null);
        hideInfoCard();
      }
      rerender();
    }
    justDragged = false;
  });

  canvas.addEventListener('mouseleave', () => {
    canvasMouseDown = false;
    renderer?.endDrag();
    if (renderer) {
      renderer.hoveredNode = null;
      rerender();
    }
  });

  canvas.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    const { x, y } = getCanvasRelativeXY(e);
    renderer?.zoom(e.deltaY, x, y);
    rerender();
  }, { passive: false });

  window.addEventListener('resize', () => {
    if (!graphManager) return;
    const cw = container?.clientWidth || window.innerWidth;
    const ch = container?.clientHeight || window.innerHeight - 60;
    graphManager.centerX = cw / 2;
    graphManager.centerY = ch / 2;
  });

  // 初始示例数据
  handleParse(SAMPLE_CODE, 'sample.ts');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMain);
} else {
  initMain();
}
