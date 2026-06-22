import type { Component, ThemePalette } from '../types';

export function mapColorToIndex(color: string, palette: string[]): number {
  const normalizedColor = color.toLowerCase();
  for (let i = 0; i < palette.length; i++) {
    if (palette[i].toLowerCase() === normalizedColor) {
      return i;
    }
  }
  return 0;
}

export function ensureColorIndices(components: Component[], currentTheme: ThemePalette): Component[] {
  return components.map(comp => {
    const newComp = { ...comp, style: { ...comp.style } };
    
    if (newComp.style.fillColor && newComp.style.fillColorIndex === undefined) {
      newComp.style.fillColorIndex = mapColorToIndex(newComp.style.fillColor, currentTheme.colors);
    }
    if (newComp.style.strokeColor && newComp.style.strokeColorIndex === undefined) {
      newComp.style.strokeColorIndex = mapColorToIndex(newComp.style.strokeColor, currentTheme.colors);
    }
    if (newComp.style.textColor && newComp.style.textColorIndex === undefined) {
      newComp.style.textColorIndex = mapColorToIndex(newComp.style.textColor, currentTheme.colors);
    }
    
    return newComp;
  });
}

export function applyTheme(
  components: Component[],
  oldTheme: ThemePalette,
  newTheme: ThemePalette
): Component[] {
  const componentsWithIndices = ensureColorIndices(components, oldTheme);
  
  return componentsWithIndices.map(comp => {
    const newComp = { ...comp, style: { ...comp.style } };
    
    if (newComp.style.fillColorIndex !== undefined) {
      const idx = newComp.style.fillColorIndex;
      newComp.style.fillColor = newTheme.colors[idx % newTheme.colors.length];
    }
    if (newComp.style.strokeColorIndex !== undefined) {
      const idx = newComp.style.strokeColorIndex;
      newComp.style.strokeColor = newTheme.colors[idx % newTheme.colors.length];
    }
    if (newComp.style.textColorIndex !== undefined) {
      const idx = newComp.style.textColorIndex;
      newComp.style.textColor = newTheme.colors[idx % newTheme.colors.length];
    }
    
    return newComp;
  });
}

export function updateSingleThemeColor(
  components: Component[],
  colorIndex: number,
  newColor: string
): Component[] {
  return components.map(comp => {
    const newComp = { ...comp, style: { ...comp.style } };
    
    if (newComp.style.fillColorIndex === colorIndex) {
      newComp.style.fillColor = newColor;
    }
    if (newComp.style.strokeColorIndex === colorIndex) {
      newComp.style.strokeColor = newColor;
    }
    if (newComp.style.textColorIndex === colorIndex) {
      newComp.style.textColor = newColor;
    }
    
    return newComp;
  });
}
