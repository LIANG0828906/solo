import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { CartItem } from '@/components/CartItem';
import { useCartStore } from '@/store/useCartStore';
import { apiService } from '@/api/apiService';
import { formatPrice, createRipple } from '@/utils/helpers';

export const CartPage = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = getTotalPrice();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = '请输入收货人姓名';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = '请输入联系电话';
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号码';
    }
    if (!formData.address.trim()) {
      newErrors.address = '请输入收货地址';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    createRipple(e);
    if (!validateForm()) return;
    if (items.length === 0) return;

    setIsSubmitting(true);
    try {
      const order = await apiService.createOrder({
        items: items.map((item) => ({
          bookId: item.bookId,
          quantity: item.quantity,
        })),
        customerName: formData.name,
        customerPhone: formData.phone,
        customerAddress: formData.address,
      });
      clearCart();
      navigate(`/success?orderNo=${order.orderNo}`);
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('提交订单失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-6 transition-colors duration-200"
      >
        <ArrowLeft className="w-4 h-4" />
        继续购物
      </Link>

      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
        <ShoppingCart className="w-7 h-7" />
        购物车
      </h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">购物车是空的</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors duration-200"
          >
            去逛逛
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <CartItem key={item.bookId} item={item} />
            ))}
          </div>

          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                订单摘要
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品数量</span>
                  <span className="text-gray-900">
                    {items.reduce((sum, item) => sum + item.quantity, 0)} 件
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">小计</span>
                  <span className="text-gray-900">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">运费</span>
                  <span className="text-green-600">免运费</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">总计</span>
                  <span className="text-xl font-bold text-accent">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收货人姓名
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded border transition-all duration-200 outline-none ${
                      errors.name
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D1D5DB] focus:border-[#3B82F6]'
                    }`}
                    placeholder="请输入姓名"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    联系电话
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded border transition-all duration-200 outline-none ${
                      errors.phone
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D1D5DB] focus:border-[#3B82F6]'
                    }`}
                    placeholder="请输入手机号码"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    收货地址
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded border transition-all duration-200 outline-none ${
                      errors.address
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-[#D1D5DB] focus:border-[#3B82F6]'
                    }`}
                    placeholder="请输入详细地址"
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-primary text-white font-medium rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98] relative overflow-hidden"
                >
                  {isSubmitting ? '提交中...' : '提交订单'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
