import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ComponentType = 'container' | 'button' | 'textblock' | 'image';

export interface ResponsiveConfig {
  width: number;
  widthUnit: 'px' | '%';
  visible: boolean;
}

export interface ComponentData {
  id: string;
  type: ComponentType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  parentId: string | null;
  childrenOrder: string[];
  responsiveConfig: Record<string, ResponsiveConfig>;
}

export interface Breakpoint {
  id: string;
  name: string;
  width: number;
}

export interface Snapshot {
  id: string;
  name: string;
  timestamp: number;
  thumbnail: string;
  components: ComponentData[];
  activeBreakpoint: string;
  breakpoints: Breakpoint[];
}

export interface SimulationDevice {
  name: string;
  width: number;
  height: number;
}

export const COMPONENT_COLORS: Record<ComponentType, string> = {
  container: '#4A90D9',
  button: '#27AE60',
  textblock: '#F39C12',
  image: '#8E44AD',
};

export const COMPONENT_DEFAULTS: Record<ComponentType, { width: number; height: number; label: string }> = {
  container: { width: 300, height: 200, label: 'Container' },
  button: { width: 120, height: 40, label: 'Button' },
  textblock: { width: 200, height: 60, label: 'Text Block' },
  image: { width: 160, height: 120, label: 'Image' },
};

export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  { id: 'default', name: 'Default', width: 1280 },
  { id: 'bp-480', name: '480px', width: 480 },
  { id: 'bp-768', name: '768px', width: 768 },
  { id: 'bp-1024', name: '1024px', width: 1024 },
  { id: 'bp-1440', name: '1440px', width: 1440 },
];

