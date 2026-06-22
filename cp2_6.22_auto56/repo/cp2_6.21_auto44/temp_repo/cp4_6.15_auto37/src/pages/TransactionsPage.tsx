import { TransactionModule } from '@/components/TransactionModule';

export function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-amber-900">交易记录</h1>
        <p className="text-amber-700 mt-1 text-sm">
          查看所有交易历史，5分钟内可取消交易并恢复库存
        </p>
      </div>
      <TransactionModule />
    </div>
  );
}
