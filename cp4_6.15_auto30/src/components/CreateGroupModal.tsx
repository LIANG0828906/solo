import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useGroupStore } from '../store/useGroupStore';
import { useNavigate } from 'react-router-dom';

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const addGroup = useGroupStore((s) => s.addGroup);
  const currentUser = useGroupStore((s) => s.currentUser);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 16),
  );
  const [maxMembers, setMaxMembers] = useState(20);
  const [freight, setFreight] = useState(15);
  const [products, setProducts] = useState([
    { name: '', unitPrice: 0, specifications: [{ label: '', stock: 0 }] },
  ]);
  const [error, setError] = useState('');

  const updateProduct = (idx: number, patch: Partial<(typeof products)[number]>) => {
    setProducts((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  };
  const addProduct = () =>
    setProducts((prev) => [...prev, { name: '', unitPrice: 0, specifications: [{ label: '', stock: 0 }] }]);
  const removeProduct = (idx: number) =>
    setProducts((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const updateSpec = (pIdx: number, sIdx: number, patch: { label?: string; stock?: number }) => {
    setProducts((prev) =>
      prev.map((p, i) =>
        i !== pIdx
          ? p
          : {
              ...p,
              specifications: p.specifications.map((s, j) => (j === sIdx ? { ...s, ...patch } : s)),
            },
      ),
    );
  };
  const addSpec = (pIdx: number) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i === pIdx ? { ...p, specifications: [...p.specifications, { label: '', stock: 0 }] } : p,
      ),
    );
  const removeSpec = (pIdx: number, sIdx: number) =>
    setProducts((prev) =>
      prev.map((p, i) =>
        i === pIdx && p.specifications.length > 1
          ? { ...p, specifications: p.specifications.filter((_, j) => j !== sIdx) }
          : p,
      ),
    );

  const submit = () => {
    setError('');
    if (!title.trim()) return setError('请填写团购标题');
    if (new Date(deadline).getTime() <= Date.now()) return setError('截止时间需晚于当前时间');
    if (maxMembers < 1) return setError('最多参团人数需大于0');
    if (freight < 0) return setError('运费不能为负');

    for (const p of products) {
      if (!p.name.trim()) return setError('请填写商品名称');
      if (p.unitPrice <= 0) return setError('商品单价需大于0');
      for (const sp of p.specifications) {
        if (!sp.label.trim()) return setError('请填写规格名称');
        if (sp.stock < 0) return setError('库存不能为负');
      }
    }

    const group = addGroup({
      title: title.trim(),
      deadline,
      maxMembers,
      freight,
      creator: currentUser,
      products: products.map((p) => ({
        name: p.name.trim(),
        unitPrice: p.unitPrice,
        specifications: p.specifications.map((s) => ({ label: s.label.trim(), stock: s.stock })),
      })),
    });
    onClose();
    navigate('/group/' + group.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream-900/40 backdrop-blur-sm p-4 no-print">
      <div className="modal-animate bg-cream-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-cream-50 border-b border-cream-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-cream-800">发起新团购</h2>
          <button onClick={onClose} className="btn-scale p-2 hover:bg-cream-100 rounded-lg text-cream-600">
            <X size={22} />
          </button>
        </div>
        <div className="p-6 space-y-5 text-cream-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1">团购标题</label>
              <div className="input-field-wrapper">
                <input
                  className="input-field w-full"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="如：进口刺绣线60色套装拼单"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">截止时间</label>
              <div className="input-field-wrapper">
                <input
                  type="datetime-local"
                  className="input-field w-full"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">运费 (元)</label>
              <div className="input-field-wrapper">
                <input
                  type="number"
                  min="0"
                  className="input-field w-full"
                  value={freight}
                  onChange={(e) => setFreight(+e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">最多参团人数</label>
              <div className="input-field-wrapper">
                <input
                  type="number"
                  min="1"
                  className="input-field w-full"
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(+e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-lg text-cream-800">商品信息</h3>
              <button
                onClick={addProduct}
                className="btn-scale text-sm px-3 py-1.5 rounded-full bg-cream-200 hover:bg-cream-300 text-cream-800 flex items-center gap-1"
              >
                <Plus size={16} /> 添加商品
              </button>
            </div>
            <div className="space-y-4">
              {products.map((p, pIdx) => (
                <div key={pIdx} className="border border-cream-200 rounded-xl p-4 bg-cream-100/60">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium mb-1">商品名称</label>
                        <div className="input-field-wrapper">
                          <input
                            className="input-field w-full"
                            value={p.name}
                            onChange={(e) => updateProduct(pIdx, { name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">单价 (元)</label>
                        <div className="input-field-wrapper">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="input-field w-full"
                            value={p.unitPrice || ''}
                            onChange={(e) => updateProduct(pIdx, { unitPrice: +e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeProduct(pIdx)}
                      className="btn-scale ml-3 p-1.5 text-cream-500 hover:text-red-500 rounded-lg"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-cream-600">规格 & 库存</span>
                      <button
                        onClick={() => addSpec(pIdx)}
                        className="btn-scale text-xs px-2 py-1 rounded-md bg-cream-200/70 hover:bg-cream-300 text-cream-700"
                      >
                        + 添加规格
                      </button>
                    </div>
                    {p.specifications.map((sp, sIdx) => (
                      <div key={sIdx} className="flex gap-2 items-center">
                        <div className="input-field-wrapper flex-1">
                          <input
                            className="input-field w-full text-sm"
                            value={sp.label}
                            placeholder="规格名称（如：莫兰迪色）"
                            onChange={(e) => updateSpec(pIdx, sIdx, { label: e.target.value })}
                          />
                        </div>
                        <div className="input-field-wrapper w-24">
                          <input
                            type="number"
                            min="0"
                            className="input-field w-full text-sm text-right"
                            value={sp.stock || ''}
                            placeholder="库存"
                            onChange={(e) => updateSpec(pIdx, sIdx, { stock: +e.target.value })}
                          />
                        </div>
                        <button
                          onClick={() => removeSpec(pIdx, sIdx)}
                          className="btn-scale p-1.5 text-cream-500 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 bg-cream-50 border-t border-cream-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-scale px-5 py-2 rounded-xl border border-cream-300 text-cream-700 hover:bg-cream-100"
          >
            取消
          </button>
          <button
            onClick={submit}
            className="btn-scale px-6 py-2 rounded-xl bg-gradient-to-r from-cream-500 to-cream-700 text-cream-50 font-medium shadow-md hover:shadow-lg"
          >
            发起团购
          </button>
        </div>
      </div>
    </div>
  );
}
