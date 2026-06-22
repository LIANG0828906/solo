<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive, nextTick, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { useMaterialStore, type Material } from './MaterialManager';
import { chartEngine, THEME_PALETTES, type ChartType, type ThemeKey, type ChartConfig } from './ChartEngine';
import { eventBus, EVENTS } from './eventBus';

interface ChartBlock {
  id: string;
  materialId: string;
  config: ChartConfig;
  x: number;
  y: number;
  zIndex: number;
  scale: number;
  zoomed: boolean;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  pathD: string;
}

type ViewMode = 'edit' | 'story';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

const materialStore = useMaterialStore();
const deviceType = ref<DeviceType>('desktop');
const viewMode = ref<ViewMode>('edit');
const leftPanelOpen = ref(true);
const rightPanelOpen = ref(true);
const mobilePanel = ref<'none' | 'material' | 'property'>('none');
const canvasHighlight = ref(false);
const editingChartId = ref<string | null>(null);
const propertyModalVisible = ref(false);
const maxZIndex = ref(10);
const chartBlocks = reactive<Map<string, ChartBlock>>(new Map());
const connections = reactive<Map<string, Connection>>(new Map());
const connectionFrom = ref<string | null>(null);

const dragState = reactive({
  isDragging: false,
  chartId: null as string | null,
  startX: 0,
  startY: 0,
  originX: 0,
  originY: 0
});

const editingConfig = reactive<ChartConfig>({
  chartType: 'bubble',
  theme: 'deepBlue',
  title: '',
  titleFontSize: 18,
  labelFontSize: 12,
  width: 420,
  height: 340
});

const materials = computed(() => materialStore.getAllMaterials);
const editingChartBlock = computed(() => (editingChartId.value ? chartBlocks.get(editingChartId.value) : null));
const sortedChartBlocks = computed(() => {
  return Array.from(chartBlocks.values()).sort((a, b) => a.zIndex - b.zIndex);
});

const themeKeys = Object.keys(THEME_PALETTES) as ThemeKey[];

const checkDeviceType = () => {
  const w = window.innerWidth;
  if (w >= 1280) deviceType.value = 'desktop';
  else if (w >= 768) deviceType.value = 'tablet';
  else deviceType.value = 'mobile';

  if (deviceType.value === 'desktop') {
    leftPanelOpen.value = true;
    rightPanelOpen.value = true;
    mobilePanel.value = 'none';
  } else if (deviceType.value === 'tablet') {
    leftPanelOpen.value = false;
    rightPanelOpen.value = false;
    mobilePanel.value = 'none';
  } else {
    mobilePanel.value = 'none';
  }
};

const onMaterialDragStart = (e: DragEvent, material: Material) => {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/json', JSON.stringify({ materialId: material.id }));
    e.dataTransfer.effectAllowed = 'copy';
  }
  eventBus.emit(EVENTS.MATERIAL_DRAG_START, material);
};

const onMaterialDragEnd = () => {
  eventBus.emit(EVENTS.MATERIAL_DRAG_END);
};

const onCanvasDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
  if (!canvasHighlight.value) {
    canvasHighlight.value = true;
    setTimeout(() => { canvasHighlight.value = false; }, 300);
  }
};

const suggestChartType = (material: Material): ChartType => {
  if (material.dataType === 'categorical') {
    return material.data.length >= 4 ? 'radar' : 'bubble';
  }
  const hasXY = material.data.some((d) => d.x !== undefined && d.y !== undefined);
  return hasXY ? 'bubble' : 'sankey';
};

const getRandomTheme = (): ThemeKey => {
  return themeKeys[Math.floor(Math.random() * themeKeys.length)];
};

