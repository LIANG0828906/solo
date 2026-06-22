import { Income } from '../utils/api';

interface Props {
  income: Income;
  onEdit: (income: Income) => void;
  onDelete: (id: number) => void;
}

const statusLabel: Record<string, string> = {
  received: '已到账',
  pending: '待收',
  overdue: '逾期',
};

const statusIcon: Record<string, string> = {
  received: '✓',
  pending: '!',
  overdue: '!',
};

export default function IncomeItem({ income, onEdit, onDelete }: Props) {
  const fmtDate = (d: string) => {
    try {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    } catch {
      return d;
    }
  };

  return (
    <div className="income-item" onClick={() => onEdit(income)}>
      <div className={`status-indicator ${income.payment_status}`}>{statusIcon[income.payment_status]}</div>
      <div className="income-main">
        <div className="income-top">
          <span className="income-project">{income.project_name || '项目收入'}</span>
          <span className="income-amount">
            ¥{Number(income.amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="income-bottom">
          <span>日期：{fmtDate(income.income_date)}</span>
          {income.invoice_number && <span>发票号：{income.invoice_number}</span>}
          <span className={`income-status-badge ${income.payment_status}`}>
            {statusLabel[income.payment_status]}
          </span>
        </div>
      </div>
      <div className="income-actions" onClick={(e) => e.stopPropagation()}>
        <button className="btn btn-secondary btn-sm" onClick={() => onEdit(income)}>
          编辑
        </button>
        <button className="btn btn-danger btn-sm" onClick={() => onDelete(income.id)}>
          删除
        </button>
      </div>
    </div>
  );
}
