import { StallModule } from '@/components/StallModule';

export function StallPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-amber-900">摊位管理</h1>
        <p className="text-amber-700 mt-1 text-sm">创建和管理您的摊位，上架商品开始交易</p>
      </div>
      <StallModule />
    </div>
  );
}
