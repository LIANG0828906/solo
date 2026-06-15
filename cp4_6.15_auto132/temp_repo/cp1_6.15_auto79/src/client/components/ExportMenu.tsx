import { useState, useRef, useEffect } from 'react';
import { Download, FileText, Music, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportMenuProps {
  projectId: string;
  projectName: string;
}

type ExportType = 'pdf' | 'midi';

const generatePdfBlob = (projectName: string) => {
  const content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 120 >>
stream
BT
/F1 24 Tf
100 720 Td
(${projectName} - Sheet Music) Tj
0 -40 Td
/F1 12 Tf
(Exported from Auto79) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000109 00000 n 
0000000211 00000 n 
0000000383 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
457
%%EOF`;
  return new Blob([content], { type: 'application/pdf' });
};

const generateMidiBlob = () => {
  const buffer = new ArrayBuffer(14 + 8 + 4 + 4 + 4);
  const view = new DataView(buffer);

  view.setUint8(0, 0x4d);
  view.setUint8(1, 0x54);
  view.setUint8(2, 0x68);
  view.setUint8(3, 0x64);
  view.setUint32(4, 6);
  view.setUint16(8, 0);
  view.setUint16(10, 1);
  view.setUint16(12, 480);

  view.setUint8(14, 0x4d);
  view.setUint8(15, 0x54);
  view.setUint8(16, 0x72);
  view.setUint8(17, 0x6b);
  view.setUint32(18, 4);
  view.setUint8(22, 0x00);
  view.setUint8(23, 0xff);
  view.setUint8(24, 0x2f);
  view.setUint8(25, 0x00);

  return new Blob([buffer], { type: 'audio/midi' });
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function ExportMenu({ projectId, projectName }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportType | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = (type: ExportType) => {
    setIsOpen(false);
    setExporting(type);

    setTimeout(() => {
      const safeName = projectName.replace(/[^\w\u4e00-\u9fa5-]/g, '_') || 'project';
      if (type === 'pdf') {
        const blob = generatePdfBlob(projectName);
        triggerDownload(blob, `${safeName}.pdf`);
      } else {
        const blob = generateMidiBlob();
        triggerDownload(blob, `${safeName}.mid`);
      }
      setExporting(null);
    }, 3000);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => !exporting && setIsOpen((prev) => !prev)}
        className={cn(
          'nav-icon-btn p-2 rounded-lg text-[var(--text-primary)]',
          'hover:bg-white/10 transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-white/20',
          exporting && 'cursor-wait'
        )}
        title="导出"
      >
        {exporting ? (
          <Loader2 className="w-5 h-5 spinner" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>

      {isOpen && !exporting && (
        <div
          className={cn(
            'absolute right-0 top-full mt-2 w-44 rounded-xl shadow-2xl',
            'bg-[var(--bg-secondary)] border border-white/10 overflow-hidden z-50',
            'card-enter'
          )}
        >
          <button
            onClick={() => handleExport('pdf')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-left',
              'text-[var(--text-primary)] hover:bg-white/10 transition-colors duration-150'
            )}
          >
            <FileText className="w-4 h-4 text-red-400" />
            <span className="text-sm">导出为 PDF</span>
          </button>
          <div className="h-px bg-white/5" />
          <button
            onClick={() => handleExport('midi')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 text-left',
              'text-[var(--text-primary)] hover:bg-white/10 transition-colors duration-150'
            )}
          >
            <Music className="w-4 h-4 text-purple-400" />
            <span className="text-sm">导出为 MIDI</span>
          </button>
        </div>
      )}
    </div>
  );
}
