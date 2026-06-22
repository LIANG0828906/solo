import { useState } from 'react';
import { Order } from '../types';
import { orderService } from '../services/OrderService';
import { FaCheck, FaSpinner } from 'react-icons/fa';

interface OrderFormProps {
  customizationId: string;
  clothingId: string;
  totalCarbonSaved: number;
  onSubmitSuccess?: (orderId: string) => void;
}

export function OrderForm({
  customizationId,
  clothingId,
  totalCarbonSaved,
  onSubmitSuccess
}: OrderFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    deliveryDate: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    const orderData: Omit<Order, 'id'> = {
      ...formData,
      customizationId,
      clothingId,
      totalCarbonSaved
    };

    setIsSubmitting(true);
    setSubmitProgress(0);

    const result = await orderService.submitOrder(orderData, (progress) => {
      setSubmitProgress(progress);
    });

    if (result.success) {
      setIsSuccess(true);
      setOrderId(result.orderId);
      setTimeout(() => {
        onSubmitSuccess?.(result.orderId);
      }, 1500);
    } else {
      setErrors(result.errors || ['提交失败，请稍后重试']);
      setIsSubmitting(false);
    }
  };

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + 14);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="w-full max-w-md mx-auto">
      {isSuccess ? (
        <div className="text-center py-8">
          <div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center"
            style={{
              animation: 'success-pop 0.5s ease-out forwards'
            }}
          >
            <FaCheck className="text-emerald-500" size={36} />
            <style>
              {`
                @keyframes success-pop {
                  0% { transform: scale(0); }
                  50% { transform: scale(1.2); }
                  100% { transform: scale(1); }
                }
                @keyframes ripple {
                  0% { transform: scale(0.8); opacity: 1; }
                  100% { transform: scale(2.5); opacity: 0; }
                }
              `}
            </style>
            <div
              className="absolute w-20 h-20 rounded-full bg-emerald-200"
              style={{ animation: 'ripple 0.8s ease-out 0.2s forwards' }}
            />
          </div>
          <h3 className="text-2xl font-bold text-emerald-600 mb-2">提交成功！</h3>
          <p className="text-gray-600 mb-4">您的订单号</p>
          <p className="text-xl font-mono font-bold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg inline-block">
            {orderId}
          </p>
          <p className="text-sm text-emerald-600 mt-4">
            本次定制共减少 {totalCarbonSaved.toFixed(1)} kg CO₂ 排放
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <h3 className="text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            提交定制订单
          </h3>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-600">
                  {error}
                </p>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="请输入您的姓名"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱 <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              期望收货日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              min={minDateStr}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
            />
            <p className="text-xs text-gray-400 mt-1">
              定制周期需要至少14天
            </p>
          </div>

          <div className="bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-emerald-700">预计减少碳排放</span>
              <span className="text-lg font-bold text-emerald-600">
                {totalCarbonSaved.toFixed(1)} kg CO₂
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/30'
            }`}
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>
                  提交中... {submitProgress > 0 ? `${submitProgress}%` : ''}
                </span>
              </>
            ) : (
              '提交订单'
            )}
          </button>

          {isSubmitting && submitProgress > 0 && (
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-300"
                style={{ width: `${submitProgress}%` }}
              />
            </div>
          )}
        </form>
      )}
    </div>
  );
}
