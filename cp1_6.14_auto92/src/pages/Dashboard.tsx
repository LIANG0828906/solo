export default function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <h3 className="text-gray-500 text-sm">待收款</h3>
          <p className="text-3xl font-bold text-orange-500 mt-2">¥0</p>
        </div>
        <div className="card p-6">
          <h3 className="text-gray-500 text-sm">已收款</h3>
          <p className="text-3xl font-bold text-green-500 mt-2">¥0</p>
        </div>
        <div className="card p-6">
          <h3 className="text-gray-500 text-sm">客户总数</h3>
          <p className="text-3xl font-bold text-blue-800 mt-2">0</p>
        </div>
        <div className="card p-6">
          <h3 className="text-gray-500 text-sm">逾期金额</h3>
          <p className="text-3xl font-bold text-red-500 mt-2">¥0</p>
        </div>
      </div>
    </div>
  );
}
