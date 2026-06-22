export function generatePrediction(historicalData) {
  const data = [...historicalData].sort((a, b) => a.month.localeCompare(b.month));
  const last6 = data.slice(-6);
  
  if (last6.length === 0) {
    return [];
  }

  const n = last6.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  last6.forEach((item, i) => {
    const x = i;
    const y = item.total;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  });

  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) : 0;
  const intercept = (sumY - slope * sumX) / n;

  const lastMonth = last6[last6.length - 1].month;
  const [year, month] = lastMonth.split('-').map(Number);
  const predictions = [];

  for (let i = 1; i <= 3; i++) {
    let predictMonth = month + i;
    let predictYear = year;
    while (predictMonth > 12) {
      predictMonth -= 12;
      predictYear += 1;
    }
    const monthStr = `${predictYear}-${String(predictMonth).padStart(2, '0')}`;
    const x = n + i - 1;
    const predicted = Math.max(0, Math.round(intercept + slope * x));
    predictions.push({ month: monthStr, total: predicted });
  }

  return predictions;
}
