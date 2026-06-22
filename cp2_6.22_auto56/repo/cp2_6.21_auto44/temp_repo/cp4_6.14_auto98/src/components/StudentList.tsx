import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { api } from '../api';
import type { Student, CoursePackage } from '../types';
import Modal from './Modal';

interface StudentListProps {
  onSelectStudent: (id: string) => void;
}

const formatDate = (iso: string | null): string => {
  if (!iso) return '暂无';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const StudentList: React.FC<StudentListProps> = ({ onSelectStudent }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [packages, setPackages] = useState<CoursePackage[]>([]);
  const [addForm, setAddForm] = useState({ name: '', phone: '', packageId: '' });
  const [addError, setAddError] = useState<string | null>(null);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const debouncedSearch = useDebounce(search, 200);
  const fetchRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const reqId = ++fetchRef.current;
      try {
        setLoading(true);
        const data = await api.getStudents({
          search: debouncedSearch,
          status,
          sort,
          page,
          pageSize,
        });
        if (!cancelled && reqId === fetchRef.current) {
          setStudents(data.list);
          setTotal(data.total);
          setError(null);
        }
      } catch (e) {
        if (!cancelled && reqId === fetchRef.current) {
          setError(e instanceof Error ? e.message : '加载失败');
        }
      } finally {
        if (!cancelled && reqId === fetchRef.current) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, status, sort, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, sort]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 2500);
  }, []);

  const openAddModal = async () => {
    try {
      if (packages.length === 0) {
        const pkgs = await api.getCoursePackages();
        setPackages(pkgs);
      }
      setAddForm({
        name: '',
        phone: '',
        packageId: packages[0]?.id || '',
      });
      setAddError(null);
      setShowAddModal(true);
    } catch (e) {
      showToast('error', e instanceof Error ? e.message : '获取课程包失败');
    }
  };

  const submitAdd = async () => {
    if (!addForm.name.trim()) {
      setAddError('请输入学员姓名');
      return;
    }
    if (!addForm.phone.trim()) {
      setAddError('请输入联系方式');
      return;
    }
    if (!addForm.packageId) {
      setAddError('请选择报名课程包');
      return;
    }
    try {
      setAddSubmitting(true);
      setAddError(null);
      await api.createStudent({
        name: addForm.name.trim(),
        phone: addForm.phone.trim(),
        packageId: addForm.packageId,
      });
      setShowAddModal(false);
      showToast('success', '学员添加成功');
      const reqId = ++fetchRef.current;
      const data = await api.getStudents({ search: debouncedSearch, status, sort, page, pageSize });
      if (reqId === fetchRef.current) {
        setStudents(data.list);
        setTotal(data.total);
      }
    } catch (e) {
      setAddError(e instanceof Error ? e.message : '添加失败');
    } finally {
      setAddSubmitting(false);
    }
  };

  const renderPageButtons = () => {
    const buttons: React.ReactNode[] = [];
    const range = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - range && i <= page + range)) {
        buttons.push(
          <button
            key={i}
            className={`pagination-btn ${i === page ? 'active' : ''}`}
            onClick={() => setPage(i)}
            disabled={i === page}
          >
            {i}
          </button>
        );
      } else if (i === page - range - 1 || i === page + range + 1) {
        buttons.push(
          <span key={`dot-${i}`} className="pagination-info">
            …
          </span>
        );
      }
    }
    return buttons;
  };

  const getHoursBadgeClass = (remaining: number, total: number) => {
    const ratio = total > 0 ? remaining / total : 0;
    if (remaining <= 0) return 'hours-danger';
    if (ratio <= 0.2 || remaining <= 5) return 'hours-warning';
    return '';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">学员管理</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          + 添加学员
        </button>
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="搜索学员姓名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="select-input"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">全部状态</option>
          <option value="active">在读</option>
          <option value="inactive">已结课</option>
        </select>
        <select
          className="select-input"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="">默认排序</option>
          <option value="hours_desc">剩余课时 从高到低</option>
          <option value="hours_asc">剩余课时 从低到高</option>
        </select>
      </div>

      {error && (
        <div style={{ marginBottom: 16 }}>
          <div className="toast toast-error" style={{ position: 'static' }}>
            ⚠️ {error}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <span className="loading-spinner" />
          <span>加载中...</span>
        </div>
      )}

      {!loading && students.length === 0 && (
        <div className="empty-state">暂无学员数据</div>
      )}

      {!loading && students.length > 0 && (
        <>
          <div className="student-grid">
            {students.map((s) => {
              const totalHours = s.packages.reduce((sum, p) => sum + p.totalHours, 0);
              const remaining = s.packages.reduce((sum, p) => sum + p.remainingHours, 0);
              return (
                <div
                  key={s.id}
                  className="student-card"
                  onClick={() => onSelectStudent(s.id)}
                >
                  <div className="card-header">
                    <div className="student-name">{s.name}</div>
                    <span
                      className={`status-badge ${s.status === 'active' ? 'active' : 'inactive'}`}
                    >
                      {s.status === 'active' ? '在读' : '已结课'}
                    </span>
                  </div>
                  <div className="student-info">
                    <div className="info-row">
                      <span className="info-label">联系方式</span>
                      <span>{s.phone}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">剩余课时</span>
                      <span
                        className={`hours-badge ${getHoursBadgeClass(remaining, totalHours)}`}
                      >
                        {remaining} 课时
                      </span>
                    </div>
                  </div>
                  <div className="packages-list">
                    {s.packages.map((p) => (
                      <div key={p.packageId} className="package-item">
                        <span>{p.packageName}</span>
                        <span>
                          {p.remainingHours}/{p.totalHours}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="last-consume">
                    最近消课：{formatDate(s.lastConsumeTime)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              上一页
            </button>
            {renderPageButtons()}
            <button
              className="pagination-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              下一页
            </button>
            <span className="pagination-info">
              共 {total} 条，第 {page}/{totalPages} 页
            </span>
          </div>
        </>
      )}

      <Modal
        open={showAddModal}
        title="添加新学员"
        onClose={() => !addSubmitting && setShowAddModal(false)}
      >
        <div className="form-group">
          <label className="form-label">
            学员姓名 <span className="required">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="请输入姓名"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            disabled={addSubmitting}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            联系方式 <span className="required">*</span>
          </label>
          <input
            className="form-input"
            type="text"
            placeholder="请输入手机号"
            value={addForm.phone}
            onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
            disabled={addSubmitting}
          />
        </div>
        <div className="form-group">
          <label className="form-label">
            报名课程包 <span className="required">*</span>
          </label>
          <select
            className="form-input"
            value={addForm.packageId}
            onChange={(e) => setAddForm((f) => ({ ...f, packageId: e.target.value }))}
            disabled={addSubmitting}
          >
            <option value="">请选择课程包</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}（{p.hours}课时）
              </option>
            ))}
          </select>
          <div className="form-hint">初始课时将自动计入所选课程包</div>
        </div>
        {addError && <div className="form-error">{addError}</div>}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowAddModal(false)}
            disabled={addSubmitting}
          >
            取消
          </button>
          <button
            className="btn btn-primary"
            onClick={submitAdd}
            disabled={addSubmitting}
          >
            {addSubmitting ? '提交中...' : '确认添加'}
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

export default StudentList;
