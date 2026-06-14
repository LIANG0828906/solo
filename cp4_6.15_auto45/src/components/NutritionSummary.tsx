import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Leaf, BarChart3, X } from 'lucide-react';
import { FoodEntry } from './MealCard';

interface NutritionSummaryProps {
  entries: FoodEntry[];
  records: Record<string, Record<string, FoodEntry[]>>;
  calorieGoal: number;
  currentDate: string;
}

interface DailyData {
  date: string;
  calories: number;
}

const NutritionSummary: React.FC<NutritionSummaryProps> = ({ entries, records, calorieGoal, currentDate }) => {
  const [showTrend, setShowTrend] = useState(false);
  const [displayAdvice, setDisplayAdvice] = useState('');
  const [adviceKey, setAdviceKey] = useState(0);

  const totalCalories = entries.reduce((sum, e) => sum + e.calories, 0);
  const totalProtein = entries.reduce((sum, e) => sum + e.protein, 0);
  const totalFat = entries.reduce((sum, e) => sum + e.fat, 0);
  const totalCarbs = entries.reduce((sum, e) => sum + e.carbs, 0);
  const totalFiber = entries.reduce((sum, e) => sum + e.fiber, 0);

  const proteinCalories = totalProtein * 4;
  const fatCalories = totalFat * 9;
  const carbsCalories = totalCarbs * 4;
  const totalMacroCalories = proteinCalories + fatCalories + carbsCalories;

  const proteinRatio = totalMacroCalories > 0 ? (proteinCalories / totalMacroCalories) * 100 : 0;
  const fatRatio = totalMacroCalories > 0 ? (fatCalories / totalMacroCalories) * 100 : 0;
  const carbsRatio = totalMacroCalories > 0 ? (carbsCalories / totalMacroCalories) * 100 : 0;

  const pieData = [
    { name: '蛋白质', value: proteinRatio, color: '#98D8C8' },
    { name: '脂肪', value: fatRatio, color: '#A8D8EA' },
    { name: '碳水化合物', value: carbsRatio, color: '#FFE0B2' },
  ].filter((d) => d.value > 0);

  const generateAdvice = (): string => {
    if (entries.length === 0) {
      return '今天还没有记录饮食，快来开始记录吧！';
    }

    const advices: string[] = [];

    if (totalCalories < calorieGoal * 0.7) {
      advices.push('今日热量摄入偏低，建议适当增加食物');
    } else if (totalCalories > calorieGoal * 1.2) {
      advices.push('今日热量摄入超标，建议控制饮食量');
    }

    if (proteinRatio < 15) {
      advices.push('蛋白质摄入不足，建议增加鸡胸肉、鸡蛋等高蛋白食物');
    } else if (proteinRatio > 30) {
      advices.push('蛋白质摄入充足，搭配蔬菜效果更佳');
    }

    if (fatRatio > 35) {
      advices.push('脂肪摄入偏高，建议减少油腻食物');
    }

    if (carbsRatio > 65) {
      advices.push('碳水化合物摄入偏高，建议适当减少主食');
    }

    if (totalFiber < 15) {
      advices.push('膳食纤维不足，建议多吃蔬菜水果');
    }

    if (advices.length === 0) {
      return '营养摄入均衡，继续保持良好的饮食习惯！';
    }

    return advices[0];
  };

  const fullAdvice = generateAdvice();

  useEffect(() => {
    setDisplayAdvice('');
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullAdvice.length) {
        setDisplayAdvice(fullAdvice.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [adviceKey, fullAdvice]);

  useEffect(() => {
    setAdviceKey((k) => k + 1);
  }, [entries.length, totalCalories]);

  const getLast7Days = (): DailyData[] => {
    const result: DailyData[] = [];
    const today = new Date(currentDate);
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayMeals = records[dateStr];
      let dayCalories = 0;
      if (dayMeals) {
        Object.values(dayMeals).forEach((mealEntries) => {
          mealEntries.forEach((e) => {
            dayCalories += e.calories;
          });
        });
      }
      result.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        calories: dayCalories,
      });
    }
    return result;
  };

  const trendData = getLast7Days();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm p-5 card-hover">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">今日营养概览</h3>
          <div className="text-sm text-gray-500">
            目标 <span className="font-semibold text-[#98D8C8]">{calorieGoal}</span> kcal
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-800">{totalCalories}</div>
              <div className="text-xs text-gray-400">kcal</div>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {[
              { name: '蛋白质', value: totalProtein, unit: 'g', ratio: proteinRatio, color: '#98D8C8' },
              { name: '脂肪', value: totalFat, unit: 'g', ratio: fatRatio, color: '#A8D8EA' },
              { name: '碳水化合物', value: totalCarbs, unit: 'g', ratio: carbsRatio, color: '#FFE0B2' },
              { name: '膳食纤维', value: totalFiber, unit: 'g', ratio: 0, color: '#C8E6C9' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-800">
                    {item.value.toFixed(1)}{item.unit}
                    {item.ratio > 0 && <span className="text-gray-400 ml-1">({item.ratio.toFixed(0)}%)</span>}
                  </span>
                </div>
                {item.ratio > 0 && (
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.ratio}%`, backgroundColor: item.color }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#F5F5F5] rounded-2xl p-4 flex items-start gap-3 animate-fade-in">
        <div className="w-8 h-8 rounded-full bg-[#98D8C8]/20 flex items-center justify-center shrink-0 mt-0.5">
          <Leaf size={16} className="text-[#4CAF50]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-gray-700 leading-relaxed text-sm">
            {displayAdvice}
            <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse" />
          </div>
        </div>
      </div>

      {showTrend && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center animate-fade-in">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl p-5 animate-slide-up max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 text-lg">近7天热量趋势</h3>
              <button
                onClick={() => setShowTrend(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A8D8EA" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#A8D8EA" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#999' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#999' }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                    formatter={(value: number) => [`${value} kcal`, '摄入热量']}
                  />
                  <Area
                    type="monotone"
                    dataKey="calories"
                    stroke="#A8D8EA"
                    strokeWidth={3}
                    fill="url(#colorCalories)"
                    dot={{ fill: '#A8D8EA', r: 5, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7, fill: '#6BC5E0' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-[#F0F9F7] rounded-xl p-3">
                <div className="text-2xl font-bold text-[#98D8C8]">
                  {Math.round(trendData.reduce((s, d) => s + d.calories, 0) / trendData.length)}
                </div>
                <div className="text-xs text-gray-500 mt-1">日均热量</div>
              </div>
              <div className="bg-[#E8F4FD] rounded-xl p-3">
                <div className="text-2xl font-bold text-[#A8D8EA]">
                  {Math.max(...trendData.map((d) => d.calories))}
                </div>
                <div className="text-xs text-gray-500 mt-1">最高摄入</div>
              </div>
              <div className="bg-[#FFF3CD] rounded-xl p-3">
                <div className="text-2xl font-bold text-[#E6B800]">
                  {Math.min(...trendData.filter((d) => d.calories > 0).map((d) => d.calories)) || 0}
                </div>
                <div className="text-xs text-gray-500 mt-1">最低摄入</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowTrend(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#98D8C8] to-[#A8D8EA] text-white shadow-lg flex items-center justify-center btn-hover z-40"
      >
        <BarChart3 size={24} />
      </button>
    </div>
  );
};

export default NutritionSummary;