const onCanvasDrop = (e: DragEvent) => {
  e.preventDefault();
  canvasHighlight.value = false;

  const data = e.dataTransfer?.getData('application/json');
  if (!data) return;

  try {
    const { materialId } = JSON.parse(data);
    const material = materialStore.getMaterialById(materialId);
    if (!material) return;

    const canvas = canvasRef.value;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - 210;
    const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - 170;

    const chartId = uuidv4();
    const config: ChartConfig = {
      chartType: suggestChartType(material),
      theme: getRandomTheme(),
      title: material.name,
      titleFontSize: 18,
      labelFontSize: 12,
      width: 420,
      height: 340
    };

    const block: ChartBlock = {
      id: chartId,
      materialId,
      config,
      x: Math.max(20, x),
      y: Math.max(20, y),
      zIndex: ++maxZIndex.value,
      scale: 1,
      zoomed: false
    };

    chartBlocks.set(chartId, block);
    eventBus.emit(EVENTS.CHART_DATA_BLOCK_ADDED, block);

    nextTick(() => {
      eventBus.emit(EVENTS.RENDER_CHART, { chartId, material, config });
    });
  } catch (err) {
    console.error('Drop error:', err);
  }
};

eventBus.on(EVENTS.CHART_RENDERED, (rendered: any) => {
  nextTick(() => {
    const container = document.getElementById(`chart-wrapper-${rendered.chartId}`);
    if (container && rendered.container) {
      container.innerHTML = '';
      container.appendChild(rendered.container);
    }
  });
});

const onChartDoubleClick = (_e: Event, block: ChartBlock) => {
  editingChartId.value = block.id;
  Object.assign(editingConfig, block.config);
  propertyModalVisible.value = true;
  eventBus.emit(EVENTS.CHART_DOUBLE_CLICKED, block);
};

const onChartClick = (e: MouseEvent, block: ChartBlock) => {
  e.stopPropagation();
  if (viewMode.value !== 'story') return;
  block.zoomed = !block.zoomed;
  block.scale = block.zoomed ? 1.5 : 1;
  block.zIndex = block.zoomed ? 9999 : ++maxZIndex.value;
  eventBus.emit(EVENTS.CHART_CLICKED, block);
};

const onChartMouseDown = (e: MouseEvent, block: ChartBlock) => {
  if (e.button !== 0) return;
  if (viewMode.value === 'edit') return;
  e.stopPropagation();
  e.preventDefault();

  if (connectionFrom.value && connectionFrom.value !== block.id) {
    createConnection(connectionFrom.value, block.id);
    connectionFrom.value = null;
    return;
  }

  dragState.isDragging = true;
  dragState.chartId = block.id;
  dragState.startX = e.clientX;
  dragState.startY = e.clientY;
  dragState.originX = block.x;
  dragState.originY = block.y;
  block.zIndex = ++maxZIndex.value;

  let lastTime = performance.now();
  let frameId: number;

  const onMouseMove = (moveE: MouseEvent) => {
    const now = performance.now();
    if (now - lastTime < 16) return;
    lastTime = now;

    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => {
      if (dragState.chartId && chartBlocks.has(dragState.chartId)) {
        const b = chartBlocks.get(dragState.chartId)!;
        b.x = dragState.originX + (moveE.clientX - dragState.startX);
        b.y = dragState.originY + (moveE.clientY - dragState.startY);
        updateConnections();
      }
    });
  };

  const onMouseUp = () => {
    cancelAnimationFrame(frameId);
    dragState.isDragging = false;
    dragState.chartId = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

const savePropertyChanges = () => {
  if (!editingChartId.value) return;
  const block = chartBlocks.get(editingChartId.value);
  if (!block) return;

  Object.assign(block.config, editingConfig);
  const material = materialStore.getMaterialById(block.materialId);
  if (material) {
    chartEngine.updateChart(block.id, material, block.config);
  }

  propertyModalVisible.value = false;
  editingChartId.value = null;
  eventBus.emit(EVENTS.CHART_CONFIG_UPDATE, block);
};

const closePropertyModal = () => {
  propertyModalVisible.value = false;
  editingChartId.value = null;
};

const startConnection = (blockId: string) => {
  connectionFrom.value = blockId;
};

const cancelConnection = () => {
  connectionFrom.value = null;
};

const createConnection = (fromId: string, toId: string) => {
  const id = `${fromId}-${toId}`;
  if (connections.has(id)) return;
  connections.set(id, { id, from: fromId, to: toId, pathD: '' });
  eventBus.emit(EVENTS.CONNECTION_CREATE, { from: fromId, to: toId });
  updateConnections();
};

const removeConnection = (id: string) => {
  connections.delete(id);
  eventBus.emit(EVENTS.CONNECTION_REMOVE, id);
};

const updateConnections = () => {
  connections.forEach((conn) => {
    const fromBlock = chartBlocks.get(conn.from);
    const toBlock = chartBlocks.get(conn.to);
    if (!fromBlock || !toBlock) return;
    const x1 = fromBlock.x + fromBlock.config.width / 2;
    const y1 = fromBlock.y + fromBlock.config.height / 2;
    const x2 = toBlock.x + toBlock.config.width / 2;
    const y2 = toBlock.y + toBlock.config.height / 2;
    const dx = Math.abs(x2 - x1);
    const controlOffset = Math.max(50, dx * 0.5);
    conn.pathD = `M ${x1} ${y1} C ${x1 + controlOffset} ${y1}, ${x2 - controlOffset} ${y2}, ${x2} ${y2}`;
  });
};

const deleteChart = (blockId: string) => {
  chartBlocks.delete(blockId);
  chartEngine.removeChart(blockId);
  const toRemove: string[] = [];
  connections.forEach((conn) => {
    if (conn.from === blockId || conn.to === blockId) toRemove.push(conn.id);
  });
  toRemove.forEach((id) => connections.delete(id));
  eventBus.emit(EVENTS.CHART_DELETE, blockId);
};

const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'edit' ? 'story' : 'edit';
  chartBlocks.forEach((b) => {
    b.zoomed = false;
    b.scale = 1;
  });
  eventBus.emit(EVENTS.STORY_VIEW_TOGGLE, viewMode.value);
};

