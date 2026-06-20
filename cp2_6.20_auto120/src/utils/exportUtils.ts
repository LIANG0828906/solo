import type { ExportConfig, SceneState } from '@/types';

export function buildExportConfig(state: SceneState): ExportConfig {
  return {
    cellType: state.cellType,
    organelles: state.organelles.map((o) => ({
      id: o.id,
      type: o.type,
      position: o.position,
      scale: o.scale,
      color: o.color,
    })),
    paths: state.paths.map((p) => ({
      id: p.id,
      startPoint: p.startPoint,
      endPoint: p.endPoint,
      controlPoints: p.controlPoints,
      speed: p.speed,
    })),
    params: {
      ambientLightIntensity: state.params.ambientLightIntensity,
      membraneOpacity: state.params.membraneOpacity,
      vesicleSize: state.params.vesicleSize,
      trailLength: state.params.trailLength,
    },
    exportTime: new Date().toISOString(),
  };
}

export function downloadJSON(data: ExportConfig, filename: string = 'cell-simulation-config.json'): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
