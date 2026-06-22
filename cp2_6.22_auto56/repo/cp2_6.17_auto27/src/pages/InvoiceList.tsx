import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useInvoiceStore } from '@/store/invoiceStore';
import type { Invoice, InvoiceStatus } from '@/utils/helpers';
import { formatCurrency } from '@/utils/helpers';
import { useToast } from '@/App';

type SortField = 'invoiceNo' | 'amount' | 'date';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | InvoiceStatus;
type DialogType = 'delete' | 'batchDelete' | 'batchArchive' | null;

const STATUS_MAP: Record<InvoiceStatus, string> = {
  pending: '待审核',
  approved: '已审核',
  archived: '已归档',
};

const PAGE_SIZE = 10;

interface DialogState {
  type: DialogType;
  targetInvoice?: Invoice | null;
}

export default function InvoiceList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const invoices = useInvoiceStore((state) => state.invoices);
  const deleteInvoice = useInvoiceStore((state) => state.deleteInvoice);
  const archiveInvoice = useInvoiceStore((state) => state.archiveInvoice);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [jumpPage, setJumpPage] = useState('');
  const [dialog, setDialog] = useState<DialogState>({ type: null, targetInvoice: null });
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredAndSortedInvoices = useMemo(() => {
    let result = [...invoices];

    if (filter !== 'all') {
      result = result.filter((inv) => inv.status === filter);
    }

    if (searchKeyword.trim()) {
      const keyword = searchKeyword.trim().toLowerCase();
      result = result.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(keyword) ||
          inv.customerName.toLowerCase().includes(keyword)
      );
    }

    result.sort((a, b) => {
      let compareResult = 0;
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        compareResult = aVal - bVal;
      } else {
        compareResult = String(aVal).localeCompare(String(bVal), 'zh-CN');
      }

      return sortOrder === 'asc' ? compareResult : -compareResult;
    });

    return result;
  }, [invoices, filter, searchKeyword, sortField, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedInvoices.length / PAGE_SIZE));

  const pagedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSortedInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredAndSortedInvoices, currentPage]);

  const allSelected = useMemo(() => {
    if (pagedInvoices.length === 0) return false;
    return pagedInvoices.every((inv) => selectedIds.has(inv.id));
  }, [pagedInvoices, selectedIds]);

  const selectedCount = selectedIds.size;

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchKeyword]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="sort-arrow" style={{ opacity: 0.3 }}>▲</span>;
    }
    return (
      <span className="sort-arrow">
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  const handleRowClick = (invoice: Invoice, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-click')) return;
    navigate(`/invoices/${invoice.id}`);
  };

  const handleEditClick = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/invoices/${invoice.id}`);
  };

  const handleDeleteClick = (invoice: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setDialog({ type: 'delete', targetInvoice: invoice });
  };

  const handleBatchDelete = () => {
    setDialog({ type: 'batchDelete', targetInvoice: null });
  };

  const handleBatchArchive = () => {
    setDialog({ type: 'batchArchive', targetInvoice: null });
  };

  const handleToggleSelect = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedInvoices.forEach((inv) => next.delete(inv.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        pagedInvoices.forEach((inv) => next.add(inv.id));
        return next;
      });
    }
  };

  const closeDialog = () => {
    if (isProcessing) return;
    setDialog({ type: null, targetInvoice: null });
  };

  const confirmDelete = async () => {
    if (!dialog.targetInvoice || isProcessing) return;
    setIsProcessing(true);
    try {
      await deleteInvoice(dialog.targetInvoice.id);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(dialog.targetInvoice!.id);
        return next;
      });
      showToast('发票删除成功');
      closeDialog();
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmBatchDelete = async () => {
    if (selectedIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(ids.map((id) => deleteInvoice(id)));
      setSelectedIds(new Set());
      showToast(`成功删除 ${ids.length} 条发票`);
      closeDialog();
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmBatchArchive = async () => {
    if (selectedIds.size === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const approvedIds = Array.from(selectedIds).filter((id) => {
        const inv = invoices.find((i) => i.id === id);
        return inv && inv.status === 'approved';
      });
      const result = await Promise.all(approvedIds.map((id) => archiveInvoice(id)));
      const archivedCount = result.filter(Boolean).length;
      setSelectedIds(new Set());
      if (archivedCount > 0) {
        showToast(`成功归档 ${archivedCount} 条发票`);
      } else {
        showToast('未找到可归档的发票（仅"已审核"状态可归档）');
      }
      closeDialog();
    } finally {
      setIsProcessing(false);
    }
  };

  const goToPage = (page: number) => {
    const target = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(target);
    setJumpPage('');
  };

  const handleJumpPage = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(jumpPage, 10);
      if (!isNaN(num)) {
        goToPage(num);
      }
    }
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    const pages: (number | 'ellipsis')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (currentPage > 3) pages.push('ellipsis');
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };

  const startItem = filteredAndSortedInvoices.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(currentPage * PAGE_SIZE, filteredAndSortedInvoices.length);

  return (
    <div className="page-enter">
      <div className="page-header">
        <h1 className="page-title">发票管理</h1>
        <button
          className="btn btn-success"
          onClick={() => navigate('/invoices/new')}
        >
          <Plus size={18} />
          新增发票
        </button>
      </div>

      <div className="filter-bar">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          全部
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          待审核
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          已审核
        </button>
        <button
          className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
          onClick={() => setFilter('archived')}
        >
          已归档
        </button>

        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#7F8C8D',
            }}
          />
          <input
            type="text"
            className="search-input"
            placeholder="搜索发票号或客户名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="batch-bar">
          <span className="batch-bar-info">已选择 {selectedCount} 项</span>
          <div className="batch-bar-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleBatchArchive}
            >
              批量归档
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBatchDelete}
            >
              批量删除
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => setSelectedIds(new Set())}
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      <div className="table-wrapper">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="no-click" style={{ width: '48px' }}>
                  <input
                    type="checkbox"
                    className="header-checkbox"
                    checked={allSelected}
                    onChange={handleToggleSelectAll}
                  />
                </th>
                <th onClick={() => handleSort('invoiceNo')}>
                  发票号
                  <SortIndicator field="invoiceNo" />
                </th>
                <th>客户名称</th>
                <th onClick={() => handleSort('amount')}>
                  金额
                  <SortIndicator field="amount" />
                </th>
                <th onClick={() => handleSort('date')}>
                  日期
                  <SortIndicator field="date" />
                </th>
                <th>状态</th>
                <th className="no-click" style={{ width: '130px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📋</span>
                      <span className="empty-state-text">暂无发票数据</span>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={(e) => handleRowClick(invoice, e)}
                  >
                    <td className="no-click" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="row-checkbox"
                        checked={selectedIds.has(invoice.id)}
                        onChange={(e) => handleToggleSelect(invoice.id, e)}
                      />
                    </td>
                    <td>{invoice.invoiceNo}</td>
                    <td>{invoice.customerName}</td>
                    <td>¥{formatCurrency(invoice.amount)}</td>
                    <td>{invoice.date}</td>
                    <td>
                      <span className={`status-badge status-${invoice.status}`}>
                        {STATUS_MAP[invoice.status]}
                      </span>
                    </td>
                    <td className="no-click" onClick={(e) => e.stopPropagation()}>
                      <div className="row-actions">
                        <button
                          className="row-action-btn row-action-edit"
                          onClick={(e) => handleEditClick(invoice, e)}
                        >
                          编辑
                        </button>
                        <button
                          className="row-action-btn row-action-delete"
                          onClick={(e) => handleDeleteClick(invoice, e)}
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAndSortedInvoices.length > 0 && (
          <div className="pagination">
            <span className="pagination-info">
              显示 {startItem}-{endItem} 条，共 {filteredAndSortedInvoices.length} 条
            </span>
            <button
              className="pagination-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {getPageNumbers().map((p, idx) =>
              p === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="pagination-ellipsis">...</span>
              ) : (
                <button
                  key={p}
                  className={`pagination-btn ${p === currentPage ? 'active' : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              )
            )}

            <button
              className="pagination-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>

            <div className="pagination-jump">
              <span>跳至</span>
              <input
                type="text"
                value={jumpPage}
                onChange={(e) => setJumpPage(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleJumpPage}
                placeholder="页码"
              />
              <span>页</span>
            </div>
          </div>
        )}
      </div>

      {dialog.type && (
        <div className="modal-overlay" onClick={closeDialog}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {dialog.type === 'delete' && '删除发票'}
                {dialog.type === 'batchDelete' && '批量删除发票'}
                {dialog.type === 'batchArchive' && '批量归档发票'}
              </span>
              <button className="modal-close" onClick={closeDialog} disabled={isProcessing}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {dialog.type === 'delete' && (
                <p>确定要删除发票 <strong>{dialog.targetInvoice?.invoiceNo}</strong> 吗？此操作不可恢复。</p>
              )}
              {dialog.type === 'batchDelete' && (
                <p>确定要删除选中的 <strong>{selectedIds.size}</strong> 条发票吗？此操作不可恢复。</p>
              )}
              {dialog.type === 'batchArchive' && (
                <p>将选中的 <strong>{selectedIds.size}</strong> 条发票归档（仅"已审核"状态的发票会被归档）。确定要继续吗？</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={closeDialog}
                disabled={isProcessing}
              >
                取消
              </button>
              {dialog.type === 'delete' && (
                <button
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? <span className="spinner" /> : '确认删除'}
                </button>
              )}
              {dialog.type === 'batchDelete' && (
                <button
                  className="btn btn-danger"
                  onClick={confirmBatchDelete}
                  disabled={isProcessing}
                >
                  {isProcessing ? <span className="spinner" /> : '确认删除'}
                </button>
              )}
              {dialog.type === 'batchArchive' && (
                <button
                  className="btn btn-primary"
                  onClick={confirmBatchArchive}
                  disabled={isProcessing}
                >
                  {isProcessing ? <span className="spinner" /> : '确认归档'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