const toggleLeftPanel = () => {
  if (deviceType.value === 'mobile') {
    mobilePanel.value = mobilePanel.value === 'material' ? 'none' : 'material';
  } else {
    leftPanelOpen.value = !leftPanelOpen.value;
  }
  eventBus.emit(EVENTS.PANEL_TOGGLE, { side: 'left', open: leftPanelOpen.value });
};

const toggleRightPanel = () => {
  if (deviceType.value === 'mobile') {
    mobilePanel.value = mobilePanel.value === 'property' ? 'none' : 'property';
  } else {
    rightPanelOpen.value = !rightPanelOpen.value;
  }
  eventBus.emit(EVENTS.PANEL_TOGGLE, { side: 'right', open: rightPanelOpen.value });
};

const closeMobilePanel = () => {
  mobilePanel.value = 'none';
};

const getThemeColor = (key: ThemeKey) => THEME_PALETTES[key].primary;
const getThemeName = (key: ThemeKey) => THEME_PALETTES[key].name;
const canvasRef = ref<HTMLElement | null>(null);

watch(
  () => Array.from(chartBlocks.keys()).length,
  () => {
    nextTick(() => updateConnections());
  }
);

onMounted(() => {
  checkDeviceType();
  window.addEventListener('resize', checkDeviceType);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkDeviceType);
});
</script>

