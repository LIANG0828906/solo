import html2canvas from 'html2canvas';
import { useBoardStore } from '@/store/boardStore';

export async function exportBoard(canvasRef: HTMLElement): Promise<void> {
  const store = useBoardStore.getState();
  store.setExporting(true);

  try {
    const canvas = await html2canvas(canvasRef, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    });

    const link = document.createElement('a');
    link.download = 'moodboard.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    store.setExporting(false);
  }
}
