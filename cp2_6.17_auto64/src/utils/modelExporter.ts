import type { Voxel } from '../store/editorStore';

export interface ExportedVoxel {
  x: number;
  y: number;
  z: number;
  material: string;
}

export interface ExportedModel {
  version: string;
  voxels: ExportedVoxel[];
}

export function exportToJSON(voxels: Voxel[]): string {
  const model: ExportedModel = {
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

export function downloadJSON(voxels: Voxel[], filename: string = 'voxelforge-model.json'): void {
  const jsonContent = exportToJSON(voxels);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
