import { useState } from 'react';
import { Upload, Type, Palette, MessageSquare, MousePointer2, Plus, Trash2 } from 'lucide-react';
import { useStoryStore } from '../store/useStoryStore';
import { parseCSV } from '../utils/csvParser';
import type { DataPoint, DataPointInteraction } from '../types';

export default function PropertyPanel() {
  const [activeTab, setActiveTab] = useState<'data' | 'style' | 'notes' | 'interactions'>('data');
  const selectedSlideId = useStoryStore((state) => state.selectedSlideId);
  const story = useStoryStore((state) => state.story);
  const updateChartConfig = useStoryStore((state) => state.updateChartConfig);
  const updateSlide = useStoryStore((state) => state.updateSlide);
  const importCSVData = useStoryStore((state) => state.importCSVData);

  const selectedSlide = story.slides.find((s) => s.id === selectedSlideId);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSlideId) return;

    try {
      const text = await file.text();
      const data = parseCSV(text);
      if (data.length > 0) {
        importCSVData(selectedSlideId, data as DataPoint[]);
      }
    } catch (err) {
      console.error('CSV导入失败:', err);
    }
    e.target.value = '';
  };

  const handleAddInteraction = () => {
    if (!selectedSlideId) return;
    const newInteraction: DataPointInteraction = {
      dataIndex: 0,
      eventName: '新交互事件',
      description: '点击该数据点时显示的描述内容',
      imageUrl: '',
    };
    const newInteractions = [...(selectedSlide?.interactions || []), newInteraction];
    updateSlide(selectedSlideId, { interactions: newInteractions });
  };

  const handleRemoveInteraction = (index: number) => {
    if (!selectedSlideId) return;
    const newInteractions = selectedSlide?.interactions.filter((_, i) => i !== index) || [];
    updateSlide(selectedSlideId, { interactions: newInteractions });
  };

  const handleUpdateInteraction = (index: number, updates: Partial<DataPointInteraction>) => {
    if (!selectedSlideId || !selectedSlide) return;
    const newInteractions = [...selectedSlide.interactions];
    newInteractions[index] = { ...newInteractions[index], ...updates };
    updateSlide(selectedSlideId, { interactions: newInteractions });
  };

  const tabs = [
    { id: 'data', label: '数据', icon: Type },
    { id: 'style', label: '样式', icon: Palette },
    { id: 'notes', label: '注释', icon: MessageSquare },
    { id: 'interactions', label: '交互', icon: MousePointer2 },
  ] as const;

  if (!selectedSlide || !selectedSlideId) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">属性面板</h2>
        </div>
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center">
          选择一个幻灯片以编辑其属性
        </div>
      </div>
    );
  }

  const currentSlideId = selectedSlideId;

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">属性面板</h2>
      </div>

      <div className="flex border-b border-gray-100">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'text-[#1A237E] border-b-2 border-[#1A237E] bg-[#1A237E]/5'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'data' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图表标题
              </label>
              <input
                type="text"
                value={selectedSlide.chartConfig.title}
                onChange={(e) =>
                  updateChartConfig(currentSlideId, { title: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X轴标签
              </label>
              <input
                type="text"
                value={selectedSlide.chartConfig.xAxisLabel}
                onChange={(e) =>
                  updateChartConfig(currentSlideId, { xAxisLabel: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y轴标签
              </label>
              <input
                type="text"
                value={selectedSlide.chartConfig.yAxisLabel}
                onChange={(e) =>
                  updateChartConfig(currentSlideId, { yAxisLabel: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                导入CSV数据
              </label>
              <label className="flex items-center justify-center gap-2 w-full px-3 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#1A237E] hover:bg-[#1A237E]/5 transition-colors">
                <Upload size={16} className="text-gray-500" />
                <span className="text-sm text-gray-600">点击选择CSV文件</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">
                CSV格式：第一列为X轴，第二列为Y轴
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                数据预览 ({selectedSlide.chartConfig.data.length} 条)
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-2 py-1 text-left text-gray-600">X</th>
                      <th className="px-2 py-1 text-left text-gray-600">Y</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSlide.chartConfig.data.slice(0, 10).map((d, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-2 py-1 text-gray-800">{String(d.x)}</td>
                        <td className="px-2 py-1 text-gray-800">{d.y}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">显示图例</label>
              <button
                onClick={() =>
                  updateChartConfig(currentSlideId, {
                    showLegend: !selectedSlide.chartConfig.showLegend,
                  })
                }
                className={`w-10 h-5 rounded-full transition-colors ${
                  selectedSlide.chartConfig.showLegend
                    ? 'bg-[#1A237E]'
                    : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    selectedSlide.chartConfig.showLegend
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                过渡动画
              </label>
              <div className="flex gap-2">
                {(['fade', 'slide'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSlide(currentSlideId, { transition: t })}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      selectedSlide.transition === t
                        ? 'bg-[#1A237E] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t === 'fade' ? '淡入' : '滑动'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                图表颜色
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedSlide.chartConfig.colors.map((color, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...selectedSlide.chartConfig.colors];
                        newColors[i] = e.target.value;
                        updateChartConfig(currentSlideId, { colors: newColors });
                      }}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Markdown 注释
              </label>
              <textarea
                value={selectedSlide.notes}
                onChange={(e) =>
                  updateSlide(currentSlideId, { notes: e.target.value })
                }
                placeholder="支持 Markdown 格式\n\n## 标题\n\n**粗体** *斜体*\n\n- 列表项"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E] resize-none"
              />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">
                支持标题、粗体、斜体、列表等 Markdown 语法。
              </p>
            </div>
          </div>
        )}

        {activeTab === 'interactions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                数据点交互 ({selectedSlide.interactions.length}/3)
              </label>
              <button
                onClick={handleAddInteraction}
                disabled={selectedSlide.interactions.length >= 3}
                className="flex items-center gap-1 px-2 py-1 bg-[#1A237E] text-white text-xs rounded hover:bg-[#3949AB] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={14} />
                添加
              </button>
            </div>

            {selectedSlide.interactions.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                暂无交互事件，点击上方按钮添加
              </div>
            )}

            {selectedSlide.interactions.map((interaction, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#1A237E]">
                    交互 #{index + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveInteraction(index)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    数据点索引
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedSlide.chartConfig.data.length - 1}
                    value={interaction.dataIndex}
                    onChange={(e) =>
                      handleUpdateInteraction(index, {
                        dataIndex: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    事件名称
                  </label>
                  <input
                    type="text"
                    value={interaction.eventName}
                    onChange={(e) =>
                      handleUpdateInteraction(index, { eventName: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E]"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    描述
                  </label>
                  <textarea
                    value={interaction.description}
                    onChange={(e) =>
                      handleUpdateInteraction(index, { description: e.target.value })
                    }
                    placeholder="点击该数据点时显示的描述内容"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E] resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    图片URL
                  </label>
                  <input
                    type="text"
                    value={interaction.imageUrl}
                    onChange={(e) =>
                      handleUpdateInteraction(index, { imageUrl: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1A237E]/30 focus:border-[#1A237E]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
