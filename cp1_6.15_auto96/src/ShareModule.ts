import html2canvas from 'html2canvas';
import { LayerData } from './CanvasModule';

interface ShareLayerInfo {
  brandName: string;
  colorName: string;
  colorHex: string;
  opacity: number;
  x: number;
  y: number;
  brushType: string;
}

interface ShareData {
  layers: ShareLayerInfo[];
  timestamp: number;
}

export async function saveAsPNG(canvasElement: HTMLCanvasElement | null): Promise<boolean> {
  if (!canvasElement) return false;

  try {
    const link = document.createElement('a');
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 9000 + 1000);
    link.download = `${dateStr}${randomNum}.png`;
    link.href = canvasElement.toDataURL('image/png');
    link.click();
    return true;
  } catch (err) {
    console.error('Failed to save PNG:', err);
    return false;
  }
}

export async function saveAsPNGFromSnapshot(getSnapshot: () => HTMLCanvasElement | null): Promise<boolean> {
  try {
    const snapshot = getSnapshot();
    if (!snapshot) return false;

    const link = document.createElement('a');
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 9000 + 1000);
    link.download = `${dateStr}${randomNum}.png`;
    link.href = snapshot.toDataURL('image/png');
    link.click();
    return true;
  } catch (err) {
    console.error('Failed to save PNG from snapshot:', err);
    return false;
  }
}

export async function generateShareLink(layers: LayerData[]): Promise<boolean> {
  try {
    const shareData: ShareData = {
      layers: layers.map(l => ({
        brandName: l.brandName,
        colorName: l.colorName,
        colorHex: l.colorHex,
        opacity: l.opacity,
        x: l.x,
        y: l.y,
        brushType: l.brushType
      })),
      timestamp: Date.now()
    };

    const jsonStr = JSON.stringify(shareData);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    const url = `${window.location.origin}${window.location.pathname}?data=${encodeURIComponent(encoded)}`;

    await navigator.clipboard.writeText(url);
    showToast('链接已复制');
    return true;
  } catch (err) {
    console.error('Failed to generate share link:', err);
    showToast('复制失败，请重试');
    return false;
  }
}

function showToast(message: string) {
  const existingToast = document.querySelector('.toast-message');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-message';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '100px',
    left: '50%',
    transform: 'translateX(-50%) translateY(20px)',
    backgroundColor: '#4A3F35',
    color: '#FFFAF0',
    padding: '12px 24px',
    borderRadius: '8px',
    fontFamily: "'Noto Sans SC', sans-serif",
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    zIndex: '9999',
    opacity: '0',
    transition: 'all 0.3s ease',
    pointerEvents: 'none'
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

export function parseShareData(): ShareData | null {
  const params = new URLSearchParams(window.location.search);
  const data = params.get('data');
  if (!data) return null;

  try {
    const decoded = decodeURIComponent(data);
    const jsonStr = decodeURIComponent(escape(atob(decoded)));
    return JSON.parse(jsonStr) as ShareData;
  } catch (err) {
    console.error('Failed to parse share data:', err);
    return null;
  }
}
