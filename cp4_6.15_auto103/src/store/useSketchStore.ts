import { create } from 'zustand';
import type { SketchStore, Layer, LayerGroup } from '../types';

const DEFAULT_ZOOM = 1;
const DEFAULT_PAN = 0;

const useSketchStore = create<SketchStore>((set, get) => ({
  // ============== State ==============
  // 原始图片URL，用于显示底图
  originalImageUrl: null,
  // 图层分组数组，按类型组织图层（stroke/shape/text）
  layerGroups: [],
  // 当前选中的图层ID，用于属性编辑和高亮显示
  selectedLayerId: null,
  // 导出中状态，用于控制导出进度UI
  isExporting: false,
  // 处理中状态，用于控制加载动画
  isProcessing: false,
  // 画布缩放比例
  zoom: DEFAULT_ZOOM,
  // 画布水平平移量
  panX: DEFAULT_PAN,
  // 画布垂直平移量
  panY: DEFAULT_PAN,

  // ============== Actions ==============

  /**
   * 设置原始图片URL
   * 数据流向: 用户上传图片 → 调用此方法 → 更新originalImageUrl → 画布组件重新渲染底图
   */
  setOriginalImage: (url: string | null) => {
    set({ originalImageUrl: url });
  },

  /**
   * 添加图层分组
   * 数据流向: AI识别完成 → 生成LayerGroup数组 → 调用此方法 → 更新layerGroups → 图层面板和画布重新渲染
   */
  addLayerGroups: (groups: LayerGroup[]) => {
    set({ layerGroups: groups });
  },

  /**
   * 选中图层
   * 数据流向: 用户点击图层/画布 → 调用此方法 → 更新selectedLayerId → 属性面板和画布高亮更新
   */
  selectLayer: (layerId: string | null) => {
    set({ selectedLayerId: layerId });
  },

  /**
   * 切换图层可见性
   * 数据流向: 用户点击眼睛图标 → 调用此方法 → 遍历layerGroups找到对应图层 → 更新visible属性 → 画布重新渲染
   */
  toggleLayerVisibility: (layerId: string) => {
    const { layerGroups } = get();
    const updatedGroups = layerGroups.map((group) => ({
      ...group,
      layers: group.layers.map((layer) =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      ),
    }));
    set({ layerGroups: updatedGroups });
  },

  /**
   * 更新图层属性
   * 数据流向: 用户在属性面板修改 → 调用此方法 → 找到对应图层合并更新 → 画布和图层面板重新渲染
   */
  updateLayer: (layerId: string, updates: Partial<Layer>) => {
    const { layerGroups } = get();
    const updatedGroups = layerGroups.map((group) => ({
      ...group,
      layers: group.layers.map((layer) =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ),
    }));
    set({ layerGroups: updatedGroups });
  },

  /**
   * 删除图层
   * 数据流向: 用户点击删除按钮 → 调用此方法 → 从对应分组中移除图层 → 如删除的是选中图层则清空选中 → UI更新
   */
  deleteLayer: (layerId: string) => {
    const { layerGroups, selectedLayerId } = get();
    const updatedGroups = layerGroups.map((group) => ({
      ...group,
      layers: group.layers.filter((layer) => layer.id !== layerId),
    }));
    set({
      layerGroups: updatedGroups,
      selectedLayerId: selectedLayerId === layerId ? null : selectedLayerId,
    });
  },

  /**
   * 图层重排序（支持跨分组移动）
   * 数据流向: 用户拖拽图层面板 → 调用此方法 → 从原分组移除并插入目标分组指定位置 → 图层面板和画布渲染顺序更新
   */
  reorderLayer: (layerId: string, targetIndex: number, targetGroupId: string) => {
    const { layerGroups } = get();
    let movedLayer: Layer | null = null;
    let sourceGroupId: string | null = null;

    const groupsWithoutLayer = layerGroups.map((group) => {
      const layerIndex = group.layers.findIndex((l) => l.id === layerId);
      if (layerIndex !== -1) {
        movedLayer = group.layers[layerIndex];
        sourceGroupId = group.id;
        return {
          ...group,
          layers: group.layers.filter((l) => l.id !== layerId),
        };
      }
      return group;
    });

    if (!movedLayer || !sourceGroupId) return;

    const updatedGroups = groupsWithoutLayer.map((group) => {
      if (group.id === targetGroupId) {
        const newLayers = [...group.layers];
        newLayers.splice(targetIndex, 0, movedLayer!);
        return { ...group, layers: newLayers };
      }
      return group;
    });

    set({ layerGroups: updatedGroups });
  },

  /**
   * 设置处理中状态
   * 数据流向: 开始/结束AI处理 → 调用此方法 → 更新isProcessing → 全局加载动画显示/隐藏
   */
  setProcessing: (isProcessing: boolean) => {
    set({ isProcessing });
  },

  /**
   * 设置导出中状态
   * 数据流向: 开始/结束导出 → 调用此方法 → 更新isExporting → 导出进度UI显示/隐藏
   */
  setExporting: (isExporting: boolean) => {
    set({ isExporting });
  },

  /**
   * 设置缩放比例
   * 数据流向: 用户滚轮缩放/点击缩放按钮 → 调用此方法 → 更新zoom → 画布变换更新
   */
  setZoom: (zoom: number) => {
    set({ zoom });
  },

  /**
   * 设置平移坐标
   * 数据流向: 用户拖拽画布 → 调用此方法 → 更新panX/panY → 画布变换更新
   */
  setPan: (panX: number, panY: number) => {
    set({ panX, panY });
  },

  /**
   * 重置视图
   * 数据流向: 用户点击重置视图按钮 → 调用此方法 → zoom和pan恢复默认值 → 画布回到初始位置
   */
  resetView: () => {
    set({
      zoom: DEFAULT_ZOOM,
      panX: DEFAULT_PAN,
      panY: DEFAULT_PAN,
    });
  },
}));

export default useSketchStore;
