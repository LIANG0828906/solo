import type { ParticleData } from './topologyCalculator';

export function exportPNG(canvas: HTMLCanvasElement, filename: string = 'quantum-topology.png'): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const dataURL = canvas.toDataURL('image/png');
      const byteString = atob(dataURL.split(',')[1]);
      const mimeString = dataURL.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

interface JSONExportFormat {
  version: string;
  exportedAt: string;
  particles: Array<{
    id: string;
    knotId: string;
    position: [number, number, number];
    pathProgress: number;
    color: string;
  }>;
  metadata: {
    totalParticles: number;
    knotIds: string[];
  };
}

export function exportJSON(particles: ParticleData[], filename: string = 'quantum-topology-particles.json'): void {
  const data: JSONExportFormat = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    particles: particles.map(p => ({
      id: p.id,
      knotId: p.knotId,
      position: p.position,
      pathProgress: p.pathProgress,
      color: p.color,
    })),
    metadata: {
      totalParticles: particles.length,
      knotIds: Array.from(new Set(particles.map(p => p.knotId))),
    },
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
