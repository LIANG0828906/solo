import { useState, useMemo } from 'react';
import type { Work, QuoteRequest } from '@/types';
import PriceDisplay from './PriceDisplay';
import RippleButton from './RippleButton';
import { useToastStore } from '@/store/toast';
import { submitQuote, downloadBlob } from '@/services/BackendModule';

interface QuoteCalculatorProps {
  work: Work;
}

export default function QuoteCalculator({ work }: QuoteCalculatorProps) {
  const [woodGradeId, setWoodGradeId] = useState(work.woodGrades[0].id);
  const [carvingId, setCarvingId] = useState(work.carvingComplexity[0].id);
  const [accessoryIds, setAccessoryIds] = useState<string[]>([]);
  const [urgent, setUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore((s) => s.addToast);

  const totalPrice = useMemo(() => {
    const woodGrade = work.woodGrades.find(g => g.id === woodGradeId) || work.woodGrades[0];
    const carving = work.carvingComplexity.find(c => c.id === carvingId) || work.carvingComplexity[0];
    const accessories = work.accessories.filter(a => accessoryIds.includes(a.id));
    const baseWithWood = work.basePrice * woodGrade.priceMultiplier;
    const accessoryTotal = accessories.reduce((sum, a) => sum + a.price, 0);
    const urgentFee = urgent ? work.basePrice * 0.3 : 0;
    return Math.round((baseWithWood + carving.priceAddition + accessoryTotal + urgentFee) * 100) / 100;
  }, [work, woodGradeId, carvingId, accessoryIds, urgent]);

  const btnColorClass = useMemo(() => {
    if (totalPrice < 500) return 'bg-green-500 hover:bg-green-600';
    if (totalPrice <= 2000) return 'bg-sky-500 hover:bg-sky-600';
    return 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600';
  }, [totalPrice]);

  const toggleAccessory = (id: string) => {
    setAccessoryIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGenerateQuote = async () => {
    const request: QuoteRequest = {
      workId: work.id,
      woodGradeId,
      carvingComplexityId: carvingId,
      accessoryIds,
      urgent,
    };

    setLoading(true);
    try {
      const blob = await submitQuote(request);
      downloadBlob(blob, `报价单-${work.name}.pdf`);
      addToast('报价单已保存', 'success');
    } catch {
      addToast('报价单生成失败，请重试', 'error');
    } finally {
      setLoading(false);
    }
  };

  const priceBreakdown = useMemo(() => {
    const woodGrade = work.woodGrades.find(g => g.id === woodGradeId) || work.woodGrades[0];
    const carving = work.carvingComplexity.find(c => c.id === carvingId) || work.carvingComplexity[0];
    const accessories = work.accessories.filter(a => accessoryIds.includes(a.id));
    const baseWithWood = work.basePrice * woodGrade.priceMultiplier;
    const accessoryTotal = accessories.reduce((sum, a) => sum + a.price, 0);
    const urgentFee = urgent ? work.basePrice * 0.3 : 0;

    const breakdown = [];
    breakdown.push({ label: '作品基价', value: work.basePrice, note: '固定价格' });
    breakdown.push({ label: `${woodGrade.name}`, value: baseWithWood - work.basePrice, note: `基价 × ${woodGrade.priceMultiplier} 乘数` });
    if (carving.priceAddition > 0) {
      breakdown.push({ label: `${carving.name}`, value: carving.priceAddition, note: '固定加价' });
    }
    accessories.forEach(a => {
      breakdown.push({ label: a.name, value: a.price, note: '固定加价' });
    });
    if (urgentFee > 0) {
      breakdown.push({ label: '加急制作', value: urgentFee, note: `基价 × 30%` });
    }
    return breakdown;
  }, [work, woodGradeId, carvingId, accessoryIds, urgent]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-card p-5 shadow-warm">
        <h3 className="font-display text-lg font-semibold text-walnut mb-4">定制选项</h3>

        <div className="space-y-5">
          <div>
            <label className="block font-body text-sm font-medium text-oak-dark/70 mb-2">
              木料等级
            </label>
            <select
              value={woodGradeId}
              onChange={(e) => setWoodGradeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-btn border-2 border-oak-light/30 bg-cream/50 font-body text-sm text-walnut focus:border-oak-dark focus:outline-none transition-colors duration-300"
            >
              {work.woodGrades.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}（×{g.priceMultiplier}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-oak-dark/70 mb-2">
              雕刻复杂度
            </label>
            <select
              value={carvingId}
              onChange={(e) => setCarvingId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-btn border-2 border-oak-light/30 bg-cream/50 font-body text-sm text-walnut focus:border-oak-dark focus:outline-none transition-colors duration-300"
            >
              {work.carvingComplexity.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.priceAddition > 0 ? `（+¥${c.priceAddition}）` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-body text-sm font-medium text-oak-dark/70 mb-2">
              配件选项
            </label>
            <div className="space-y-2">
              {work.accessories.map((a) => (
                <label
                  key={a.id}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-btn border-2 cursor-pointer
                    transition-all duration-300 font-body text-sm
                    ${accessoryIds.includes(a.id)
                      ? 'border-oak-dark bg-oak-light/10 text-walnut'
                      : 'border-oak-light/20 bg-white text-oak-dark/70 hover:border-oak-light/40'
                    }
                  `}
                >
                  <input
                    type="checkbox"
                    checked={accessoryIds.includes(a.id)}
                    onChange={() => toggleAccessory(a.id)}
                    className="sr-only"
                  />
                  <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
                    accessoryIds.includes(a.id)
                      ? 'bg-oak-dark border-oak-dark'
                      : 'border-oak-light/40'
                  }`}>
                    {accessoryIds.includes(a.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="flex-1">{a.name}</span>
                  <span className="text-oak-dark/50">+¥{a.price}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 px-4 py-2.5 rounded-btn border-2 border-oak-light/20 bg-white cursor-pointer transition-all duration-300 hover:border-oak-light/40 font-body text-sm text-oak-dark/70">
            <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-300 ${
              urgent ? 'bg-oak-dark border-oak-dark' : 'border-oak-light/40'
            }`}>
              {urgent && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="sr-only"
            />
            <span className="flex-1">加急制作（30%加急费）</span>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-card p-5 shadow-warm">
        <div className="flex items-center justify-between mb-4">
          <span className="font-body text-sm text-oak-dark/60">预估总价</span>
          <PriceDisplay value={totalPrice} />
        </div>

        <div className="border-t border-oak-light/20 pt-4 mb-4">
          <h4 className="font-body text-sm font-medium text-oak-dark/70 mb-3">价格构成说明</h4>
          <div className="space-y-2">
            {priceBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between font-body text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-walnut">{item.label}</span>
                  <span className="text-xs text-oak-dark/40">（{item.note}）</span>
                </div>
                <span className="text-oak-dark/80">
                  {item.value >= 0 ? '+' : ''}¥{item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-oak-light/10 flex items-center justify-between font-body text-sm font-medium">
            <span className="text-walnut">总价</span>
            <span className="text-walnut">¥{totalPrice.toFixed(2)}</span>
          </div>
        </div>
        <RippleButton
          onClick={handleGenerateQuote}
          disabled={loading}
          className={`
            w-full py-4 rounded-btn text-white font-body font-semibold text-lg
            transition-all duration-300 ${btnColorClass}
            disabled:opacity-60 disabled:cursor-not-allowed
          `}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="saw-blade inline-block w-6 h-6" />
              生成报价单中...
            </span>
          ) : (
            '生成报价单'
          )}
        </RippleButton>
      </div>
    </div>
  );
}
