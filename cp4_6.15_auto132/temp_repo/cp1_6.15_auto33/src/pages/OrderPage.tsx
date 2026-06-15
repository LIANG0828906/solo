import { useFlowerStore } from '@/store/useFlowerStore';
import OrderForm from '@/components/OrderForm';

export default function OrderPage() {
  const { bouquetItems } = useFlowerStore();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="font-display text-3xl text-gray-800">填写配送信息</h2>
        <p className="text-gray-400 mt-1">完善配送信息，完成订单</p>
      </div>

      {bouquetItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🥀</p>
          <p className="text-gray-400 font-display text-lg">花束为空，请先创建花束</p>
        </div>
      ) : (
        <OrderForm />
      )}
    </div>
  );
}