<template>
  <div class="app-layout" :class="`device-${deviceType}`">
    <header class="app-header">
      <div class="header-left">
        <button class="icon-btn" :class="{ active: mobilePanel === 'material' || (deviceType !== 'mobile' && leftPanelOpen) }" @click="toggleLeftPanel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div class="app-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" stroke-width="2" style="flex-shrink: 0">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 3v18" />
          </svg>
          <span>Infographic Studio</span>
        </div>
      </div>

      <div class="view-toggle">
        <button :class="['toggle-btn', { active: viewMode === 'edit' }]" @click="viewMode = 'edit'">编辑模式</button>
        <button :class="['toggle-btn', { active: viewMode === 'story' }]" @click="toggleViewMode">故事视图</button>
      </div>

      <div class="header-right">
        <div class="chart-count">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
          <span>{{ chartBlocks.size }} 个图表</span>
        </div>
        <button class="icon-btn" :class="{ active: mobilePanel === 'property' || (deviceType !== 'mobile' && rightPanelOpen) }" @click="toggleRightPanel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </header>

    <div class="app-body">
      <aside class="panel left-panel" :class="{ open: deviceType === 'mobile' ? mobilePanel === 'material' : leftPanelOpen, drawer: deviceType === 'tablet', mobile: deviceType === 'mobile' }">
        <div class="panel-header">
          <h3 class="panel-title">素材库</h3>
          <button v-if="deviceType !== 'desktop'" class="icon-btn close-btn" @click="toggleLeftPanel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="panel-content material-list">
          <div v-for="mat in materials" :key="mat.id" class="material-card" :draggable="true" @dragstart="(e: DragEvent) => onMaterialDragStart(e, mat)" @dragend="onMaterialDragEnd">
            <div class="material-card-header">
              <span class="material-badge" :class="mat.dataType">{{ mat.dataType === 'numeric' ? '数值' : '分类' }}</span>
              <span class="material-count">{{ mat.data.length }} 项</span>
            </div>
            <h4 class="material-name">{{ mat.name }}</h4>
            <p class="material-desc">{{ mat.description }}</p>
            <div class="material-preview">
              <div v-for="(d, i) in mat.data.slice(0, 3)" :key="i" class="preview-bar">
                <span class="preview-label">{{ d.label }}</span>
                <div class="preview-bar-bg">
                  <div class="preview-bar-fill" :style="{ width: `${(d.value / (mat.data.reduce((m, p) => Math.max(m, p.value), 0) || 1)) * 100}%`, background: `linear-gradient(90deg, #DBEAFE, #4A90D9)` }"></div>
                </div>
              </div>
            </div>
            <div class="drag-hint">拖拽到画布</div>
          </div>
        </div>
      </aside>

      <main class="main-area">
        <div ref="canvasRef" class="canvas" :class="{ 'drag-highlight': canvasHighlight }" @dragover="onCanvasDragOver" @drop="onCanvasDrop" @click="cancelConnection">
          <svg v-if="viewMode === 'story'" class="connections-layer">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#868E96" />
              </marker>
            </defs>
            <path v-for="conn in Array.from(connections.values())" :key="conn.id" :d="conn.pathD" class="connection-path" fill="none" stroke="#868E96" stroke-width="2" marker-end="url(#arrowhead)" @click.stop="() => removeConnection(conn.id)" />
          </svg>

          <div v-if="chartBlocks.size === 0" class="canvas-empty">
            <h3 class="empty-title">{{ viewMode === 'story' ? '故事页面视图' : '拖拽左侧素材到这里' }}</h3>
            <p class="empty-desc">{{ viewMode === 'story' ? '自由拖拽排列，点击图表放大，连线表示关联' : '从素材库选择数据创建图表' }}</p>
          </div>

          <div v-for="block in sortedChartBlocks" :key="block.id" class="chart-wrapper-block" :class="{ 'edit-mode': viewMode === 'edit', 'story-mode': viewMode === 'story', zoomed: block.zoomed, 'connection-source': connectionFrom === block.id }" :style="{ left: `${block.x}px`, top: `${block.y}px`, width: `${block.config.width}px`, zIndex: block.zIndex, transform: `scale(${block.scale})`, transformOrigin: 'center center' }" @dblclick="(e) => onChartDoubleClick(e, block)" @click.stop="(e) => onChartClick(e, block)" @mousedown="(e) => onChartMouseDown(e, block)">
            <div v-if="viewMode === 'edit'" class="chart-wrapper-header">
              <span class="chart-type-tag">{{ block.config.chartType === 'bubble' ? '气泡图' : block.config.chartType === 'sankey' ? '桑基图' : '雷达图' }}</span>
              <button class="chart-action-btn" @click.stop="() => deleteChart(block.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            <div v-if="viewMode === 'story'" class="chart-actions-bar">
              <button class="chart-action-btn" :class="{ active: connectionFrom === block.id }" @click.stop="() => startConnection(block.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </button>
              <button class="chart-action-btn" @click.stop="() => deleteChart(block.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
            <div :id="`chart-wrapper-${block.id}`" class="chart-inner-wrapper"></div>
          </div>

          <div v-if="connectionFrom" class="connection-hint">点击另一个图表创建连接，点击空白取消</div>
        </div>
      </main>

      <aside class="panel right-panel" :class="{ open: deviceType === 'mobile' ? mobilePanel === 'property' : rightPanelOpen, drawer: deviceType === 'tablet', mobile: deviceType === 'mobile' }">
        <div class="panel-header">
          <h3 class="panel-title">属性面板</h3>
          <button v-if="deviceType !== 'desktop'" class="icon-btn close-btn" @click="toggleRightPanel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="panel-content">
          <div v-if="editingChartBlock" class="property-section">
            <div class="property-group">
              <label class="group-label">图表类型</label>
              <div class="chart-type-options">
                <div v-for="type in (['bubble', 'sankey', 'radar'] as ChartType[])" :key="type" class="type-option" :class="{ active: editingConfig.chartType === type }" @click="editingConfig.chartType = type">
                  <span class="type-name">{{ type === 'bubble' ? '气泡图' : type === 'sankey' ? '桑基图' : '雷达图' }}</span>
                </div>
              </div>
            </div>
            <div class="property-group">
              <label class="group-label">配色主题</label>
              <div class="theme-options">
                <div v-for="key in themeKeys" :key="key" class="theme-option" :class="{ active: editingConfig.theme === key }" @click="editingConfig.theme = key" :style="{ borderColor: editingConfig.theme === key ? getThemeColor(key) : '#E5E7EB' }">
                  <div class="theme-gradient" :style="{ background: `linear-gradient(135deg, ${THEME_PALETTES[key].gradient.join(', ')})` }"></div>
                  <span class="theme-name">{{ getThemeName(key) }}</span>
                </div>
              </div>
            </div>
            <div class="property-group">
              <label class="group-label">图表标题</label>
              <input v-model="editingConfig.title" type="text" class="input-field" placeholder="输入标题" />
            </div>
            <div class="property-group">
              <label class="group-label">标题字号：{{ editingConfig.titleFontSize }}px</label>
              <input v-model.number="editingConfig.titleFontSize" type="range" min="12" max="32" class="slider" />
            </div>
            <div class="property-group">
              <label class="group-label">标签字号：{{ editingConfig.labelFontSize }}px</label>
              <input v-model.number="editingConfig.labelFontSize" type="range" min="9" max="18" class="slider" />
            </div>
            <button class="save-btn" @click="savePropertyChanges">应用更改</button>
          </div>
          <div v-else class="property-empty">
            <p>双击画布上的图表<br />打开属性编辑</p>
          </div>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="propertyModalVisible" class="modal-overlay" @click.self="closePropertyModal">
          <div class="modal-content">
            <div class="modal-header">
              <h3>编辑图表属性</h3>
              <button class="icon-btn" @click="closePropertyModal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="property-group">
                <label class="group-label">图表类型</label>
                <div class="chart-type-options">
                  <div v-for="type in (['bubble', 'sankey', 'radar'] as ChartType[])" :key="type" class="type-option" :class="{ active: editingConfig.chartType === type }" @click="editingConfig.chartType = type">
                    <span class="type-name">{{ type === 'bubble' ? '气泡图' : type === 'sankey' ? '桑基图' : '雷达图' }}</span>
                  </div>
                </div>
              </div>
              <div class="property-group">
                <label class="group-label">配色主题</label>
                <div class="theme-options">
                  <div v-for="key in themeKeys" :key="key" class="theme-option" :class="{ active: editingConfig.theme === key }" @click="editingConfig.theme = key" :style="{ borderColor: editingConfig.theme === key ? getThemeColor(key) : '#E5E7EB' }">
                    <div class="theme-gradient" :style="{ background: `linear-gradient(135deg, ${THEME_PALETTES[key].gradient.join(', ')})` }"></div>
                    <span class="theme-name">{{ getThemeName(key) }}</span>
                  </div>
                </div>
              </div>
              <div class="property-group">
                <label class="group-label">图表标题</label>
                <input v-model="editingConfig.title" type="text" class="input-field" placeholder="输入图表标题" />
              </div>
              <div class="row-2">
                <div class="property-group">
                  <label class="group-label">标题字号：{{ editingConfig.titleFontSize }}px</label>
                  <input v-model.number="editingConfig.titleFontSize" type="range" min="12" max="32" class="slider" />
                </div>
                <div class="property-group">
                  <label class="group-label">标签字号：{{ editingConfig.labelFontSize }}px</label>
                  <input v-model.number="editingConfig.labelFontSize" type="range" min="9" max="18" class="slider" />
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" @click="closePropertyModal">取消</button>
              <button class="btn btn-primary" @click="savePropertyChanges">确认更改</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div v-if="deviceType === 'mobile' && mobilePanel !== 'none'" class="mobile-backdrop" @click="closeMobilePanel"></div>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #fff;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
  z-index: 100;
}

