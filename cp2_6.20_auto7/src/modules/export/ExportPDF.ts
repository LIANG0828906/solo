import axios from 'axios';
import { useResumeStore } from '@/store/resumeStore';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function exportPDF(): Promise<void> {
  const { components } = useResumeStore.getState();
  const payload = {
    components,
    layout: { width: 595, height: 842 },
  };

  try {
    const response = await axios.post(`${API_BASE}/api/export/pdf`, payload, {
      responseType: 'blob',
      timeout: 10000,
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume_${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('PDF export failed:', err);
    exportPDFClientFallback(components);
  }
}

function exportPDFClientFallback(components: ResumeComponent[]): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const componentHTML = components.map((comp) => {
    const bgStyle = comp.style.backgroundColor && comp.style.backgroundColor !== 'transparent'
      ? `background-color:${comp.style.backgroundColor};`
      : '';
    return `<div style="position:absolute;left:${comp.x}px;top:${comp.y}px;width:${comp.width}px;height:${comp.height}px;font-family:${comp.style.fontFamily};font-size:${comp.style.fontSize}px;color:${comp.style.color};${bgStyle}font-weight:${comp.style.fontWeight};padding:8px;white-space:pre-wrap;line-height:1.6;overflow:hidden;">${comp.content}</div>`;
  }).join('\n');

  printWindow.document.write(`<!DOCTYPE html><html><head><title>Resume</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap" rel="stylesheet"><style>@page{size:A4;margin:0;}body{margin:0;padding:0;}</style></head><body><div style="position:relative;width:595px;height:842px;">${componentHTML}</div><script>setTimeout(()=>{window.print();},500);</script></body></html>`);
  printWindow.document.close();
}

interface ResumeComponent {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontFamily: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
    fontWeight: string;
  };
}
