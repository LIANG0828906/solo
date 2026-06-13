import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, Calendar, DollarSign, FileText } from 'lucide-react';
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
  const [activeCatKey, setActiveCatKey] = useState<string | null>(null);

  const resetForm = () => {
    setAmount('');
    setCategory('食品');
    setDate(todayStr());
    setNote('');
  };

  const triggerRustle = () => {
    setRustleKey((k) => k + 1);
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

            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2" style={{ color: '#374151' }}>类别</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {CATEGORY_LIST.map((c) => {
                  const isActive = category === c.name;
                  const isRustling = activeCatKey === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        setCategory(c.name);
                        triggerRustle();
                        setActiveCatKey(c.name);
                        setTimeout(() => setActiveCatKey(null), 350);
                      }}
                      className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl transition-all duration-200 ${isRustling ? 'rustle-animation' : ''}`}
                      style={{
                        background: isActive ? c.color + '22' : '#FFFCF7',
                        border: `2px solid ${isActive ? c.color : 'transparent'}`,
                        transform: isActive ? 'scale(1.05)' : 'scale(1)',
                        boxShadow: isActive ? `0 4px 10px ${c.color}33` : 'none',
                      }}
                    >
                      <span className="text-xl">{c.icon}</span>
                      <span className="text-xs font-medium" style={{ color: c.color }}>{c.name}</span>
                    </button>
                  );
                })}
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
