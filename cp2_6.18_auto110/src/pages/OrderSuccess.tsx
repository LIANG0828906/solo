import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Package } from 'lucide-react';

export const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [orderNo, setOrderNo] = useState('');

  useEffect(() => {
    const orderNoParam = searchParams.get('orderNo');
    if (orderNoParam) {
      setOrderNo(orderNoParam);
    }
  }, [searchParams]);

  return (
    <div className="animate-fadeIn max-w-lg mx-auto text-center py-16">
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          订单提交成功！
        </h1>

        <p className="text-gray-600 mb-6">
          感谢您的购买，我们会尽快为您发货
        </p>

        {orderNo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">订单号</p>
            <p className="text-lg font-mono font-semibold text-primary">
              {orderNo}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded hover:bg-primary/90 transition-colors duration-200"
          >
            <Package className="w-5 h-5" />
            查看订单
          </Link>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded hover:bg-gray-50 transition-colors duration-200"
          >
            <Home className="w-5 h-5" />
            继续购物
          </Link>
        </div>
      </div>
    </div>
  );
};
