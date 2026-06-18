import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { usePrototypeStore } from '../../stores/prototypeStore';
import type { ComponentInteraction } from '../../types';

interface PropertyPanelProps {
  selectedComponentId: string | null;
  onClose?: () => void;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  selectedComponentId,
  onClose,
}) => {
  const {
    components,
    screens,
    currentProjectId,
    updateComponent,
    setComponentInteraction,
    deleteComponent,
  } = usePrototypeStore();

  const [expandedSections, setExpandedSections] = useState({
    position: true,
    style: true,
    interaction: true,
  });

  const selectedComponent = components.find(
    (c) => c.id === selectedComponentId
  );

  const projectScreens = screens.filter(
    (s) => s.projectId === currentProjectId
  );

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (field: string, value: string | number) => {
    if (!selectedComponentId) return;
    updateComponent(selectedComponentId, { [field]: value });
  };

  const handleInteractionChange = (interaction: ComponentInteraction | undefined) => {
    if (!selectedComponentId) return;
    setComponentInteraction(selectedComponentId, interaction);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedComponentId && document.activeElement?.tagName !== 'INPUT') {
          deleteComponent(selectedComponentId);
        }
      }
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, deleteComponent, onClose]);

  if (!selectedComponent) {
    return (
      <div className="w-64 bg-slate-50 rounded-xl p-5 border border-slate-200">
        <div className="text-center text-slate-400 py-12">
          <div className="text-4xl mb-3">🎨</div>
          <p className="text-sm">选择一个组件查看属性</p>
        </div>
      </div>
    );
  }

  const SectionHeader = ({
    title,
    section,
    icon,
  }: {
    title: string;
    section: keyof typeof expandedSections;
    icon?: React.ReactNode;
  }) => (
    <button
      onClick={() => toggleSection(section)}
      className="w-full flex items-center justify-between py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
    >
      <div className="flex items-center gap-2">
        {icon}
        {title}
      </div>
      {expandedSections[section] ? (
        <ChevronUp size={16} />
      ) : (
        <ChevronDown size={16} />
      )}
    </button>
  );

  const InputRow = ({
    label,
    field,
    value,
    type = 'text',
    min,
    max,
  }: {
    label: string;
    field: string;
    value: string | number;
    type?: string;
    min?: number;
    max?: number;
  }) => (
    <div className="flex items-center gap-2">
      <label className="w-16 text-xs text-slate-500 text-right">{label}</label>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) =>
          handleChange(field, type === 'number' ? Number(e.target.value) : e.target.value)
        }
        className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
      />
    </div>
  );

  return (
    <div className="w-64 bg-slate-50 rounded-xl border border-slate-200 flex flex-col max-h-full overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">属性面板</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded transition-colors"
          >
            <X size={16} className="text-slate-500" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="pb-3 border-b border-slate-200">
          <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            组件类型
          </div>
          <div className="font-medium text-slate-700 capitalize">
            {selectedComponent.type === 'rectangle' && '矩形'}
            {selectedComponent.type === 'circle' && '圆形'}
            {selectedComponent.type === 'text' && '文本'}
            {selectedComponent.type === 'image' && '图片'}
            {selectedComponent.type === 'button' && '按钮'}
          </div>
        </div>

        <div>
          <SectionHeader title="位置与尺寸" section="position" />
          {expandedSections.position && (
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <InputRow label="X" field="x" value={selectedComponent.x} type="number" />
                <InputRow label="Y" field="y" value={selectedComponent.y} type="number" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputRow
                  label="宽"
                  field="width"
                  value={selectedComponent.width}
                  type="number"
                  min={20}
                />
                <InputRow
                  label="高"
                  field="height"
                  value={selectedComponent.height}
                  type="number"
                  min={20}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <SectionHeader title="样式" section="style" />
          {expandedSections.style && (
            <div className="pt-2 space-y-3">
              <InputRow label="背景色" field="backgroundColor" value={selectedComponent.backgroundColor} />
              <InputRow label="边框色" field="borderColor" value={selectedComponent.borderColor} />
              <InputRow
                label="圆角"
                field="borderRadius"
                value={selectedComponent.borderRadius}
                type="number"
                min={0}
              />
              {(selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
                <>
                  <InputRow
                    label="字号"
                    field="fontSize"
                    value={selectedComponent.fontSize || 14}
                    type="number"
                    min={12}
                  />
                  <div className="flex items-center gap-2">
                    <label className="w-16 text-xs text-slate-500 text-right">字重</label>
                    <select
                      value={selectedComponent.fontWeight || 'normal'}
                      onChange={(e) => handleChange('fontWeight', e.target.value)}
                      className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    >
                      <option value="normal">正常</option>
                      <option value="500">中等</option>
                      <option value="600">半粗</option>
                      <option value="700">粗体</option>
                    </select>
                  </div>
                </>
              )}
              {(selectedComponent.type === 'text' || selectedComponent.type === 'button') && (
                <div className="flex items-center gap-2">
                  <label className="w-16 text-xs text-slate-500 text-right">文本</label>
                  <input
                    type="text"
                    value={selectedComponent.text || ''}
                    onChange={(e) => handleChange('text', e.target.value)}
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
              {selectedComponent.type === 'image' && (
                <div className="flex items-center gap-2">
                  <label className="w-16 text-xs text-slate-500 text-right">图片</label>
                  <input
                    type="text"
                    value={selectedComponent.imageUrl || ''}
                    onChange={(e) => handleChange('imageUrl', e.target.value)}
                    placeholder="输入图片URL"
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <SectionHeader
            title="交互动作"
            section="interaction"
            icon={<Zap size={14} className="text-purple-500" />}
          />
          {expandedSections.interaction && (
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-2">
                <label className="w-16 text-xs text-slate-500 text-right">类型</label>
                <select
                  value={selectedComponent.interaction?.type || 'none'}
                  onChange={(e) => {
                    if (e.target.value === 'none') {
                      handleInteractionChange(undefined);
                    } else {
                      handleInteractionChange({
                        type: e.target.value as 'navigate' | 'modal' | 'animation',
                        targetScreenId: projectScreens[0]?.id,
                      });
                    }
                  }}
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                >
                  <option value="none">无</option>
                  <option value="navigate">跳转到屏幕</option>
                  <option value="modal">显示弹窗</option>
                  <option value="animation">触发动画</option>
                </select>
              </div>
              {selectedComponent.interaction?.type === 'navigate' && (
                <div className="flex items-center gap-2">
                  <label className="w-16 text-xs text-slate-500 text-right">目标</label>
                  <select
                    value={selectedComponent.interaction.targetScreenId || ''}
                    onChange={(e) =>
                      handleInteractionChange({
                        ...selectedComponent.interaction!,
                        targetScreenId: e.target.value,
                      })
                    }
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    {projectScreens.map((screen) => (
                      <option key={screen.id} value={screen.id}>
                        {screen.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedComponent.interaction?.type === 'modal' && (
                <div className="flex items-center gap-2">
                  <label className="w-16 text-xs text-slate-500 text-right">内容</label>
                  <textarea
                    value={selectedComponent.interaction.modalContent || ''}
                    onChange={(e) =>
                      handleInteractionChange({
                        ...selectedComponent.interaction!,
                        modalContent: e.target.value,
                      })
                    }
                    placeholder="弹窗内容..."
                    rows={2}
                    className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => selectedComponentId && deleteComponent(selectedComponentId)}
          className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          删除组件
        </button>
      </div>
    </div>
  );
};
