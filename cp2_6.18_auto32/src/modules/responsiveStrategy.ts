import { useStore, Breakpoint, ResponsiveConfig, ComponentData } from '../store';

export function useBreakpoints() {
  const breakpoints = useStore(s => s.breakpoints);
  const activeBreakpoint = useStore(s => s.activeBreakpoint);
  const addBreakpoint = useStore(s => s.addBreakpoint);
  const removeBreakpoint = useStore(s => s.removeBreakpoint);
  const setActiveBreakpoint = useStore(s => s.setActiveBreakpoint);

  const canAddBreakpoint = breakpoints.length < 5;

  const addCustomBreakpoint = (name: string, width: number) => {
    if (!canAddBreakpoint) return;
    addBreakpoint(name, width);
  };

  const removeCustomBreakpoint = (id: string) => {
    if (id === 'default') return;
    removeBreakpoint(id);
  };

  const sortedBreakpoints = [...breakpoints]
    .filter(bp => bp.id !== 'default')
    .sort((a, b) => a.width - b.width);

  return {
    breakpoints,
    sortedBreakpoints,
    activeBreakpoint,
    canAddBreakpoint,
    setActiveBreakpoint,
    addCustomBreakpoint,
    removeCustomBreakpoint,
  };
}

export function useComponentResponsive(componentId: string) {
  const component = useStore(s => s.components.find(c => c.id === componentId));
  const breakpoints = useStore(s => s.breakpoints);
  const activeBreakpoint = useStore(s => s.activeBreakpoint);
  const updateResponsiveConfig = useStore(s => s.updateResponsiveConfig);

  if (!component) {
    return {
      currentConfig: { width: 0, widthUnit: 'px' as const, visible: true },
      activeConfig: { width: 0, widthUnit: 'px' as const, visible: true },
      setWidth: (_w: number) => {},
      setWidthUnit: (_u: 'px' | '%') => {},
      setVisible: (_v: boolean) => {},
      getConfigForBreakpoint: (_bpId: string): ResponsiveConfig => ({ width: 0, widthUnit: 'px', visible: true }),
    };
  }

  const currentConfig: ResponsiveConfig = component.responsiveConfig[activeBreakpoint] || {
    width: component.width,
    widthUnit: 'px',
    visible: true,
  };

  const setWidth = (width: number) => {
    updateResponsiveConfig(componentId, activeBreakpoint, { width });
  };

  const setWidthUnit = (widthUnit: 'px' | '%') => {
    updateResponsiveConfig(componentId, activeBreakpoint, { widthUnit });
  };

  const setVisible = (visible: boolean) => {
    updateResponsiveConfig(componentId, activeBreakpoint, { visible });
  };

  const getConfigForBreakpoint = (bpId: string): ResponsiveConfig => {
    return component.responsiveConfig[bpId] || { width: component.width, widthUnit: 'px', visible: true };
  };

  return {
    currentConfig,
    activeConfig: currentConfig,
    setWidth,
    setWidthUnit,
    setVisible,
    getConfigForBreakpoint,
  };
}

export function getEffectiveLayout(component: ComponentData, breakpointId: string): {
  width: number | string;
  visible: boolean;
} {
  const rConfig = component.responsiveConfig[breakpointId];
  if (!rConfig) return { width: component.width, visible: true };
  return {
    width: rConfig.widthUnit === '%' ? `${rConfig.width}%` : rConfig.width,
    visible: rConfig.visible,
  };
}

export function getResponsiveWidthForBreakpoint(
  component: ComponentData,
  breakpointId: string
): string {
  const rConfig = component.responsiveConfig[breakpointId];
  if (!rConfig) return `${component.width}px`;
  return rConfig.widthUnit === '%' ? `${rConfig.width}%` : `${rConfig.width}px`;
}
