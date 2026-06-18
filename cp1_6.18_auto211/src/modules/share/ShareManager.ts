import pako from 'pako';

interface ShareData {
  modelName: string;
  subdivisionLevel: number;
  noiseIntensity: number;
  smoothness: number;
  vertexPositions: number[];
  originalVertices: number[];
}

class ShareManager {
  static serialize(data: ShareData): string {
    const json = JSON.stringify(data);
    const compressed = pako.deflate(json, { raw: true });
    const base64 = btoa(String.fromCharCode(...compressed));
    return encodeURIComponent(base64);
  }

  static deserialize(encoded: string): ShareData | null {
    try {
      const decoded = decodeURIComponent(encoded);
      const binary = atob(decoded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const decompressed = pako.inflate(bytes, { raw: true });
      const json = String.fromCharCode(...decompressed);
      return JSON.parse(json) as ShareData;
    } catch {
      return null;
    }
  }

  static generateShareUrl(data: ShareData): string {
    const encoded = ShareManager.serialize(data);
    return `${window.location.origin}/view/${encoded}`;
  }

  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      } catch {
        return false;
      }
    }
  }

  static extractShareDataFromUrl(url: string): ShareData | null {
    const match = url.match(/\/view\/(.+)$/);
    if (!match) {
      return null;
    }
    return ShareManager.deserialize(match[1]);
  }
}

export { ShareManager, ShareData };
