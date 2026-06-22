import { UnderwaterScene } from './scene';
import { ShipwreckManager, ArtifactData } from './shipwreck';
import { ArtifactManager, ProgressItem } from './artifact';

async function bootstrap() {
  const container = document.getElementById('app') as HTMLElement;
  if (!container) {
    console.error('#app 容器未找到');
    return;
  }

  const loading = document.createElement('div');
  loading.style.cssText = `
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: linear-gradient(180deg, #0b1a3a 0%, #1a3d6b 100%);
    z-index: 100;
    color: #8ac4ff;
    font-family: inherit;
    transition: opacity 0.6s;
  `;
  loading.innerHTML = `
    <div style="font-size:28px; font-weight:700; margin-bottom:16px; letter-spacing:3px; text-shadow:0 0 20px rgba(138,196,255,0.5);">
      🌊 水下考古探索 🌊
    </div>
    <div style="width:260px; height:6px; background:rgba(138,196,255,0.15); border-radius:4px; overflow:hidden; border:1px solid rgba(138,196,255,0.25);">
      <div id="loading-bar" style="height:100%; width:0%; background:linear-gradient(90deg,#3a7ecf,#8ac4ff); transition:width 0.3s; box-shadow:0 0 10px rgba(138,196,255,0.6);"></div>
    </div>
    <div style="margin-top:14px; font-size:13px; color:#6a8ab0;">正在加载深海遗迹...</div>
  `;
  container.appendChild(loading);
  const loadingBar = loading.querySelector('#loading-bar') as HTMLDivElement;

  const setProgress = (p: number) => {
    if (loadingBar) loadingBar.style.width = `${Math.min(100, p)}%`;
  };
  setProgress(10);

  const underwaterScene = new UnderwaterScene(container);
  setProgress(35);

  const wreckManager = new ShipwreckManager(underwaterScene.scene);
  setProgress(60);

  const artifactManager = new ArtifactManager(container, underwaterScene, wreckManager);
  setProgress(75);

  const hints = document.createElement('div');
  hints.style.cssText = `
    position: absolute;
    right: 18px;
    bottom: 18px;
    background: rgba(11,26,58,0.72);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(138,196,255,0.22);
    border-radius: 14px;
    padding: 14px 16px;
    z-index: 20;
    max-width: 280px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    color: #a8c8e8;
    font-size: 12px;
    line-height: 1.8;
  `;
  hints.innerHTML = `
    <div style="color:#8ac4ff; font-weight:600; margin-bottom:8px; font-size:13px;">🎮 操作指南</div>
    <div>• <b style="color:#cfe4ff;">鼠标拖拽</b> - 旋转视角</div>
    <div>• <b style="color:#cfe4ff;">滚轮</b> - 拉近/拉远</div>
    <div>• <b style="color:#cfe4ff;">点击发光碎片</b> - 采集文物</div>
    <div>• <b style="color:#cfe4ff;">集齐同类型</b> - 自动拼合复原</div>
  `;
  container.appendChild(hints);

  try {
    setProgress(85);
    const [artifactsRes, progressRes] = await Promise.all([
      fetch('/api/artifacts').then((r) => r.json()),
      fetch('/api/progress').then((r) => r.json()),
    ]);

    const artifacts: ArtifactData[] = artifactsRes.artifacts || [];
    const progress: ProgressItem[] = progressRes.progress || [];

    wreckManager.createArtifacts(artifacts);
    artifactManager.setProgress(progress);

    const collectedMap = new Map<string, ArtifactData[]>();
    artifacts
      .filter((a) => a.collected)
      .forEach((a) => {
        if (!collectedMap.has(a.type)) collectedMap.set(a.type, []);
        collectedMap.get(a.type)!.push(a);
      });
    (artifactManager as unknown as {
      collected: unknown[];
    }).collected = artifacts
      .filter((a) => a.collected)
      .map((a) => ({
        id: a.id,
        type: a.type,
        pieceIndex: a.pieceIndex,
        totalPieces: a.totalPieces,
        name: a.name,
      }));
    (artifactManager as unknown as {
      updateInventoryUI: () => void;
    }).updateInventoryUI();

    setProgress(100);
  } catch (err) {
    console.warn('加载数据失败，使用空数据启动:', err);
    setProgress(100);
  }

  setTimeout(() => {
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 700);
  }, 450);

  let lastTime = performance.now();
  const animate = () => {
    requestAnimationFrame(animate);
    const now = performance.now();
    lastTime = now;
    underwaterScene.update();
    wreckManager.update();
    artifactManager.update();
    void now;
  };
  animate();
  void lastTime;
}

bootstrap().catch((err) => {
  console.error('启动失败:', err);
});
