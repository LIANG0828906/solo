import { ReportModule } from '@/components/ReportModule';

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-amber-900">销售报表</h1>
        <p className="text-amber-700 mt-1 text-sm">
          查看摊位的销售统计、热销商品和销售趋势
        </p>
      </div>
      <ReportModule />
    </div>
  );
}
