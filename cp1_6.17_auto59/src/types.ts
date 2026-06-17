export type DensityField = Float32Array;

export type RenderMode = 'points' | 'voxels' | 'isosurface';

export type ColorMapMode = 'thermal' | 'rainbow' | 'monochrome';

export type DatasetType = 'taurus' | 'orion' | 'perlin';

export interface DensityFieldConfig {
  size: number;
  dataset: DatasetType;
  seed?: number;
}

export interface RendererConfig {
  mode: RenderMode;
  threshold: number;
  colorMap: ColorMapMode;
  pointSize: number;
  voxelSize: number;
}

export interface UIParams {
  threshold: number;
  colorMap: ColorMapMode;
  renderMode: RenderMode;
  dataset: DatasetType;
}

export type WorkerMessage =
  | {
      type: 'generate';
      config: DensityFieldConfig;
    }
  | {
      type: 'progress';
      progress: number;
    }
  | {
      type: 'result';
      data: DensityField;
      size: number;
    }
  | {
      type: 'error';
      error: string;
    };
