import { useNavigate } from 'react-router-dom';
import { ArrowLeft, X, Filter } from 'lucide-react';
import { useStore } from '../store';
import ConditionBar from '../components/ConditionBar';
import '../index.css';

export default function ComparePage() {
  const navigate = useNavigate();
  const { instruments, compareIds, removeFromCompare, clearCompare } = useStore();

  const compareInstruments = instruments.filter((i) => compareIds.includes(i.id));

  const getConditionBg = (condition: number) => {
    const ratio = (condition - 1) / 9;
    const r = Math.round(239 + (34 - 239) * ratio);
    const g = Math.round(68 + (197 - 68) * ratio);
    const b = Math.round(68 + (94 - 68) * ratio);
    return `rgba(${r}, ${g}, ${b}, 0.2)`;
  };

  if (compareInstruments.length < 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </button>

        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Filter className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">至少需要对比 2 件乐器</h2>
          <p className="text-gray-500 mb-6">
            当前已选择 {compareInstruments.length} 件，请从收藏夹中添加更多乐器进行对比
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2"
              style={{ backgroundColor: '#FF9800' }}
            >
              去收藏夹选择
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            已对比 {compareInstruments.length}/3 件
          </span>
          {compareInstruments.length > 0 && (
            <button
              onClick={clearCompare}
              className="text-sm text-red-500 hover:text-red-600 transition-colors"
            >
              清空对比
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr style={{ backgroundColor: '#1E1E1E' }}>
                <th className="px-6 py-4 text-left text-white font-medium w-32">
                  对比项
                </th>
                {compareInstruments.map((inst) => (
                  <th
                    key={inst.id}
                    className="px-6 py-4 text-center relative"
                    style={{ minWidth: '200px' }}
                  >
                    <button
                      onClick={() => removeFromCompare(inst.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center gap-2 text-white">
                      <img
                        src={inst.image}
                        alt={inst.model}
                        className="w-20 h-20 rounded-lg object-cover border-2 border-white/20"
                      />
                      <div>
                        <p className="font-bold">{inst.brand}</p>
                        <p className="text-sm text-white/80">{inst.model}</p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">品牌</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center font-semibold text-gray-800">
                    {inst.brand}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">型号</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center text-gray-800">
                    {inst.model}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">类型</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center text-gray-800">
                    {inst.type}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">购买年份</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center text-gray-800">
                    {inst.purchaseYear}年
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">使用年限</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center text-gray-800">
                    {inst.yearsUsed}年
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">成色</td>
                {compareInstruments.map((inst) => (
                  <td
                    key={inst.id}
                    className="px-6 py-4"
                    style={{
                      background: getConditionBg(inst.condition),
                      transition: 'background 0.3s',
                    }}
                  >
                    <div className="max-w-[180px] mx-auto">
                      <ConditionBar condition={inst.condition} showLabel height="10px" />
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">期望售价</td>
                {compareInstruments.map((inst) => {
                  const prices = compareInstruments.map((i) => i.expectedPrice);
                  const minPrice = Math.min(...prices);
                  const isMin = inst.expectedPrice === minPrice;
                  return (
                    <td key={inst.id} className="px-6 py-4 text-center">
                      <span
                        className={`text-xl font-bold ${
                          isMin ? 'text-green-600' : 'text-gray-800'
                        }`}
                      >
                        ¥{inst.expectedPrice.toLocaleString()}
                      </span>
                      {isMin && (
                        <span className="block mt-1 text-xs font-medium text-green-600">
                          最低价 ✓
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">平台估价</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center">
                    <span className="font-semibold" style={{ color: '#FF9800' }}>
                      ¥{(inst.estimatedPrice || Math.round(inst.expectedPrice * 0.95)).toLocaleString()}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm font-medium text-gray-500 bg-gray-50">操作</td>
                {compareInstruments.map((inst) => (
                  <td key={inst.id} className="px-6 py-4 text-center">
                    <button
                      onClick={() => navigate(`/detail/${inst.id}`)}
                      className="px-5 py-2 rounded-lg text-white text-sm font-medium transition-all hover:scale-105"
                      style={{ backgroundColor: '#FF9800' }}
                    >
                      查看详情
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
