import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Network, Search, Trash2 } from 'lucide-react';

const menuItems = [
  { icon: FileText, label: '新笔记', path: '/editor/new' },
  { icon: Network, label: '图谱', path: '/graph' },
  { icon: Search, label: '搜索', path: '/search' },
  { icon: Trash2, label: '回收站', path: '/trash' },
] as const;

export default function FabMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleItemClick = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-end gap-2">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => handleItemClick(item.path)}
              className="animate-slide-up flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg transition-colors hover:bg-garden-warm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <item.icon size={18} className="text-garden-teal" />
              <span className="text-sm text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-garden-teal text-white shadow-lg transition-transform duration-300 hover:shadow-xl ${open ? 'rotate-45' : 'rotate-0'}`}
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