.header-left,
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.icon-btn.active {
  background: #eff6ff;
  color: #339af0;
}

.view-toggle {
  display: flex;
  background: #f1f3f5;
  border-radius: 10px;
  padding: 4px;
  gap: 2px;
}

.toggle-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toggle-btn.active {
  background: #fff;
  color: #1f2937;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.chart-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6b7280;
  padding: 6px 12px;
  background: #f1f3f5;
  border-radius: 8px;
}

.app-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

.panel {
  width: 300px;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  overflow: hidden;
  z-index: 50;
}

.panel:not(.open) {
  width: 0;
  opacity: 0;
}

.panel.drawer:not(.open) {
  transform: translateX(-100%);
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  height: 100%;
  width: 280px;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.12);
  opacity: 1;
}

.right-panel.drawer:not(.open) {
  transform: translateX(100%);
  left: auto;
  right: 0;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
}

.panel.mobile {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100% !important;
  max-height: 50vh;
  background: #fff;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.12);
  z-index: 200;
  transform: translateY(100%);
  opacity: 1;
}

.panel.mobile.open {
  transform: translateY(0);
  width: 100%;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: #fff;
  flex-shrink: 0;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.material-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.material-card {
  width: 260px;
  padding: 12px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease;
}

.material-card:hover {
  background: #e9ecef;
  border-color: #339af0;
  border-style: dashed;
  box-shadow: 0 4px 12px rgba(51, 154, 240, 0.15);
  transform: translateY(-2px);
}

.material-card:active {
  cursor: grabbing;
}

.material-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.material-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;
}

