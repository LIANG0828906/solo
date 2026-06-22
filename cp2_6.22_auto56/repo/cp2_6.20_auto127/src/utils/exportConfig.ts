import type { GeometryItemData, LightingConfig } from '../types';

export interface ExportedConfig {
  version: string;
  exportedAt: string;
  geometries: GeometryItemData[];
  lighting: LightingConfig;
}

export const exportConfig = (
  geometries: GeometryItemData[],
  lighting: LightingConfig
): ExportedConfig => {
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    geometries: geometries.map((g) => ({
      ...g,
      position: { ...g.position },
      rotation: { ...g.rotation },
      scale: { ...g.scale },
      material: { ...g.material }
    })),
    lighting: {
      ...lighting,
      pointLightPosition: { ...lighting.pointLightPosition }
    }
  };
};

export const configToJson = (config: ExportedConfig): string => {
  return JSON.stringify(config, null, 2);
};

export const downloadJson = (json: string, filename: string = 'sculpture-config.json'): void => {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
};

export const highlightJson = (json: string): string => {
  return json
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return `<span class="${cls}">${match}</span>`;
    });
};