export const SIMULATION_DEVICES: SimulationDevice[] = [
  { name: 'iPhone 14', width: 390, height: 844 },
  { name: 'iPad', width: 820, height: 1180 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
];

export const GRID_SIZE = 20;

interface StoreState {
  components: ComponentData[];
  breakpoints: Breakpoint[];
  activeBreakpoint: string;
  snapshots: Snapshot[];
  canvasZoom: number;
  highlightedComponentId: string | null;
  simulationMode: boolean;
  simulationDevice: SimulationDevice | null;
  nextZIndex: number;
  selectedComponentId: string | null;
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;
}

interface StoreActions {
  addComponent: (type: ComponentType, x: number, y: number, parentId?: string | null) => string;
  updateComponent: (id: string, updates: Partial<ComponentData>) => void;
  removeComponent: (id: string) => void;
  moveComponent: (id: string, x: number, y: number) => void;
  updateNesting: (childId: string, newParentId: string | null) => void;
  reorderChildren: (parentId: string, fromIndex: number, toIndex: number) => void;
  setHighlight: (id: string | null) => void;
  setSelected: (id: string | null) => void;
  addBreakpoint: (name: string, width: number) => void;
  removeBreakpoint: (id: string) => void;
  setActiveBreakpoint: (id: string) => void;
  updateResponsiveConfig: (componentId: string, breakpointId: string, config: Partial<ResponsiveConfig>) => void;
  saveSnapshot: (name: string, thumbnail: string) => void;
  restoreSnapshot: (id: string) => void;
  removeSnapshot: (id: string) => void;
  setCanvasZoom: (zoom: number) => void;
  setSimulationMode: (enabled: boolean, device?: SimulationDevice) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  getEffectiveComponent: (id: string, breakpointId?: string) => ComponentData & { effectiveWidth: number | string; effectiveVisible: boolean };
  getChildren: (parentId: string | null) => ComponentData[];
  exportToHTML: () => string;
}

type Store = StoreState & StoreActions;

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

function removeChildFromParent(components: ComponentData[], childId: string): ComponentData[] {
  return components.map(c => {
    if (c.childrenOrder.includes(childId)) {
      return { ...c, childrenOrder: c.childrenOrder.filter(id => id !== childId) };
    }
    return c;
  });
}

function collectDescendants(components: ComponentData[], parentId: string): string[] {
  const result: string[] = [];
  const parent = components.find(c => c.id === parentId);
  if (!parent) return result;
  for (const childId of parent.childrenOrder) {
    result.push(childId);
    result.push(...collectDescendants(components, childId));
  }
  return result;
}

export const useStore = create<Store>((set, get) => ({
  components: [],
  breakpoints: [...DEFAULT_BREAKPOINTS],
  activeBreakpoint: 'default',
  snapshots: [],
  canvasZoom: 1,
  highlightedComponentId: null,
  simulationMode: false,
  simulationDevice: null,
  nextZIndex: 10,
  selectedComponentId: null,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,

  addComponent: (type, x, y, parentId = null) => {
    const state = get();
    const id = uuidv4();
    const defaults = COMPONENT_DEFAULTS[type];
    const label = `${defaults.label} ${state.components.filter(c => c.type === type).length + 1}`;
    const responsiveConfig: Record<string, ResponsiveConfig> = {};
    for (const bp of state.breakpoints) {
      responsiveConfig[bp.id] = { width: defaults.width, widthUnit: 'px', visible: true };
    }
    const newComponent: ComponentData = {
      id,
      type,
      label,
      x: snapToGrid(x),
      y: snapToGrid(y),
      width: defaults.width,
      height: defaults.height,
      zIndex: state.nextZIndex,
      parentId,
      childrenOrder: [],
      responsiveConfig,
    };
    set(s => {
      let updated = [...s.components, newComponent];
      if (parentId) {
        const parent = updated.find(c => c.id === parentId);
        if (parent) {
          updated = updated.map(c =>
            c.id === parentId ? { ...c, childrenOrder: [...c.childrenOrder, id] } : c
          );
        }
      }
      return { components: updated, nextZIndex: Math.min(s.nextZIndex + 1, 1000) };
    });
    return id;
  },

  updateComponent: (id, updates) => {
    set(s => ({
      components: s.components.map(c => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  removeComponent: (id) => {
    set(s => {
      const comp = s.components.find(c => c.id === id);
      if (!comp) return s;
      const descendantIds = collectDescendants(s.components, id);
      const idsToRemove = new Set([id, ...descendantIds]);
      let updated = s.components.filter(c => !idsToRemove.has(c.id));
      updated = removeChildFromParent(updated, id);
      return {
        components: updated,
        highlightedComponentId: s.highlightedComponentId && idsToRemove.has(s.highlightedComponentId) ? null : s.highlightedComponentId,
        selectedComponentId: s.selectedComponentId && idsToRemove.has(s.selectedComponentId) ? null : s.selectedComponentId,
      };
    });
  },

  moveComponent: (id, x, y) => {
    set(s => ({
      components: s.components.map(c =>
        c.id === id ? { ...c, x: snapToGrid(x), y: snapToGrid(y) } : c
      ),
    }));
  },

  updateNesting: (childId, newParentId) => {
    set(s => {
      const child = s.components.find(c => c.id === childId);
      if (!child) return s;
      if (child.parentId === newParentId) return s;
      if (newParentId) {
        const newParent = s.components.find(c => c.id === newParentId);
        if (!newParent || newParent.type !== 'container') return s;
        if (newParent.parentId === childId) return s;
        const descendants = collectDescendants(s.components, childId);
        if (descendants.includes(newParentId)) return s;
      }
      let updated = removeChildFromParent(s.components, childId);
      if (newParentId) {
        updated = updated.map(c =>
          c.id === newParentId
            ? { ...c, childrenOrder: [...c.childrenOrder, childId] }
            : c
        );
      }
      const parentComp = newParentId ? updated.find(c => c.id === newParentId) : null;
      updated = updated.map(c =>
        c.id === childId
          ? {
              ...c,
              parentId: newParentId,
              x: parentComp ? Math.max(0, c.x - parentComp.x) : c.x,
              y: parentComp ? Math.max(0, c.y - parentComp.y) : c.y,
            }
          : c
      );
      return { components: updated };
    });
  },

  reorderChildren: (parentId, fromIndex, toIndex) => {
    set(s => {
      const parent = s.components.find(c => c.id === parentId);
      if (!parent) return s;
      const newOrder = [...parent.childrenOrder];
      const [moved] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, moved);
      return {
        components: s.components.map(c =>
          c.id === parentId ? { ...c, childrenOrder: newOrder } : c
        ),
      };
    });
  },

  setHighlight: (id) => set({ highlightedComponentId: id }),

  setSelected: (id) => set({ selectedComponentId: id }),

  addBreakpoint: (name, width) => {
    const id = `bp-${uuidv4().slice(0, 8)}`;
    const bp: Breakpoint = { id, name, width };
    set(s => {
      if (s.breakpoints.length >= 5) return s;
      return {
        breakpoints: [...s.breakpoints, bp],
        components: s.components.map(c => ({
          ...c,
          responsiveConfig: {
            ...c.responsiveConfig,
            [id]: { width: c.width, widthUnit: 'px', visible: true },
          },
        })),
      };
    });
  },

  removeBreakpoint: (id) => {
    set(s => ({
      breakpoints: s.breakpoints.filter(bp => bp.id !== id),
      activeBreakpoint: s.activeBreakpoint === id ? 'default' : s.activeBreakpoint,
      components: s.components.map(c => {
        const { [id]: _, ...rest } = c.responsiveConfig;
        return { ...c, responsiveConfig: rest };
      }),
    }));
  },

  setActiveBreakpoint: (id) => set({ activeBreakpoint: id }),

  updateResponsiveConfig: (componentId, breakpointId, config) => {
    set(s => ({
      components: s.components.map(c => {
        if (c.id !== componentId) return c;
        const existing = c.responsiveConfig[breakpointId] || { width: c.width, widthUnit: 'px', visible: true };
        return {
          ...c,
          responsiveConfig: {
            ...c.responsiveConfig,
            [breakpointId]: { ...existing, ...config },
          },
        };
      }),
    }));
  },

  saveSnapshot: (name, thumbnail) => {
    const state = get();
    const snapshot: Snapshot = {
      id: uuidv4(),
      name,
      timestamp: Date.now(),
      thumbnail,
      components: JSON.parse(JSON.stringify(state.components)),
      activeBreakpoint: state.activeBreakpoint,
      breakpoints: JSON.parse(JSON.stringify(state.breakpoints)),
    };
    set(s => {
      const snapshots = [snapshot, ...s.snapshots].slice(0, 10);
      try {
        localStorage.setItem('page-builder-snapshots', JSON.stringify(snapshots));
      } catch {}
      return { snapshots };
    });
  },

  restoreSnapshot: (id) => {
    const state = get();
    const snapshot = state.snapshots.find(s => s.id === id);
    if (!snapshot) return;
    set({
      components: JSON.parse(JSON.stringify(snapshot.components)),
      activeBreakpoint: snapshot.activeBreakpoint,
      breakpoints: JSON.parse(JSON.stringify(snapshot.breakpoints)),
      highlightedComponentId: null,
      selectedComponentId: null,
    });
  },

  removeSnapshot: (id) => {
    set(s => {
      const snapshots = s.snapshots.filter(snap => snap.id !== id);
      try {
        localStorage.setItem('page-builder-snapshots', JSON.stringify(snapshots));
      } catch {}
      return { snapshots };
    });
  },

  setCanvasZoom: (zoom) => set({ canvasZoom: Math.max(0.5, Math.min(2.0, zoom)) }),

  setSimulationMode: (enabled, device) => {
    if (enabled && device) {
      const state = get();
      const matchingBp = state.breakpoints
        .filter(bp => bp.id !== 'default')
        .sort((a, b) => Math.abs(a.width - device.width) - Math.abs(b.width - device.width))[0];
      set({
        simulationMode: true,
        simulationDevice: device,
        activeBreakpoint: matchingBp?.id || state.activeBreakpoint,
      });
    } else {
      set({ simulationMode: false, simulationDevice: null });
    }
  },

  bringToFront: (id) => {
    set(s => {
      const maxZ = Math.max(...s.components.map(c => c.zIndex), 9);
      const newZ = Math.min(maxZ + 1, 1000);
      return {
        components: s.components.map(c => (c.id === id ? { ...c, zIndex: newZ } : c)),
        nextZIndex: Math.min(newZ + 1, 1000),
      };
    });
  },

  sendToBack: (id) => {
    set(s => {
      const minZ = Math.min(...s.components.map(c => c.zIndex), 11);
      const newZ = Math.max(minZ - 1, 10);
      return {
        components: s.components.map(c => (c.id === id ? { ...c, zIndex: newZ } : c)),
      };
    });
  },

  toggleLeftPanel: () => set(s => ({ leftPanelCollapsed: !s.leftPanelCollapsed })),
  toggleRightPanel: () => set(s => ({ rightPanelCollapsed: !s.rightPanelCollapsed })),

  getEffectiveComponent: (id, breakpointId) => {
    const state = get();
    const comp = state.components.find(c => c.id === id);
    if (!comp) throw new Error(`Component ${id} not found`);
    const bpId = breakpointId || state.activeBreakpoint;
    const rConfig = comp.responsiveConfig[bpId];
    const effectiveWidth = rConfig
      ? rConfig.widthUnit === '%'
        ? `${rConfig.width}%`
        : rConfig.width
      : comp.width;
    const effectiveVisible = rConfig ? rConfig.visible : true;
    return { ...comp, effectiveWidth, effectiveVisible };
  },

  getChildren: (parentId) => {
    const state = get();
    if (parentId === null) {
      return state.components.filter(c => c.parentId === null).sort((a, b) => a.zIndex - b.zIndex);
    }
    const parent = state.components.find(c => c.id === parentId);
    if (!parent) return [];
    return parent.childrenOrder
      .map(id => state.components.find(c => c.id === id))
      .filter((c): c is ComponentData => c !== undefined);
  },

  exportToHTML: () => {
    const state = get();
    const sortedBreakpoints = state.breakpoints
      .filter(bp => bp.id !== 'default')
      .sort((a, b) => a.width - b.width);

    function buildComponentHTML(comp: ComponentData, indent: string): string {
      const bpId = state.activeBreakpoint;
      const rConfig = comp.responsiveConfig[bpId];
      const w = rConfig ? (rConfig.widthUnit === '%' ? `${rConfig.width}%` : `${rConfig.width}px`) : `${comp.width}px`;
      const styleBase = `position:relative;width:${w};min-height:${comp.height}px;z-index:${comp.zIndex};border:1px solid ${COMPONENT_COLORS[comp.type]};`;

      const children = comp.childrenOrder
        .map(id => state.components.find(c => c.id === id))
        .filter((c): c is ComponentData => !!c);

      let inner = '';
      switch (comp.type) {
        case 'container':
          inner = children.map(c => buildComponentHTML(c, indent + '  ')).join('\n');
          return `${indent}<div class="comp-${comp.id}" style="${styleBase}display:flex;flex-direction:column;padding:8px;">\n${inner}\n${indent}</div>`;
        case 'button':
          return `${indent}<button class="comp-${comp.id}" style="${styleBase}background:#27AE60;color:#fff;border:none;cursor:pointer;border-radius:4px;">${comp.label}</button>`;
        case 'textblock':
          return `${indent}<div class="comp-${comp.id}" style="${styleBase}padding:8px;color:#333;">${comp.label}</div>`;
        case 'image':
          return `${indent}<div class="comp-${comp.id}" style="${styleBase}background:#e0e0e0;display:flex;align-items:center;justify-content:center;color:#666;">🖼 ${comp.label}</div>`;
        default:
          return '';
      }
    }

    const rootComps = state.components
      .filter(c => c.parentId === null)
      .sort((a, b) => a.zIndex - b.zIndex);

    const bodyContent = rootComps.map(c => buildComponentHTML(c, '    ')).join('\n');

    const mediaQueries = sortedBreakpoints.map(bp => {
      const hiddenSelectors: string[] = [];
      state.components.forEach(comp => {
        const rc = comp.responsiveConfig[bp.id];
        if (rc && !rc.visible) hiddenSelectors.push(`.comp-${comp.id}`);
      });
      if (hiddenSelectors.length === 0) return '';
      return `  @media (max-width: ${bp.width}px) {\n${hiddenSelectors.map(s => `    ${s} { display: none !important; }`).join('\n')}\n  }`;
    }).filter(Boolean).join('\n\n');

    const responsiveStyles = sortedBreakpoints.map(bp => {
      const rules: string[] = [];
      state.components.forEach(comp => {
        const rc = comp.responsiveConfig[bp.id];
        if (!rc) return;
        const w = rc.widthUnit === '%' ? `${rc.width}%` : `${rc.width}px`;
        rules.push(`    .comp-${comp.id} { width: ${w}; transition: width 0.3s ease; }`);
      });
      if (rules.length === 0) return '';
      return `  @media (max-width: ${bp.width}px) {\n${rules.join('\n')}\n  }`;
    }).filter(Boolean).join('\n\n');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exported Page</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: sans-serif; }
    .canvas { position: relative; width: 1280px; min-height: 720px; margin: 0 auto; }

${mediaQueries}

${responsiveStyles}
  </style>
</head>
<body>
  <div class="canvas">
${bodyContent}
  </div>
</body>
</html>`;
  },
}));

try {
  const saved = localStorage.getItem('page-builder-snapshots');
  if (saved) {
    const snapshots: Snapshot[] = JSON.parse(saved);
    useStore.setState({ snapshots });
  }
} catch {}
