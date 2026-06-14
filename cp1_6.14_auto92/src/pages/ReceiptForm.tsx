import { useParams } from 'react-router-dom';

export default function ReceiptForm() {
  const { id } = useParams();
  const isEdit = !!id;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? '编辑收据' : '新建收据'}
      </h1>
      <div className="card p-6">
        <p className="text-gray-500">收据表单页面开发中...</p>
        {isEdit && <p className="text-gray-400 mt-2">收据ID: {id}</p>}
      </div>
    </div>
  );
}
