import React from 'react';
import {
  Square,
  Circle,
  Type,
  Image,
  MousePointer2,
  Link2,
  Play,
} from 'lucide-react';
import { usePrototypeStore } from '../../stores/prototypeStore';
import { useNavigate, useParams } from 'react-router-dom';

const tools = [
  { id: 'select', icon: MousePointer2, label: '选择' },
  { id: 'rectangle', icon: Square, label: '矩形' },
  { id: 'circle', icon: Circle, label: '圆形' },
  { id: 'text', icon: Type, label: '文本' },
  { id: 'image', icon: Image, label: '图片' },
  { id: 'button', icon: Square, label: '按钮' },
  { id: 'connection', icon: Link2, label: '连线' },
];

export const Toolbar: React.FC = () => {
  const { activeTool, setActiveTool } = usePrototypeStore();
  const navigate = useNavigate();
  const { id } = useParams();

  const handleToolClick = (toolId: string) => {
    if (toolId === 'select') {
      setActiveTool(null);
    } else {
      setActiveTool(activeTool === toolId ? null : toolId);
    }
  };

  const handlePreview = () => {
    navigate(`/project/${id}/preview`);
  };

  return (
    <div className="w-16 bg-slate-700 flex flex-col items-center py-4 gap-2">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive =
          (tool.id === 'select' && !activeTool) || activeTool === tool.id;
        return (
          <button
            key={tool.id}
            onClick={() => handleToolClick(tool.id)}
            className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 group relative ${
              isActive
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-300 hover:bg-slate-600 hover:text-white'
            }`}
            title={tool.label}
          >
            {tool.id === 'button' ? (
              <span className="text-sm font-medium px-2 py-0.5 border border-current rounded">
                Btn
              </span>
            ) : (
              <Icon size={20} />
            )}
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {tool.label}
            </span>
          </button>
        );
      })}

      <div className="flex-1" />

      <button
        onClick={handlePreview}
        className="w-12 h-12 rounded-lg flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-all duration-200 group relative"
        title="预览"
      >
        <Play size={20} />
        <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          预览原型
        </span>
      </button>
    </div>
  );
};
