import { useCallback } from 'react';
import { X } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';
import { MATERIALS, type MaterialType } from '@/materials/materialStore';

export default function MaterialPanel() {
  const currentMaterial = useEditorStore((s) => s.currentMaterial);
  const setMaterial = useEditorStore((s) => s.setMaterial);
  const showMaterialPanel = useEditorStore((s) => s.showMaterialPanel);
  const setShowMaterialPanel = useEditorStore((s) => s.setShowMaterialPanel);

  const handleSelect = useCallback(
    (type: MaterialType) => {
      setMaterial(type);
    },
    [setMaterial]
  );

  const handleClose = useCallback(() => {
    setShowMaterialPanel(false);
  }, [setShowMaterialPanel]);

  if (!showMaterialPanel) return null;

  return (
    <div
      className="w-[300px] rounded-xl border border-white/10 panel-glow flex flex-col"
      style={{
        backgroundColor: 'rgba(30, 30, 46, 0.9)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2
          className="text-sm font-semibold text-white tracking-wide"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          材质选择
        </h2>
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-3 overflow-y-auto flex-1 max-h-[calc(100vh-120px)] md:max-h-none">
        <div className="grid grid-cols-4 gap-2.5">
          {MATERIALS.map((mat) => {
            const isSelected = currentMaterial === mat.type;
            return (
              <button
                key={mat.type}
                onClick={() => handleSelect(mat.type)}
                className="material-card-transition flex flex-col items-center gap-1.5 group"
                style={{
                  transform: 'scale(1)',
                  transformOrigin: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <div
                  className="w-[60px] h-[60px] rounded-lg relative overflow-hidden transition-all duration-200"
                  style={{
                    border: isSelected
                      ? '2px solid rgba(255,255,255,1)'
                      : '2px solid rgba(255,255,255,0.1)',
                    boxShadow: isSelected
                      ? '0 0 20px rgba(255,255,255,0.4), 0 0 8px rgba(0,229,255,0.3)'
                      : 'none',
                    animation: isSelected ? 'pulse-glow 0.5s ease-in-out infinite' : 'none',
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[6px]"
                    style={{
                      backgroundColor: mat.color,
                      opacity: mat.opacity,
                      boxShadow:
                        mat.emissiveIntensity > 0
                          ? `inset 0 0 20px ${mat.color}80`
                          : 'none',
                    }}
                  />
                  {mat.emissiveIntensity > 0 && (
                    <div
                      className="absolute inset-0 rounded-[6px]"
                      style={{
                        background: `radial-gradient(circle at 30% 30%, ${mat.color}50, transparent 70%)`,
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0 rounded-[6px] transition-opacity duration-200"
                    style={{
                      background: `linear-gradient(135deg, rgba(255,255,255,${mat.roughness > 0.5 ? '0.06' : '0.2'}) 0%, transparent 50%, rgba(0,0,0,${mat.roughness > 0.5 ? '0.12' : '0.04'}) 100%)`,
                    }}
                  />
                  <div
                    className="absolute inset-0 rounded-[6px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    }}
                  />
                </div>
                <span
                  className="text-[9px] leading-tight text-center font-medium"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    color: isSelected ? '#00E5FF' : '#9CA3AF',
                    textShadow: isSelected ? '0 0 6px rgba(0,229,255,0.5)' : 'none',
                  }}
                >
                  {mat.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
