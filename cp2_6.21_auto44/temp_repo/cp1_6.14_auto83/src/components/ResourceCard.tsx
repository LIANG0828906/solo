import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileImage, Layers } from 'lucide-react';
import type { Resource } from '../types';
import { resourceTypeLabels } from '../types';
import { clsx } from 'clsx';

interface ResourceCardProps {
  resource: Resource;
  index?: number;
}

export default function ResourceCard({ resource, index = 0 }: ResourceCardProps) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const typeIcons: Record<string, JSX.Element> = {
    sprite: <Layers size={14} />,
    background: <FileImage size={14} />,
    ui: <FileImage size={14} />,
    audio: <FileImage size={14} />,
  };

  const handleClick = () => {
    navigate(`/resources/${resource.id}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div
      onClick={handleClick}
      className={clsx(
        'card cursor-pointer group transition-all duration-300',
        'hover:-translate-y-2 hover:shadow-[0_20px_40px_-12px_rgba(16,185,129,0.15)]',
        'animate-slide-up',
      )}
      style={{ animationDelay: `${Math.min(index * 40, 600)}ms` }}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-800">
        {!loaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-surface-600 border-t-brand-500 rounded-full animate-spin" />
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-800 text-surface-500">
            <FileImage size={40} className="mb-2 opacity-50 animate-spin-slow" />
            <span className="text-xs">加载失败</span>
          </div>
        ) : (
          <img
            src={resource.thumbnailUrl}
            alt={resource.name}
            onLoad={() => setLoaded(true)}
            onError={() => setError(true)}
            className={clsx(
              'w-full h-full object-cover transition-all duration-500',
              'group-hover:scale-110',
              loaded ? 'opacity-100 animate-fade-in' : 'opacity-0',
            )}
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="text-sm font-semibold truncate">{resource.name}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-surface-200">
              <Calendar size={12} />
              <span>{formatDate(resource.updatedAt)} 修改</span>
            </div>
          </div>
        </div>
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-surface-900/70 backdrop-blur-sm text-white text-xs flex items-center gap-1">
          {typeIcons[resource.type]}
          <span>{resourceTypeLabels[resource.type]}</span>
        </div>
        {resource.versionCount > 1 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-brand-500/90 text-white text-xs font-medium">
            v{resource.versionCount}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-surface-100 truncate text-sm">{resource.name}</h3>
        <div className="flex items-center justify-between mt-1.5 text-xs text-surface-400">
          <span>{resource.width}×{resource.height}</span>
          <span>{formatSize(resource.size)}</span>
        </div>
      </div>
    </div>
  );
}
