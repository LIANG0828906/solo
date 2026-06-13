import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Calendar, DollarSign, FileText, ChevronDown } from 'lucide-react';
import { ExpenseService, CATEGORY_LIST, type Category } from '../services/ExpenseService';

const todayStr = () => {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function AddExpense() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('食品');
  const [date, setDate] = useState(todayStr());
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [rustleKey, setRustleKey] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setAmount('');
    setCategory('食品');
    setDate(todayStr());
    setNote('');
  };

  const triggerRustle = () => {
    setRustleKey((k) => k + 1);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCategory = (c: Category) => {
    setCategory(c);
    setDropdownOpen(false);
    triggerRustle();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('请输入正确的金额');
      setShakeKey((k) => k + 1);
      return;
    }
    if (!date) {
      setError('请选择日期');
      setShakeKey((k) => k + 1);
      return;
    }

    const result = ExpenseService.addExpense({
      amount: amt,
      category,
      date,
      note: note.trim(),
    });

    if (result) {
      setSuccess(true);
      triggerRustle();
      setTimeout(() => {
        navigate('/');
      }, 900);
    } else {
      setError('保存失败，请重试');
    }
  };

  const catInfo = CATEGORY_LIST.find((c) => c.name === category)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
      <div className="lg:col-span-2 fade-in">
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <span style={{ color: '#F5A623' }}>✍️</span> 添加一笔支出
          </h2>
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>记录每一笔家庭开销，养成良好记账习惯</p>

          <div
            key={`preview-${rustleKey}`}
            className={`mb-6 p-5 rounded-xl border-2 border-dashed ${rustleKey ? 'rustle-animation' : ''}`}
            style={{
              borderColor: catInfo.color + '66',
              background: catInfo.color + '12',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: catInfo.color + '22', boxShadow: `0 4px 10px ${catInfo.color}33` }}
                >
                  {catInfo.icon}
                </div>
                <div>
                  <div className="font-semibold" style={{ color: catInfo.color }}>{catInfo.name}</div>
                  <div className="text-xs" style={{ color: '#6B7280' }}>
                    {date ? ExpenseService.formatDateDisplay(date) : '请选择日期'}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: '#2D2D2D' }}>
                  {amount ? ExpenseService.formatMoney(parseFloat(amount) || 0) : '¥0.00'}
                </div>
                {note && <div className="text-xs mt-1 max-w-[150px] truncate" style={{ color: '#6B7280' }}>{note}</div>}
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} key={`form-${shakeKey}`} className={shakeKey ? 'shake-animation' : ''}>
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#374151' }}>
                <DollarSign size={16} style={{ color: '#F5A623' }} /> 金额（元）
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => { setAmount(e.target.value); triggerRustle(); }}
                placeholder="请输入金额，如 59.90"
                className="w-full px-4 py-3 rounded-xl border-2 border-orange-100 focus:border-orange-300 transition-all outline-none text-lg font-semibold"
                style={{ background: '#FFFCF7' }}
              />
            </div>

            <div className="mb-5" ref={dropdownRef}>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>类别</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen((v) => !v)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-between ${rustleKey ? 'rustle-animation' : ''}`}
                  style={{
                    background: catInfo.color + '12',
                    borderColor: dropdownOpen ? catInfo.color : catInfo.color + '44',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                      style={{ background: catInfo.color + '33' }}
                    >
                      {catInfo.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-semibold" style={{ color: catInfo.color }}>{catInfo.name}</div>
                      <div className="text-[11px]" style={{ color: '#9CA3AF' }}>点击切换类别</div>
                    </div>
                  </div>
                  <ChevronDown
                    size={20}
                    style={{ color: catInfo.color, transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease-out' }}
                  />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute z-20 top-full left-0 right-0 mt-2 rounded-xl overflow-hidden fade-in"
                    style={{
                      background: '#FFFFFF',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
                      border: '1px solid #F3F4F6',
                    }}
                  >
                    {CATEGORY_LIST.map((c) => {
                      const selected = c.name === category;
                      return (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => handleSelectCategory(c.name)}
                          className="w-full flex items-center gap-3 px-4 py-3 transition-all"
                          style={{
                            background: selected ? c.color + '15' : 'transparent',
                            borderBottom: '1px solid #F9FAFB',
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg"
                            style={{ background: c.color + '22' }}
                          >
                            {c.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-sm" style={{ color: c.color }}>{c.name}</div>
                            <div className="text-[11px]" style={{ color: '#9CA3AF' }}>点击选择此类别</div>
                          </div>
                          {selected && (
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center"
                              style={{ background: c.color }}
                            >
                              <Check size={14} color="#FFFFFF" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#374151' }}>
                <Calendar size={16} style={{ color: '#4A90D9' }} /> 日期
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); triggerRustle(); }}
                className="w-full px-4 py-3 rounded-xl border-2 border-blue-100 focus:border-blue-300 transition-all outline-none"
                style={{ background: '#FFFCF7' }}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#374151' }}>
                <FileText size={16} style={{ color: '#9B59B6' }} /> 备注（可选）
              </label>
              <textarea
                value={note}
                onChange={(e) => { setNote(e.target.value); triggerRustle(); }}
                rows={2}
                placeholder="添加一些说明，比如购物、聚餐等"
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-100 focus:border-purple-300 transition-all outline-none resize-none"
                style={{ background: '#FFFCF7' }}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm fade-in">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-2 bg-green-50 border border-green-200 text-green-600 text-sm pop-in">
                <Check size={16} /> 保存成功！正在返回看板...
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                className="btn btn-primary flex-1 text-base"
                disabled={success}
              >
                ✓ 保存支出
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn"
                style={{ background: '#F3F4F6', color: '#374151' }}
              >
                重置
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="lg:col-span-3 fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="card p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: '#2D2D2D' }}>
            <span>📖</span> 记账小贴士
          </h3>
          <div className="space-y-4">
            {[
              { icon: '🍽️', title: '及时记录', desc: '消费后立即记账，避免遗漏或记错金额' },
              { icon: '🏷️', title: '分类准确', desc: '选择正确的类别，便于后续统计分析' },
              { icon: '📝', title: '善用备注', desc: '在备注中记录消费细节，日后回忆更清晰' },
              { icon: '📊', title: '定期查看', desc: '每月查看报告，了解家庭支出情况' },
              { icon: '🎯', title: '设定目标', desc: '根据月度报告，合理规划下月预算' },
            ].map((tip, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: 'linear-gradient(90deg, #FFF7E6 0%, #FFFFFF 100%)' }}
              >
                <div className="text-2xl">{tip.icon}</div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>{tip.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{tip.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
