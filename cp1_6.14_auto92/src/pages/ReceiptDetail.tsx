import { useParams } from 'react-router-dom';

export default function ReceiptDetail() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">收据详情</h1>
      <div className="card p-6">
        <p className="text-gray-500">收据详情页面开发中...</p>
        <p className="text-gray-400 mt-2">收据ID: {id}</p>
      </div>
    </div>
  );
}
