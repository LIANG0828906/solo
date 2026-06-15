import { useState } from 'react';
import { Dices, ChevronRight } from 'lucide-react';
import type { Material, MaterialCategory } from '@/types';
import { MATERIALS, CATEGORY_INFO, getRandomMaterial } from '@/data/materialData';

interface MaterialPanelProps {
  onRandomPick: (material: Material) => void;
  isDrawer?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

const CATEGORIES: MaterialCategory[] = ['nature', 'geometry', 'animal', 'abstract'];

export function MaterialPanel({
  onRandomPick,
  isDrawer = false,
  isOpen = true,
  onClose,
}: MaterialPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<MaterialCategory>>(
    new Set(CATEGORIES)
  );

  const toggleCategory = (category: MaterialCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleRandomPick = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const material = getRandomMaterial(category);
    onRandomPick(material);
  };

  const renderMaterialPreview = (material: Material) => (
    <svg
      viewBox={material.viewBox}
      fill={material.defaultColor}
      stroke={material.defaultColor}
      strokeWidth="1.5"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d={material.svgPath} />
    </svg>
  );

  const panelClass = `material-panel${isDrawer ? ' drawer' : ''}${isOpen ? ' open' : ''}`;

  return (
    <>
      {isDrawer && (
        <div
          className={`drawer-overlay${isOpen ? ' open' : ''}`}
          onClick={onClose}
        />
      )}
      <aside className={panelClass}>
        <div className="panel-header">
          <h1 className="panel-title">素材工坊</h1>
          <p className="panel-subtitle">点击骰子随机抽取灵感元素</p>
        </div>
        <div className="category-list">
          {CATEGORIES.map((category) => {
            const categoryMaterials = MATERIALS.filter((m) => m.category === category).slice(0, 6);
            const isExpanded = expandedCategories.has(category);
            const info = CATEGORY_INFO[category];

            return (
              <div key={category} className="category-section">
                <div
                  className="category-header"
                  onClick={() => toggleCategory(category)}
                >
                  <span className="category-title">
                    <span className="category-icon">{info.icon}</span>
                    {info.label}
                  </span>
                  <ChevronRight
                    className={`category-chevron${isExpanded ? ' expanded' : ''}`}
                    size={16}
                  />
                </div>
                <div
                  className={`category-content${isExpanded ? ' expanded' : ''}`}
                >
                  <div className="material-grid">
                    {categoryMaterials.map((material) => (
                      <div
                        key={material.id}
                        className="material-card"
                        title={material.name}
                      >
                        {renderMaterialPreview(material)}
                        <span className="material-name">{material.name}</span>
                        <button
                          className="dice-button"
                          onClick={(e) => handleRandomPick(category, e)}
                          title={`从${info.label}分类随机抽取`}
                        >
                          <Dices size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}