.material-badge.numeric {
  background: #dbeafe;
  color: #2563eb;
}

.material-badge.categorical {
  background: #d1fae5;
  color: #059669;
}

.material-count {
  font-size: 11px;
  color: #9ca3af;
}

.material-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px;
}

.material-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 10px;
  line-height: 1.5;
}

.material-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 10px;
}

.preview-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 10px;
  color: #6b7280;
  width: 48px;
  flex-shrink: 0;
}

.preview-bar-bg {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.preview-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.drag-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #339af0;
  font-weight: 500;
  padding-top: 4px;
  border-top: 1px dashed #e5e7eb;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.material-card:hover .drag-hint {
  opacity: 1;
}

.main-area {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

.canvas {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #f1f3f5;
  background-image: radial-gradient(circle, #d1d5db 1px, transparent 1px);
  background-size: 24px 24px;
  transition: border-color 0.3s ease;
  border: 2px solid transparent;
  min-width: 100%;
  min-height: 100%;
}

.canvas.drag-highlight {
  border-color: #339af0;
  border-style: dashed;
  background-color: #eff6ff;
}

.canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px;
}

.empty-desc {
  font-size: 14px;
  color: #9ca3af;
  margin: 0;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  min-width: 2000px;
  min-height: 2000px;
}

.connection-path {
  pointer-events: stroke;
  cursor: pointer;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: draw-path 0.5s ease forwards;
}

@keyframes draw-path {
  to {
    stroke-dashoffset: 0;
  }
}

.connection-path:hover {
  stroke: #e74c3c !important;
  stroke-width: 3px !important;
}

.chart-wrapper-block {
  position: absolute;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: visible;
  user-select: none;
}

.chart-wrapper-block:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.chart-wrapper-block.edit-mode {
  border: 2px solid transparent;
  cursor: pointer;
}

.chart-wrapper-block.edit-mode:hover {
  border-color: #339af0;
}

.chart-wrapper-block.story-mode {
  cursor: move;
}

.chart-wrapper-block.zoomed {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.2);
}

