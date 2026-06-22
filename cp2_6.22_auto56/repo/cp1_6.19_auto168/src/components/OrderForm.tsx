import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, CraftType } from '../store';

const CRAFT_TYPES: CraftType[] = ['陶瓷', '木雕', '编织', '皮具', '首饰', '刺绣', '玻璃', '其他'];

const OrderForm = () => {
  const { addOrder } = useStore();
  const [customerName, setCustomerName] = useState('');
  const [craftType, setCraftType] = useState<CraftType>('陶瓷');
  const [specialRequirements, setSpecialRequirements] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toISOString().split('T')[0];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!customerName.trim()) e.customerName = '请输入客户姓名';
    if (!expectedDate) e.expectedDate = '请选择期望完工日期';
    if (expectedDate && new Date(expectedDate) < new Date(today)) {
      e.expectedDate = '完工日期不能早于今天';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addOrder({
      customerName: customerName.trim(),
      craftType,
      specialRequirements: specialRequirements.trim(),
      expectedDate,
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);

    setCustomerName('');
    setCraftType('陶瓷');
    setSpecialRequirements('');
    setExpectedDate('');
    setErrors({});
  };

  const inputStyle =
    'w-full px-3 py-2.5 rounded-lg border-2 transition-all duration-300 bg-white ' +
    'border-[#D7C4B0] focus:border-[#8B7355] focus:shadow-md text-[#2C3E50] placeholder:text-[#BDBDBD]';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-[#F9F3E7] rounded-2xl p-6 mb-6 border-2 border-[#D7C4B0] shadow-sm"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">📝</span>
        <h2 className="text-xl font-semibold text-[#2C3E50]">提交定制订单</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#5D4E37] mb-1.5">客户姓名</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="请输入客户姓名"
              className={`${inputStyle} ${errors.customerName ? 'border-red-400' : ''}`}
            />
            {errors.customerName && <p className="text-xs text-red-500 mt-1">{errors.customerName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5D4E37] mb-1.5">作品类型</label>
            <select
              value={craftType}
              onChange={(e) => setCraftType(e.target.value as CraftType)}
              className={inputStyle}
            >
              {CRAFT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5D4E37] mb-1.5">特殊要求</label>
          <textarea
            value={specialRequirements}
            onChange={(e) => setSpecialRequirements(e.target.value)}
            placeholder="请描述定制细节、尺寸偏好、颜色要求等..."
            rows={3}
            className={`${inputStyle} resize-none`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#5D4E37] mb-1.5">期望完工日期</label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            min={today}
            className={`${inputStyle} ${errors.expectedDate ? 'border-red-400' : ''}`}
          />
          {errors.expectedDate && <p className="text-xs text-red-500 mt-1">{errors.expectedDate}</p>}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <motion.button
            type="submit"
            whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(139, 115, 85, 0.25)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="px-6 py-2.5 rounded-lg bg-[#8B7355] text-white font-medium hover:bg-[#6B5344] transition-colors duration-300"
          >
            提交订单 ✨
          </motion.button>

          <AnimatePresence>
            {showSuccess && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-sm text-[#4CAF50] font-medium flex items-center gap-1"
              >
                ✓ 订单提交成功！
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </form>
    </motion.div>
  );
};

export default OrderForm;
