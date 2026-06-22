import { LeftPanel } from '@/components/LeftPanel';
import { CanvasArea } from '@/components/CanvasArea';
import { RightPanel } from '@/components/RightPanel';
import { useComponentStore } from '@/store/componentStore';
import { Upload, Info } from 'lucide-react';
import { useRef } from 'react';

function Navbar() {
  const importCharacter = useComponentStore((s) => s.importCharacter);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      importCharacter(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <nav
      className="flex items-center justify-between px-6"
      style={{
        height: 56,
        background: '#2A2A38',
      }}
    >
      <button
        onClick={handleImport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-white/80 text-sm rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200"
      >
        <Upload size={14} />
        导入角色
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />
      <div className="text-white text-base font-semibold tracking-wide">组件工坊</div>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-white/80 text-sm rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors duration-200">
        <Info size={14} />
        关于
      </button>
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#1E1E28' }}>
      <Navbar />
      <div className="flex-1 flex items-start justify-center p-4">
        <div
          className="flex gap-4 w-full"
          style={{ maxWidth: 1280 }}
        >
          <LeftPanel />
          <CanvasArea />
          <RightPanel />
        </div>
      </div>
    </div>
  );
}
