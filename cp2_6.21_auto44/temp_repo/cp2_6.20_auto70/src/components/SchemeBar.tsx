import { useLayoutStore } from '@/store/useLayoutStore';
import { X } from 'lucide-react';

export function SchemeBar() {
  const schemes = useLayoutStore((s) => s.schemes);
  const currentSchemeId = useLayoutStore((s) => s.currentSchemeId);
  const loadScheme = useLayoutStore((s) => s.loadScheme);
  const deleteScheme = useLayoutStore((s) => s.deleteScheme);

  if (schemes.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-20 z-10"
      style={{ background: 'rgba(0,0,0,0.4)' }}
    >
      <div className="h-full flex items-center gap-3 px-4 overflow-x-auto custom-scrollbar">
        {schemes.map((scheme) => (
          <div
            key={scheme.id}
            onClick={() => loadScheme(scheme.id)}
            className={`relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 group ${
              currentSchemeId === scheme.id
                ? 'ring-2 ring-accent-green scale-105'
                : 'ring-1 ring-white/10 hover:ring-white/20 hover:scale-105'
            }`}
            style={{
              width: 100,
              height: 60,
              transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
            }}
          >
            <img
              src={scheme.thumbnail}
              alt={scheme.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-between">
              <span className="text-[8px] text-white/90 font-medium truncate">
                {scheme.name}
              </span>
              <span className="font-mono text-[8px] text-accent-green">
                {(scheme.utilization * 100).toFixed(0)}%
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteScheme(scheme.id);
              }}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white/50 hover:text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <X size={10} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
