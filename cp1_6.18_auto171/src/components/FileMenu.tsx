import { useEffect, useRef, useState } from 'react';
import { Menu, Download } from 'lucide-react';

interface FileMenuProps {
  onExport: () => void;
}

export default function FileMenu({ onExport }: FileMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-[60px] h-[48px] flex items-center justify-center bg-[#2C2C2C] hover:bg-[#3C3C3C] transition duration-200"
      >
        <Menu size={24} className="text-white" />
      </button>
      {open && (
        <div className="absolute top-full left-0 bg-white rounded-lg shadow-lg py-1 min-w-[160px] z-50">
          <button
            onClick={() => {
              setOpen(false);
              onExport();
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[#333333] hover:bg-gray-100 transition duration-150"
          >
            <Download size={16} />
            导出为图片
          </button>
        </div>
      )}
    </div>
  );
}