.chart-wrapper-block.connection-source {
  border: 2px dashed #f59e0b !important;
  animation: pulse-border 1.2s infinite;
}

@keyframes pulse-border {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
}

.chart-wrapper-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #fafafa;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-bottom: 1px solid #f3f4f6;
}

.chart-type-tag {
  font-size: 11px;
  font-weight: 600;
  color: #4a90d9;
  background: #eff6ff;
  padding: 3px 8px;
  border-radius: 6px;
}

.chart-actions-bar {
  position: absolute;
  top: -14px;
  right: 12px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
}

.chart-wrapper-block:hover .chart-actions-bar,
.chart-wrapper-block.connection-source .chart-actions-bar {
  opacity: 1;
}

.chart-action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  color: #6b7280;
  cursor: pointer;
  transition: all 0.15s ease;
}

.chart-action-btn:hover {
  background: #fef2f2;
  color: #e74c3c;
}

.chart-action-btn.active {
  background: #fffbeb;
  color: #f59e0b;
}

.chart-inner-wrapper {
  width: 100%;
  background: #fff;
  border-radius: 12px;
}

.connection-hint {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background: #f59e0b;
  color: #fff;
  border-radius: 24px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.3);
  z-index: 300;
}

.property-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.group-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.chart-type-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.type-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 8px;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-option:hover {
  border-color: #93c5fd;
  background: #eff6ff;
}

.type-option.active {
  border-color: #339af0;
  background: #eff6ff;
}

.type-name {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.type-option.active .type-name {
  color: #1e40af;
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-option:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.theme-gradient {
  width: 100%;
  height: 24px;
  border-radius: 6px;
}

.theme-name {
  font-size: 11px;
  font-weight: 500;
  color: #6b7280;
}

.input-field {
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  color: #1f2937;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  outline: none;
  background: #fff;
}

.input-field:focus {
  border-color: #339af0;
  box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.15);
}

.slider {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #339af0;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  background: linear-gradient(135deg, #339af0, #2563eb);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(51, 154, 240, 0.3);
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(51, 154, 240, 0.4);
}

.property-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 200px;
  color: #9ca3af;
  font-size: 13px;
  line-height: 1.8;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 400px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  background: #fafafa;
}

.btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, #339af0, #2563eb);
  color: #fff;
  box-shadow: 0 4px 12px rgba(51, 154, 240, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(51, 154, 240, 0.4);
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-content,
.modal-fade-leave-active .modal-content {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-content,
.modal-fade-leave-to .modal-content {
  transform: scale(0.95);
  opacity: 0;
}

.mobile-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 150;
  backdrop-filter: blur(2px);
}

@media (max-width: 1280px) {
  .view-toggle {
    display: none;
  }
}

@media (max-width: 1024px) {
  .app-header {
    padding: 0 12px;
  }
  .app-title span {
    display: none;
  }
}

@media (max-width: 768px) {
  .chart-count span {
    display: none;
  }
  .modal-content {
    width: calc(100vw - 24px);
    max-height: calc(100vh - 24px);
  }
}
</style>


