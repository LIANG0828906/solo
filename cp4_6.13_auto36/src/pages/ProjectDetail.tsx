import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  fetchProjectDetail,
  addIncome,
  deleteIncome,
  ProjectDetail as ProjectDetailType,
  Income,
} from '../utils/api';
import IncomeItem from '../components/IncomeItem';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectDetailType | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    income_date: todayISO(),
    amount: '',
    invoice_number: '',
    payment_status: 'pending' as 'received' | 'pending' | 'overdue',
  });

  const projectId = id ? parseInt(id, 10) : 0;

  const load = () => {
    if (!projectId) return;
    fetchProjectDetail(projectId)
      .then(setProject)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      income_date: todayISO(),
      amount: '',
      invoice_number: '',
      payment_status: 'pending',
    });
    setShowModal(true);
  };

  const openEdit = (income: Income) => {
    setEditing(income);
    setForm({
      income_date: income.income_date,
      amount: String(income.amount),
      invoice_number: income.invoice_number,
      payment_status: income.payment_status,
    });
    setShowModal(true);
  };

  const handleDelete = (incomeId: number) => {
    if (!confirm('确定要删除这条收入记录吗？')) return;
    deleteIncome(incomeId).then(() => load());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount) return;
    if (editing) {
      deleteIncome(editing.id).then(() => {
        addIncome({
          project_id: projectId,
          income_date: form.income_date,
          amount: parseFloat(form.amount),
          invoice_number: form.invoice_number,
          payment_status: form.payment_status,
        }).then(() => {
          setShowModal(false);
          load();
        });
      });
    } else {
      addIncome({
        project_id: projectId,
        income_date: form.income_date,
        amount: parseFloat(form.amount),
        invoice_number: form.invoice_number,
        payment_status: form.payment_status,
      }).then(() => {
        setShowModal(false);
        load();
      });
    }
  };

  if (loading && !project) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⏳</div>
        <div className="empty-state-text">加载中...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <Link to="/projects" className="back-link">
          ← 返回项目列表
        </Link>
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <div className="empty-state-text">项目不存在</div>
        </div>
      </div>
    );
  }

  const totalReceived = project.income
    .filter((i) => i.payment_status === 'received')
    .reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <Link to="/projects" className="back-link">
        ← 返回项目列表
      </Link>

      <div className="detail-header">
        <h1>{project.name}</h1>
        <div className="detail-meta">
          <span>客户：{project.client_name}</span>
          <span>
            {project.start_date} ~ {project.end_date}
          </span>
          <span>进度：{project.progress}%</span>
          <span>
            金额：
            {project.rate_type === 'hourly'
              ? `¥${project.rate_amount}/小时`
              : `¥${Number(project.rate_amount).toLocaleString('zh-CN')}`}
          </span>
          <span>
            已收款：¥{totalReceived.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="section-title">
        <span>收入记录</span>
        <button className="btn" onClick={openAdd}>
          + 添加收入
        </button>
      </div>

      {project.income.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">还没有收入记录</div>
          <button className="btn" onClick={openAdd}>
            添加第一条
          </button>
        </div>
      ) : (
        <div className="income-list">
          {project.income.map((inc) => (
            <IncomeItem key={inc.id} income={inc} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? '编辑收入' : '添加收入'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>收入日期</label>
                  <input
                    type="date"
                    value={form.income_date}
                    onChange={(e) => setForm({ ...form, income_date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>金额 (¥) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required
                    placeholder="请输入金额"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>发票号</label>
                <input
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
                  placeholder="可选"
                />
              </div>
              <div className="form-group">
                <label>付款状态</label>
                <select
                  value={form.payment_status}
                  onChange={(e) => setForm({ ...form, payment_status: e.target.value as any })}
                >
                  <option value="pending">待收</option>
                  <option value="received">已到账</option>
                  <option value="overdue">逾期</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" className="btn">
                  {editing ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
