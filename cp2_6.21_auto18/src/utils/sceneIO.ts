import { Exhibit, LightingConfig, CameraPathType } from '../types/scene';

export interface SceneData {
  version: string;
  timestamp: string;
  exhibits: Exhibit[];
  lighting: LightingConfig;
  cameraPath: CameraPathType;
}

export function exportSceneToJSON(
  exhibits: Exhibit[],
  lighting: LightingConfig,
  cameraPath: CameraPathType
): string {
  const data: SceneData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    exhibits,
    lighting,
    cameraPath,
  };
  return JSON.stringify(data, null, 2);
}

export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateTimestampFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `exhibit_${year}${month}${day}_${hours}${minutes}${seconds}.json`;
}

export function parseSceneJSON(json: string): SceneData | null {
  try {
    const data = JSON.parse(json) as SceneData;
    if (!data.exhibits || !Array.isArray(data.exhibits)) {
      return null;
    }
    if (!data.lighting || !data.lighting.pointLights) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
