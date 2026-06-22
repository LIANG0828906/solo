import { useLocation, useNavigate } from 'react-router-dom';
import { OrderForm } from '../components/OrderForm';
import { fabricData } from '../data/clothing';
import { FaArrowLeft } from 'react-icons/fa';

export function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { customization, clothing } = location.state as any;

  if (!customization || !clothing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#F5F5DC] to-[#E8F5E9]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">未找到定制信息</h2>
          <p className="text-gray-500 mb-6">请先选择并定制您的服装</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  const fabric = fabricData[customization.customization.fabric];
  const colors = Object.values(customization.customization.colors);

  const handleSubmitSuccess = (orderId: string) => {
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] to-white">
      <nav className="sticky top-0 z-40 backdrop-blur-lg bg-white/70 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-emerald-600 transition-colors"
          >
            <FaArrowLeft size={18} />
            <span>返回</span>
          </button>
          <div
            className="text-xl font-bold text-gray-800"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            确认订单
          </div>
          <div className="w-20" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">定制详情</h3>

            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div
                className="relative aspect-[3/4]"
                style={{
                  background: `linear-gradient(135deg, ${colors[0]}40 0%, ${colors[1] || colors[0]}20 100%)`
                }}
              >
                <div className="w-full h-full flex items-center justify-center">
                  <svg viewBox="0 0 200 300" className="w-2/3 h-2/3 drop-shadow-xl">
                    <defs>
                      <linearGradient id="checkout-dress" x1="0%" y1="0%" x2="0%" y2="100%">
                        {colors.map((color: string, i: number) => (
                          <stop
                            key={i}
                            offset={`${(i / (colors.length - 1)) * 100}%`}
                            stopColor={color}
                          />
                        ))}
                      </linearGradient>
                    </defs>
                    <path
                      d="M100,30 Q70,60 65,100 L55,250 Q100,280 145,250 L135,100 Q130,60 100,30"
                      fill="url(#checkout-dress)"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1.5"
                    />
                    <circle cx="100" cy="25" r="15" fill="rgba(255,255,255,0.6)" />
                  </svg>
                </div>
              </div>

              <div className="p-6">
                <h4
                  className="text-xl font-bold text-gray-800 mb-2"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {clothing.name}
                </h4>

                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full">
                    {fabric.name}
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">颜色配置</h5>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(customization.customization.colors).map(([part, color]: [string, any]) => (
                        <div key={part} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <div
                            className="w-5 h-5 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-xs text-gray-600">
                            {clothing.parts.find((p: any) => p.id === part)?.name || part}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">面料</span>
                      <span className="text-gray-800 font-medium">{fabric.name}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">设计师</span>
                      <span className="text-gray-800 font-medium">{clothing.designer}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500">碳足迹评分</span>
                      <span className="text-gray-800 font-medium">{customization.carbonScore.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-600">
                      <span className="font-medium">预计减少碳排放</span>
                      <span className="font-bold">
                        {(8.5 - customization.carbonScore).toFixed(1)} kg CO₂
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <OrderForm
              customizationId={customization.id}
              clothingId={clothing.id}
              totalCarbonSaved={8.5 - customization.carbonScore}
              onSubmitSuccess={handleSubmitSuccess}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
