import { useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type { CouponType, CouponRule } from '@shared/types';

interface CreateCouponData {
  name: string;
  type: CouponType;
  rule: CouponRule;
  totalQuantity: number;
  validDays: number;
}

interface CreateFormProps {
  onCreate: (data: CreateCouponData) => void;
  loading?: boolean;
}

interface FormErrors {
  name?: string;
  type?: string;
  totalQuantity?: string;
  validDays?: string;
  minAmount?: string;
  discountAmount?: string;
  discountRate?: string;
  maxDiscount?: string;
  giftAmount?: string;
  applicableProducts?: string;
}

export default function CreateForm({ onCreate, loading = false }: CreateFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<CouponType>('fixed');
  const [totalQuantity, setTotalQuantity] = useState('');
  const [validDays, setValidDays] = useState('');
  const [applicableProducts, setApplicableProducts] = useState('');
  const [userLevel, setUserLevel] = useState('');

  const [minAmount, setMinAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  const [discountRate, setDiscountRate] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');

  const [giftAmount, setGiftAmount] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) newErrors.name = '请输入优惠券名称';
    if (!totalQuantity.trim()) {
      newErrors.totalQuantity = '请输入发行量';
    } else if (!Number.isInteger(Number(totalQuantity)) || Number(totalQuantity) <= 0) {
      newErrors.totalQuantity = '发行量必须是正整数';
    }
    if (!validDays.trim()) {
      newErrors.validDays = '请输入有效期天数';
    } else if (!Number.isInteger(Number(validDays)) || Number(validDays) <= 0) {
      newErrors.validDays = '有效期必须是正整数';
    }

    if (type === 'fixed') {
      if (!minAmount.trim()) {
        newErrors.minAmount = '请输入最低消费金额';
      } else if (Number(minAmount) < 0) {
        newErrors.minAmount = '金额不能为负数';
      }
      if (!discountAmount.trim()) {
        newErrors.discountAmount = '请输入减免金额';
      } else if (Number(discountAmount) <= 0) {
        newErrors.discountAmount = '减免金额必须大于0';
      }
    } else if (type === 'discount') {
      if (!minAmount.trim()) {
        newErrors.minAmount = '请输入最低消费金额';
      } else if (Number(minAmount) < 0) {
        newErrors.minAmount = '金额不能为负数';
      }
      if (!discountRate.trim()) {
        newErrors.discountRate = '请输入折扣率';
      } else if (Number(discountRate) <= 0 || Number(discountRate) >= 10) {
        newErrors.discountRate = '折扣率应在0-10之间(不含)';
      }
      if (!maxDiscount.trim()) {
        newErrors.maxDiscount = '请输入折扣上限';
      } else if (Number(maxDiscount) <= 0) {
        newErrors.maxDiscount = '折扣上限必须大于0';
      }
    } else if (type === 'gift') {
      if (!giftAmount.trim()) {
        newErrors.giftAmount = '请输入礼品金额';
      } else if (Number(giftAmount) <= 0) {
        newErrors.giftAmount = '礼品金额必须大于0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CreateCouponData = {
      name: name.trim(),
      type,
      rule: {
        applicableProducts: applicableProducts.trim()
          ? applicableProducts
              .split(',')
              .map((id) => id.trim())
              .filter(Boolean)
          : [],
      },
      totalQuantity: Number(totalQuantity),
      validDays: Number(validDays),
    };
    if (userLevel.trim()) {
      data.rule.userLevel = Number(userLevel);
    }

    if (type === 'fixed') {
      data.rule.minAmount = Number(minAmount);
      data.rule.discountAmount = Number(discountAmount);
    } else if (type === 'discount') {
      data.rule.minAmount = Number(minAmount);
      data.rule.discountRate = Number(discountRate);
      data.rule.maxDiscount = Number(maxDiscount);
    } else if (type === 'gift') {
      data.rule.giftAmount = Number(giftAmount);
    }

    onCreate(data);
  };

  const renderField = (
    label: string,
    required: boolean,
    input: React.ReactNode,
    error?: string
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-start gap-3">
      <label className="pt-2 text-sm font-medium text-gray-700 text-left sm:text-right">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="w-full">
        {input}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );

  const inputClassName = (hasError: boolean) =>
    cn(
      'w-full px-3 py-2 text-sm border rounded-lg transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
      hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'
    );

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
      {renderField(
        '优惠券名称',
        true,
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="请输入优惠券名称"
          className={inputClassName(!!errors.name)}
          disabled={loading}
        />,
        errors.name
      )}

      {renderField(
        '优惠券类型',
        true,
        <select
          value={type}
          onChange={(e) => {
            setType(e.target.value as CouponType);
            setErrors({});
          }}
          className={inputClassName(!!errors.type)}
          disabled={loading}
        >
          <option value="fixed">满减券</option>
          <option value="discount">折扣券</option>
          <option value="gift">礼品券</option>
        </select>,
        errors.type
      )}

      {type === 'fixed' && (
        <>
          {renderField(
            '最低消费金额',
            true,
            <input
              type="number"
              step="0.01"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="请输入最低消费金额"
              className={inputClassName(!!errors.minAmount)}
              disabled={loading}
            />,
            errors.minAmount
          )}
          {renderField(
            '减免金额',
            true,
            <input
              type="number"
              step="0.01"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
              placeholder="请输入减免金额"
              className={inputClassName(!!errors.discountAmount)}
              disabled={loading}
            />,
            errors.discountAmount
          )}
        </>
      )}

      {type === 'discount' && (
        <>
          {renderField(
            '最低消费金额',
            true,
            <input
              type="number"
              step="0.01"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              placeholder="请输入最低消费金额"
              className={inputClassName(!!errors.minAmount)}
              disabled={loading}
            />,
            errors.minAmount
          )}
          {renderField(
            '折扣率',
            true,
            <input
              type="number"
              step="0.1"
              value={discountRate}
              onChange={(e) => setDiscountRate(e.target.value)}
              placeholder="例如: 8.5 表示 8.5 折"
              className={inputClassName(!!errors.discountRate)}
              disabled={loading}
            />,
            errors.discountRate
          )}
          {renderField(
            '折扣上限',
            true,
            <input
              type="number"
              step="0.01"
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="请输入最高减免金额"
              className={inputClassName(!!errors.maxDiscount)}
              disabled={loading}
            />,
            errors.maxDiscount
          )}
        </>
      )}

      {type === 'gift' &&
        renderField(
          '礼品金额',
          true,
          <input
            type="number"
            step="0.01"
            value={giftAmount}
            onChange={(e) => setGiftAmount(e.target.value)}
            placeholder="请输入礼品金额"
            className={inputClassName(!!errors.giftAmount)}
            disabled={loading}
          />,
          errors.giftAmount
        )}

      {renderField(
        '发行量',
        true,
        <input
          type="number"
          step="1"
          value={totalQuantity}
          onChange={(e) => setTotalQuantity(e.target.value)}
          placeholder="请输入发行总数量"
          className={inputClassName(!!errors.totalQuantity)}
          disabled={loading}
        />,
        errors.totalQuantity
      )}

      {renderField(
        '有效期天数',
        true,
        <input
          type="number"
          step="1"
          value={validDays}
          onChange={(e) => setValidDays(e.target.value)}
          placeholder="请输入有效天数"
          className={inputClassName(!!errors.validDays)}
          disabled={loading}
        />,
        errors.validDays
      )}

      {renderField(
        '适用商品ID',
        false,
        <input
          type="text"
          value={applicableProducts}
          onChange={(e) => setApplicableProducts(e.target.value)}
          placeholder="多个ID用英文逗号分隔，留空表示全部商品"
          className={inputClassName(!!errors.applicableProducts)}
          disabled={loading}
        />,
        errors.applicableProducts
      )}

      {renderField(
        '用户等级',
        false,
        <input
          type="number"
          step="1"
          value={userLevel}
          onChange={(e) => setUserLevel(e.target.value)}
          placeholder="例如: 1，留空表示全部用户"
          className={inputClassName(false)}
          disabled={loading}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3 pt-2">
        <div />
        <button
          type="submit"
          disabled={loading}
          className={cn(
            'w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-medium text-white',
            'bg-blue-500 hover:bg-blue-600 transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:bg-blue-300 disabled:cursor-not-allowed',
            'inline-flex items-center justify-center gap-2'
          )}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? '提交中...' : '创建优惠券'}
        </button>
      </div>
    </form>
  );
}
