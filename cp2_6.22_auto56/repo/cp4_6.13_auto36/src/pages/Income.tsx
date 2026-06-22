import { useEffect, useState } from 'react';
import { fetchIncome, addIncome, deleteIncome, fetchProjects, Income, Project } from '../utils/api';
import IncomeItem from '../components/IncomeItem';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function IncomePage() {
  const [income, setIncome] = useState<Income[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Income | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    project_id: '' as string | number,
    income_date: todayISO(),
    amount: '',
    invoice_number: '',
    payment_status: 'pending' as 'received' | 'pending' | 'overdue',
  });

  const load = () => {
    Promise.all([fetchIncome(), fetchProjects()])
      .then(([inc, projs]) => {
        setIncome(inc);
        setProjects(projs);
        if (projs.length > 0 && !form.project_id) {
          setForm((f) => ({ ...f, project_id: projs[0].id }));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({
      project_id: projects[0]?.id || '',
      income_date: todayISO(),
      amount: '',
      invoice_number: '',
      payment_status: 'pending',
    });
    setShowModal(true);
  };

  const openEdit = (inc: Income) => {
    setEditing(inc);
    setForm({
      project_id: inc.project_id,
      income_date: inc.income_date,
      amount: String(inc.amount),
      invoice_number: inc.invoice_number,
      payment_status: inc.payment_status,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('确定要删除这条收入记录吗？')) return;
    deleteIncome(id).then(() => load());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || !form.project_id) return;
    if (editing) {
      deleteIncome(editing.id).then(() => {
        addIncome({
          project_id: Number(form.project_id),
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
        project_id: Number(form.project_id),
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

  const totalAll = income.reduce((s, i) => s + i.amount, 0);
  const totalReceived = income.filter((i) => i.payment_status === 'received').reduce((s, i) => s + i.amount, 0);
  const totalPending = income.filter((i) => i.payment_status === 'pending' || i.payment_status === 'overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">收入管理</h1>
        <button className="btn" onClick={openAdd}>
          + 添加收入
        </button>
      </div>

      <div className="projects-grid" style={{ marginBottom: 24 }}>
        <div className="project-card in-progress" style={{ cursor: 'default', minHeight: 0 }}>
          <div className="project-client" style={{ marginTop: 0, opacity: 1, fontSize: 13 }}>累计总额</div>
          <div className="project-rate" style={{ fontSize: 22 }}>
            ¥{totalAll.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="project-card completed" style={{ cursor: 'default', minHeight: 0 }}>
          <div className="project-client" style={{ marginTop: 0, opacity: 1, fontSize: 13 }}>已到账</div>
          <div className="project-rate" style={{ fontSize: 22 }}>
            ¥{totalReceived.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
        <div className="project-card paused" style={{ cursor: 'default', minHeight: 0 }}>
          <div className="project-client" style={{ marginTop: 0, opacity: 1, fontSize: 13 }}>待收/逾期</div>
          <div className="project-rate" style={{ fontSize: 22 }}>
            ¥{totalPending.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      <div className="section-title">
        <span>全部收入记录</span>
        <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>共 {income.length} 条</span>
      </div>

      {loading && income.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⏳</div>
          <div className="empty-state-text">加载中...</div>
        </div>
      ) : income.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-text">还没有收入记录</div>
          <button className="btn" onClick={openAdd}>
            添加第一条
          </button>
        </div>
      ) : (
        <div className="income-list">
          {income.map((inc) => (
            <IncomeItem key={inc.id} income={inc} onEdit={openEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing ? '编辑收入' : '添加收入'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>关联项目 *</label>
                <select
                  value={form.project_id}
                  onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                  required
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && (
                  <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6 }}>请先创建项目</div>
                )}
              </div>
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
                  />
                </div>
              </div>
              <div className="form-group">
                <label>发票号</label>
                <input
                  type="text"
                  value={form.invoice_number}
                  onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
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
                <button type="submit" className="btn" disabled={projects.length === 0}>
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
