import type { Voxel } from '@/store/editorStore';

export interface ExportModel {
  version: string;
  voxels: Array<{
    x: number;
    y: number;
    z: number;
    material: string;
  }>;
}

export function exportToJSON(voxels: Voxel[]): string {
  const model: ExportModel = {
    version: '1.0',
    voxels: voxels.map((v) => ({
      x: v.x,
      y: v.y,
      z: v.z,
      material: v.material,
    })),
  };
  return JSON.stringify(model, null, 2);
}

export function downloadJSON(voxels: Voxel[]): void {
  const json = exportToJSON(voxels);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'voxelforge-model.json';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
