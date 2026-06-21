import { useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Material } from '../types';

interface MaterialListProps {
  materials: Material[];
  onChange: (next: Material[]) => void;
}

function empty(): Material {
  return { id: uuidv4(), name: '', unitPrice: 0, quantity: 0, unit: '个' };
}

export default function MaterialList({ materials, onChange }: MaterialListProps) {
  const total = useMemo(
    () =>
      materials.reduce(
        (s, m) => s + (Number(m.unitPrice) || 0) * (Number(m.quantity) || 0),
        0,
      ),
    [materials],
  );

  const updateItem = (id: string, patch: Partial<Material>) => {
    onChange(
      materials.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };
  const addItem = () => onChange([...materials, empty()]);
  const removeItem = (id: string) => onChange(materials.filter((m) => m.id !== id));

  return (
    <div className="rounded-xl border border-[#334155] bg-[#1E293B] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#334155]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#F1F5F9]">物料清单</span>
          <span className="text-xs text-[#94A3B8]">共 {materials.length} 项</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#94A3B8]">总成本</span>
            <span className="mono-font text-2xl font-semibold text-[#10B981]">
              ¥{total.toFixed(2)}
            </span>
          </div>
          <button
            type="button"
            className="btn-secondary !px-3 !py-1.5 text-xs"
            onClick={addItem}
          >
            + 添加物料
          </button>
        </div>
      </div>

      <div className="max-h-[320px] overflow-y-auto scrollbar">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[#1E293B] z-10">
            <tr className="text-[12px] text-[#94A3B8] border-b border-[#334155]">
              <th className="text-left font-medium px-4 py-2 w-[28%]">物料名称</th>
              <th className="text-left font-medium px-3 py-2 w-[18%]">单价 (¥)</th>
              <th className="text-left font-medium px-3 py-2 w-[15%]">用量</th>
              <th className="text-left font-medium px-3 py-2 w-[13%]">单位</th>
              <th className="text-right font-medium px-4 py-2 w-[16%]">小计</th>
              <th className="text-center font-medium px-2 py-2 w-[10%]">操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[#64748B] text-xs"
                >
                  暂无物料，点击上方「添加物料」录入
                </td>
              </tr>
            ) : (
              materials.map((m) => {
                const sub =
                  (Number(m.unitPrice) || 0) * (Number(m.quantity) || 0);
                return (
                  <tr
                    key={m.id}
                    className="border-b border-[#334155]/60 hover:bg-[#263449]/50"
                  >
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        className="input-field !py-1.5 !px-3 text-sm"
                        placeholder="如：植鞣牛皮"
                        value={m.name}
                        onChange={(e) => updateItem(m.id, { name: e.target.value })}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field !py-1.5 !px-3 text-sm mono-font"
                        value={m.unitPrice}
                        onChange={(e) =>
                          updateItem(m.id, {
                            unitPrice: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field !py-1.5 !px-3 text-sm mono-font"
                        value={m.quantity}
                        onChange={(e) =>
                          updateItem(m.id, {
                            quantity: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        className="input-field !py-1.5 !px-3 text-sm"
                        placeholder="g/个/米"
                        value={m.unit}
                        onChange={(e) => updateItem(m.id, { unit: e.target.value })}
                      />
                    </td>
                    <td className="px-4 py-2 text-right mono-font text-[#10B981] font-medium">
                      ¥{sub.toFixed(2)}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        className="w-7 h-7 rounded-md text-[#94A3B8] hover:bg-[#EF4444]/10 hover:text-[#EF4444] transition-colors text-lg leading-none"
                        onClick={() => removeItem(m.id)}
                        title="删除"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
