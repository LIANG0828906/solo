import DailySummary from './DailySummary';
import WeeklyBarChart from './WeeklyBarChart';
import NutritionPieChart from './NutritionPieChart';

export { DailySummary, WeeklyBarChart, NutritionPieChart };

export default function NutritionChart() {
  return (
    <div className="nutrition-chart">
      <DailySummary />
      <WeeklyBarChart />
      <NutritionPieChart />
    </div>
  );
}
