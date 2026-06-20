import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import type {
  Student,
  ConsumeRecord,
  RenewRecord,
  TransferRecord,
  CoursePackage,
} from '../types';
import Modal from './Modal';

interface StudentDetailProps {
  onBack: () => void;
}

const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
};

type TabKey = 'consume' | 'renew' | 'transfer';

const StudentDetail: React.FC<StudentDetailProps> = ({ onBack }) => {
  const { id = '' } = useParams<{ id: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [consumeRecords, setConsumeRecords] = useState<ConsumeRecord[]>([]);
  const [renewRecords, setRenewRecords] = useState<RenewRecord[]>([]);
  const [transferRecords, setTransferRecords] = useState<TransferRecord[]>([]);
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('consume');

  const [showConsume, setShowConsume] = useState(false);
  const [consumeForm, setConsumeForm] = useState({ packageId: '', hours: 1, note: '' });
  const [consumeError, setConsumeError] = useState<string | null>(null);
  const [consumeSubmitting, setConsumeSubmitting] = useState(false);

  const [showRenew, setShowRenew] = useState(false);
  const [renewForm, setRenewForm] = useState({ packageId: '', hours: 0 });
  const [renewError, setRenewError] = useState<string | null>(null);
  const [renewSubmitting, setRenewSubmitting] = useState(false);

  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromPackageId: '',
    toPackageId: '',
    hours: 1,
  });
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSubmitting, setTransferSubmitting] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [stu, cons, rens, trans, pkgs] = await Promise.all([
        api.getStudent(id),
        api.getConsumeRecords(id),
        api.getRenewRecords(id),
        api.getTransferRecords(id),
        api.getCoursePackages(),
      ]);
      setStudent(stu);
      setConsumeRecords(cons);
      setRenewRecords(rens);
      setTransferRecords(trans);
      setPackages(pkgs);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadAll();
  }, [id, loadAll]);

  const openConsume = () => {
    if (!student) return;
    const firstPkg = student.packages.find((p) => p.remainingHours > 0) || student.packages[0];
    setConsumeForm({
      packageId: firstPkg?.packageId || '',
      hours: 1,
      note: '',
    });
    setConsumeError(null);
    setShowConsume(true);
  };

  const selectedPkgForConsume = student?.packages.find(
    (p) => p.packageId === consumeForm.packageId
  );
  const maxConsumeHours = selectedPkgForConsume?.remainingHours || 0;

  const submitConsume = async () => {
    if (!consumeForm.packageId) {
      setConsumeError('请选择课程包');
      return;
    }
    if (consumeForm.hours < 1) {
      setConsumeError('消课课时至少为1');
      return;
    }
    if (consumeForm.hours > maxConsumeHours) {
      setConsumeError(`消课课时不能超过剩余课时（${maxConsumeHours}）`);
      return;
    }
    try {
      setConsumeSubmitting(true);
      setConsumeError(null);
      const res = await api.consumeHours(id, {
        packageId: consumeForm.packageId,
        hours: consumeForm.hours,
        note: consumeForm.note.trim(),
      });
      setStudent(res.student);
      const updated = await api.getConsumeRecords(id);
      setConsumeRecords(updated);
      setShowConsume(false);
      showToast('success', '消课成功');
    } catch (e) {
      setConsumeError(e instanceof Error ? e.message : '消课失败');
    } finally {
      setConsumeSubmitting(false);
    }
  };

  const openRenew = async () => {
    if (!student) return;
    if (packages.length === 0) {
      try {
        const pkgs = await api.getCoursePackages();
        setPackages(pkgs);
      } catch (e) {
        showToast('error', e instanceof Error ? e.message : '获取课程包失败');
        return;
      }
    }
    setRenewForm({
      packageId: packages[0]?.id || '',
      hours: packages[0]?.hours || 10,
    });
    setRenewError(null);
    setShowRenew(true);
  };

  const submitRenew = async () => {
    if (!renewForm.packageId) {
      setRenewError('请选择课程包');
      return;
    }
    if (renewForm.hours < 1) {
      setRenewError('购买课时至少为1');
      return;
    }
    try {
      setRenewSubmitting(true);
      setRenewError(null);
      const res = await api.renewPackage(id, {
        packageId: renewForm.packageId,
        hours: renewForm.hours,
      });
      setStudent(res.student);
      const updated = await api.getRenewRecords(id);
      setRenewRecords(updated);
      setShowRenew(false);
      showToast('success', '续费成功');
    } catch (e) {
      setRenewError(e instanceof Error ? e.message : '续费失败');
    } finally {
      setRenewSubmitting(false);
    }
  };

  const openTransfer = () => {
    if (!student) return;
    const fromPkg = student.packages.find((p) => p.remainingHours > 0) || student.packages[0];
    const otherPkgs = packages.filter((p) => p.id !== fromPkg?.packageId);
    setTransferForm({
      fromPackageId: fromPkg?.packageId || '',
      toPackageId: otherPkgs[0]?.id || '',
      hours: 1,
    });
    setTransferError(null);
    setShowTransfer(true);
  };

  const selectedFromPkg = student?.packages.find(
    (p) => p.packageId === transferForm.fromPackageId
  );
  const maxTransferHours = selectedFromPkg?.remainingHours || 0;

  const submitTransfer = async () => {
    if (!transferForm.fromPackageId) {
      setTransferError('请选择调出课程包');
      return;
    }
    if (!transferForm.toPackageId) {
      setTransferError('请选择目标课程包');
      return;
    }
    if (transferForm.fromPackageId === transferForm.toPackageId) {
      setTransferError('调出和目标课程包不能相同');
      return;
    }
    if (transferForm.hours < 1) {
      setTransferError('调出课时至少为1');
      return;
    }
    if (transferForm.hours > maxTransferHours) {
      setTransferError(`调出课时不能超过剩余课时（${maxTransferHours}）`);
      return;
    }
    try {
      setTransferSubmitting(true);
      setTransferError(null);
      const res = await api.transferHours(id, {
        fromPackageId: transferForm.fromPackageId,
        toPackageId: transferForm.toPackageId,
        hours: transferForm.hours,
      });
      setStudent(res.student);
      const updated = await api.getTransferRecords(id);
      setTransferRecords(updated);
      setShowTransfer(false);
      showToast('success', '调课成功');
    } catch (e) {
      setTransferError(e instanceof Error ? e.message : '调课失败');
    } finally {
      setTransferSubmitting(false);
    }
  };

  const totalRemaining = student
    ? student.packages.reduce((sum, p) => sum + p.remainingHours, 0)
    : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <span className="loading-spinner" />
        <span>加载中学员详情...</span>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">学员详情</h1>
          <button className="back-btn" onClick={onBack}>
            ← 返回列表
          </button>
        </div>
        <div className="toast toast-error" style={{ position: 'static' }}>
          ⚠️ {error || '学员不存在'}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学员详情 · {student.name}</h1>
        <div className="action-buttons">
          <button className="back-btn" onClick={onBack}>
            ← 返回列表
          </button>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-title">
          <span>基本信息</span>
          <div className="action-buttons">
            <button className="btn btn-primary" onClick={openConsume}>
              + 新增消课
            </button>
            <button className="btn btn-secondary" onClick={openRenew}>
              💳 续费
            </button>
            <button className="btn btn-secondary" onClick={openTransfer}>
              🔄 调课
            </button>
          </div>
        </div>
        <div className="student-profile">
          <div className="profile-item">
            <span className="profile-label">学员姓名</span>
            <span className="profile-value">{student.name}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">联系方式</span>
            <span className="profile-value">{student.phone}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">学员状态</span>
            <span className="profile-value">
              <span
                className={`status-badge ${
                  student.status === 'active' ? 'active' : 'inactive'
                }`}
                style={{ display: 'inline-block' }}
              >
                {student.status === 'active' ? '在读' : '已结课'}
              </span>
            </span>
          </div>
          <div className="profile-item">
            <span className="profile-label">总剩余课时</span>
            <span className="profile-value" style={{ color: '#3b82f6' }}>
              {totalRemaining} 课时
            </span>
          </div>
          <div className="profile-item">
            <span className="profile-label">报名时间</span>
            <span className="profile-value">{formatDate(student.createdAt)}</span>
          </div>
          <div className="profile-item">
            <span className="profile-label">最近消课</span>
            <span className="profile-value">
              {student.lastConsumeTime ? formatDate(student.lastConsumeTime) : '暂无'}
            </span>
          </div>
        </div>
      </div>

      <div className="detail-section">
        <div className="section-title">课程包</div>
        <div className="package-cards">
          {student.packages.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              暂无课程包
            </div>
          )}
          {student.packages.map((p) => {
            const pct = p.totalHours > 0 ? (p.remainingHours / p.totalHours) * 100 : 0;
            return (
              <div key={p.packageId} className="package-card">
                <div className="package-card-name">{p.packageName}</div>
                <div className="package-card-hours">{p.remainingHours}</div>
                <div className="package-card-total">
                  剩余 / 共 {p.totalHours} 课时
                </div>
                <div className="package-card-progress">
                  <div
                    className="package-card-progress-bar"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="detail-section">
        <div className="tabs">
          <div
            className={`tab-item ${activeTab === 'consume' ? 'active' : ''}`}
            onClick={() => setActiveTab('consume')}
          >
            课时消耗明细（{consumeRecords.length}）
          </div>
          <div
            className={`tab-item ${activeTab === 'renew' ? 'active' : ''}`}
            onClick={() => setActiveTab('renew')}
          >
            续费历史（{renewRecords.length}）
          </div>
          <div
            className={`tab-item ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            调课历史（{transferRecords.length}）
          </div>
        </div>

        {activeTab === 'consume' && (
          <div>
            {consumeRecords.length === 0 ? (
              <div className="empty-state">暂无消课记录</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>课程包</th>
                    <th>消课课时</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  {consumeRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.timestamp)}</td>
                      <td>{r.packageName}</td>
                      <td>
                        <span className="hours-tag negative">-{r.hours}</span>
                      </td>
                      <td className="history-note">{r.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'renew' && (
          <div>
            {renewRecords.length === 0 ? (
              <div className="empty-state">暂无续费记录</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>课程包</th>
                    <th>增加课时</th>
                  </tr>
                </thead>
                <tbody>
                  {renewRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.timestamp)}</td>
                      <td>{r.packageName}</td>
                      <td>
                        <span className="hours-tag positive">+{r.addedHours}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'transfer' && (
          <div>
            {transferRecords.length === 0 ? (
              <div className="empty-state">暂无调课记录</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>时间</th>
                    <th>调课详情</th>
                    <th>课时数</th>
                  </tr>
                </thead>
                <tbody>
                  {transferRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{formatDate(r.timestamp)}</td>
                      <td>
                        <span>{r.fromPackageName}</span>
                        <span className="transfer-arrow">→</span>
                        <span>{r.toPackageName}</span>
                      </td>
                      <td>
                        <span className="hours-tag positive">{r.hours}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <Modal
        open={showConsume}
        title="新增消课"
        onClose={() => !consumeSubmitting && setShowConsume(false)}
      >
        <div className="form-group">
          <label className="form-label">
            选择课程包 <span className="required">*</span>
          </label>
          <select
            className="form-input"
            value={consumeForm.packageId}
            onChange={(e) => {
              setConsumeForm((f) => ({ ...f, packageId: e.target.value, hours: 1 }));
            }}
            disabled={consumeSubmitting}
          >
            <option value="">请选择课程包</option>
            {student.packages.map((p) => (
              <option
                key={p.packageId}
                value={p.packageId}
                disabled={p.remainingHours <= 0}
              >
                {p.packageName}（剩余 {p.remainingHours} 课时）
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            消课课时 <span className="required">*</span>
          </label>
          <div className="hours-input-wrap">
            <input
              className="form-input"
              type="number"
              min={1}
              max={maxConsumeHours}
              step={1}
              value={consumeForm.hours}
              onChange={(e) =>
                setConsumeForm((f) => ({
                  ...f,
                  hours: Math.max(1, Math.min(maxConsumeHours, parseInt(e.target.value) || 1)),
                }))
              }
              disabled={consumeSubmitting}
            />
            <div className="hours-input-stepper">
              <button
                type="button"
                className="hours-stepper-btn"
                disabled={consumeSubmitting || consumeForm.hours >= maxConsumeHours}
                onClick={() =>
                  setConsumeForm((f) => ({ ...f, hours: Math.min(maxConsumeHours, f.hours + 1) }))
                }
              >
                ▲
              </button>
              <button
                type="button"
                className="hours-stepper-btn"
                disabled={consumeSubmitting || consumeForm.hours <= 1}
                onClick={() =>
                  setConsumeForm((f) => ({ ...f, hours: Math.max(1, f.hours - 1) }))
                }
              >
                ▼
              </button>
            </div>
          </div>
          <div className="form-hint">
            当前课程包剩余 {maxConsumeHours} 课时，最多可消 {maxConsumeHours} 课时
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">备注</label>
          <textarea
            className="form-textarea"
            placeholder="可填写本次消课的原因或内容（选填）"
            value={consumeForm.note}
            onChange={(e) => setConsumeForm((f) => ({ ...f, note: e.target.value }))}
            disabled={consumeSubmitting}
          />
        </div>
        {consumeError && <div className="form-error">{consumeError}</div>}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowConsume(false)}
            disabled={consumeSubmitting}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={submitConsume}
            disabled={consumeSubmitting}
          >
            {consumeSubmitting ? '提交中...' : '确认消课'}
          </button>
        </div>
      </Modal>

      <Modal
        open={showRenew}
        title="续费 / 新增课程包"
        onClose={() => !renewSubmitting && setShowRenew(false)}
      >
        <div className="form-group">
          <label className="form-label">
            选择课程包 <span className="required">*</span>
          </label>
          <select
            className="form-input"
            value={renewForm.packageId}
            onChange={(e) => {
              const pkg = packages.find((p) => p.id === e.target.value);
              setRenewForm((f) => ({
                ...f,
                packageId: e.target.value,
                hours: pkg?.hours || f.hours || 10,
              }));
            }}
            disabled={renewSubmitting}
          >
            <option value="">请选择课程包</option>
            {packages.map((p) => {
              const owned = student.packages.some((sp) => sp.packageId === p.id);
              return (
                <option key={p.id} value={p.id}>
                  {p.name}（{p.hours}课时）{owned ? ' - 已购买，将叠加' : ''}
                </option>
              );
            })}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            购买课时数 <span className="required">*</span>
          </label>
          <div className="hours-input-wrap">
            <input
              className="form-input"
              type="number"
              min={1}
              step={1}
              value={renewForm.hours}
              onChange={(e) =>
                setRenewForm((f) => ({
                  ...f,
                  hours: Math.max(1, parseInt(e.target.value) || 1),
                }))
              }
              disabled={renewSubmitting}
            />
            <div className="hours-input-stepper">
              <button
                type="button"
                className="hours-stepper-btn"
                disabled={renewSubmitting}
                onClick={() => setRenewForm((f) => ({ ...f, hours: f.hours + 1 }))}
              >
                ▲
              </button>
              <button
                type="button"
                className="hours-stepper-btn"
                disabled={renewSubmitting || renewForm.hours <= 1}
                onClick={() =>
                  setRenewForm((f) => ({ ...f, hours: Math.max(1, f.hours - 1) }))
                }
              >
                ▼
              </button>
            </div>
          </div>
          <div className="form-hint">若该学员已有此课程包，课时将累加到原有包中</div>
        </div>
        {renewError && <div className="form-error">{renewError}</div>}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowRenew(false)}
            disabled={renewSubmitting}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={submitRenew}
            disabled={renewSubmitting}
          >
            {renewSubmitting ? '提交中...' : '确认续费'}
          </button>
        </div>
      </Modal>

      <Modal
        open={showTransfer}
        title="调课（课时转移）"
        onClose={() => !transferSubmitting && setShowTransfer(false)}
      >
        <div className="form-group">
          <label className="form-label">
            调出课程包 <span className="required">*</span>
          </label>
          <select
            className="form-input"
            value={transferForm.fromPackageId}
            onChange={(e) =>
              setTransferForm((f) => ({ ...f, fromPackageId: e.target.value, hours: 1 }))
            }
            disabled={transferSubmitting}
          >
            <option value="">请选择调出课程包</option>
            {student.packages.map((p) => (
              <option
                key={p.packageId}
                value={p.packageId}
                disabled={p.remainingHours <= 0}
              >
                {p.packageName}（剩余 {p.remainingHours} 课时）
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            目标课程包 <span className="required">*</span>
          </label>
          <select
            className="form-input"
            value={transferForm.toPackageId}
            onChange={(e) => setTransferForm((f) => ({ ...f, toPackageId: e.target.value }))}
            disabled={transferSubmitting}
          >
            <option value="">请选择目标课程包</option>
            {packages
              .filter((p) => p.id !== transferForm.fromPackageId)
              .map((p) => {
                const owned = student.packages.some((sp) => sp.packageId === p.id);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name}{owned ? '（已拥有）' : '（新购）'}
                  </option>
                );
              })}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">
            调出课时数 <span className="required">*</span>
          </label>
          <div className="hours-input-wrap">
            <input
              className="form-input"
              type="number"
              min={1}
              max={maxTransferHours}
              step={1}
              value={transferForm.hours}
              onChange={(e) =>
                setTransferForm((f) => ({
                  ...f,
                  hours: Math.max(1, Math.min(maxTransferHours, parseInt(e.target.value) || 1)),
                }))
              }
              disabled={transferSubmitting}
            />
            <div className="hours-input-stepper">
              <button
                type="button"
                className="hours-stepper-btn"
                disabled={transferSubmitting || transferForm.hours >= maxTransferHours}
                onClick={() =>
                  setTransferForm((f) => ({
                    ...f,
                    hours: Math.min(maxTransferHours, f.hours + 1),
                  }))
                }
              >
                ▲
              </button>
              <button
                type="button"
                className="hours-stepper-btn"
                disabled={transferSubmitting || transferForm.hours <= 1}
                onClick={() =>
                  setTransferForm((f) => ({ ...f, hours: Math.max(1, f.hours - 1) }))
                }
              >
                ▼
              </button>
            </div>
          </div>
          <div className="form-hint">
            源课程包剩余 {maxTransferHours} 课时，最多可调出 {maxTransferHours} 课时
          </div>
        </div>
        {transferError && <div className="form-error">{transferError}</div>}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowTransfer(false)}
            disabled={transferSubmitting}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={submitTransfer}
            disabled={transferSubmitting}
          >
            {transferSubmitting ? '提交中...' : '确认调课'}
          </button>
        </div>
      </Modal>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.msg}
        </div>
      )}
    </div>
  );
};

export default StudentDetail;
