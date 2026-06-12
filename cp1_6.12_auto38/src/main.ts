import { MoleculeRenderer } from './renderer';
import { MoleculeParser, MoleculeData, PRESET_MOLECULES } from './moleculeParser';
import { UIControls } from './controls';

let renderer: MoleculeRenderer;
let parser: MoleculeParser;
let controls: UIControls;
let currentMoleculeData: MoleculeData | null = null;

async function fetchMolecules(): Promise<{ [key: string]: MoleculeData }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 500);
    
    const response = await fetch('/api/molecules', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('从后端获取分子数据成功');
      return data;
    }
  } catch (error) {
    console.warn('无法从后端获取数据，使用本地预设数据:', error);
  }
  
  return PRESET_MOLECULES;
}

function handleMoleculeLoad(data: MoleculeData): void {
  currentMoleculeData = data;
  const { group, atomMap } = parser.parse(data);
  
  const atomDataArray = Array.from(atomMap.values());
  
  renderer.setMoleculeGroup(group, atomMap);
}

function handleAtomClick(atomData: any, event: MouseEvent): void {
  if (currentMoleculeData) {
    controls.showAtomInfo(atomData, event, currentMoleculeData.atoms);
  }
}

function animate(): void {
  requestAnimationFrame(animate);
  renderer.render();
}

async function init(): Promise<void> {
  try {
    renderer = new MoleculeRenderer('canvas-container');
    parser = new MoleculeParser();
    
    controls = new UIControls({
      renderer,
      parser,
      onMoleculeLoad: handleMoleculeLoad
    });

    renderer.setOnAtomClick(handleAtomClick);

    const molecules = await fetchMolecules();
    
    Object.assign(PRESET_MOLECULES, molecules);

    controls.showLoading();
    
    setTimeout(() => {
      const defaultData = parser.getPresetMolecule('water');
      handleMoleculeLoad(defaultData);
      controls.hideLoading();
    }, 800);

    animate();

    window.addEventListener('beforeunload', () => {
      renderer.dispose();
      parser.dispose();
      controls.dispose();
    });

  } catch (error) {
    console.error('初始化失败:', error);
    const loadingOverlay = document.getElementById('loading');
    if (loadingOverlay) {
      loadingOverlay.innerHTML = '<div style="color: #ff6666; font-size: 16px;">初始化失败，请刷新页面重试</div>';
    }
  }
}

init();
