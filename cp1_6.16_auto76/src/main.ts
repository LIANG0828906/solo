import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { createStarField } from './starField';
import { ConstellationManager } from './constellation';
import type { MatchedConstellation } from './types';

function init(): void {
  const container = document.getElementById('canvas-container');
  if (!container) return;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 12);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  document.getElementById('label-container')?.appendChild(labelRenderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 4;
  controls.maxDistance = 40;
  controls.enablePan = true;

  const { points: starField, update: updateStarField } = createStarField();
  scene.add(starField);

  const showDetailPanel = (c: MatchedConstellation): void => {
    const panel = document.getElementById('detailPanel');
    const content = document.getElementById('detailContent');
    if (!panel || !content) return;

    const tpl = c.template;
    let starRows = '';
    tpl.stars.forEach((s, i) => {
      starRows += `
        <tr>
          <td>${i + 1}</td>
          <td>${s.name}<br><span style="opacity:0.5;font-size:11px">${s.nameEn}</span></td>
          <td>${s.magnitude?.toFixed(2) ?? '-'}</td>
          <td>${s.distance ?? '-'}</td>
          <td>${s.spectralType ?? '-'}</td>
        </tr>
      `;
    });

    content.innerHTML = `
      <h2>${tpl.name}</h2>
      <div class="subtitle">${tpl.nameEn}</div>
      
      <div class="info-section">
        <div class="section-title">观测信息</div>
        <div class="info-row">
          <span class="label">最佳观测月份</span>
          <span>${tpl.bestMonth}</span>
        </div>
        <div class="info-row">
          <span class="label">可见纬度范围</span>
          <span>${tpl.latitudeRange}</span>
        </div>
        <div class="info-row">
          <span class="label">主要恒星</span>
          <span>${tpl.stars.length} 颗</span>
        </div>
      </div>

      <div class="info-section">
        <div class="section-title">神话故事</div>
        <div class="mythology-text">${tpl.mythology}</div>
      </div>

      <div class="info-section">
        <div class="section-title">恒星数据</div>
        <table class="star-table">
          <thead>
            <tr>
              <th>#</th>
              <th>名称</th>
              <th>视星等</th>
              <th>距离(光年)</th>
              <th>光谱型</th>
            </tr>
          </thead>
          <tbody>
            ${starRows}
          </tbody>
        </table>
      </div>
    `;

    panel.classList.add('active');
  };

  const constellationMgr = new ConstellationManager(
    scene,
    camera,
    labelRenderer,
    showDetailPanel
  );

  const closeBtn = document.getElementById('closePanel');
  closeBtn?.addEventListener('click', () => {
    document.getElementById('detailPanel')?.classList.remove('active');
  });

  const listToggle = document.getElementById('listToggle');
  const constellationList = document.getElementById('constellationList');
  listToggle?.addEventListener('click', () => {
    constellationList?.classList.toggle('active');
  });

  const templates = constellationMgr.getAllTemplates();
  const listContainer = document.getElementById('constellationList');
  if (listContainer) {
    templates.forEach((tpl) => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `
        <div class="color-dot" style="background:${tpl.color};box-shadow:0 0 8px ${tpl.color}"></div>
        <div class="item-name">${tpl.name} · ${tpl.nameEn}</div>
      `;
      item.addEventListener('click', () => {
        constellationMgr.highlightConstellation(tpl.id);
        listContainer.classList.remove('active');
      });
      listContainer.appendChild(item);
    });
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  const animate = (): void => {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();

    updateStarField(time);
    constellationMgr.update(time);
    controls.update();

    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  };

  animate();
}

init();
