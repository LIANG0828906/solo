import html2canvas from 'html2canvas';

export interface ExportOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  filename?: string;
}

export async function exportCanvasToPng(
  element: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const {
    width = 1920,
    height = 1080,
    backgroundColor = '#1A1A2E',
    filename = `poetic-canvas-${Date.now()}.png`,
  } = options;

  const canvas = await html2canvas(element, {
    width,
    height,
    scale: Math.min(2, window.devicePixelRatio || 1),
    backgroundColor,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export function showToast(message: string, duration = 2000): void {
  const existingToast = document.querySelector('.poetic-toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'poetic-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.8);
    color: #E0E0E0;
    padding: 16px 32px;
    border-radius: 8px;
    font-size: 16px;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  `;

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

export function createLoadingOverlay(): HTMLElement {
  const overlay = document.createElement('div');
  overlay.className = 'poetic-export-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;

  const spinner = document.createElement('div');
  spinner.style.cssText = `
    width: 50px;
    height: 50px;
    border: 4px solid rgba(233, 69, 96, 0.3);
    border-top-color: #E94560;
    border-radius: 50%;
    animation: poetic-spin 3s linear infinite;
  `;

  const style = document.createElement('style');
  style.textContent = `
    @keyframes poetic-spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  overlay.appendChild(spinner);
  document.body.appendChild(overlay);

  requestAnimationFrame(() => {
    overlay.style.opacity = '1';
  });

  return overlay;
}

export function removeLoadingOverlay(overlay: HTMLElement): void {
  overlay.style.opacity = '0';
  setTimeout(() => {
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }, 300);
}
