import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { useInvoiceStore } from '@/store/invoiceStore';
import type { Invoice, InvoiceStatus } from '@/utils/helpers';
import { formatCurrency } from '@/utils/helpers';

type SortField = 'invoiceNo' | 'customerName' | 'amount' | 'date' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterType = 'all' | InvoiceStatus;

const STATUS_MAP: Record<InvoiceStatus, string> = {
  pending: '待审核',
  approved: '已审核',
  archived: '已归档',
};

export default function InvoiceList() {
  const navigate = useNavigate();
  const invoices = useInvoiceStore((state) => state.invoices);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

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

  const handleRowClick = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

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

      <div className="table-wrapper">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => handleSort('invoiceNo')}>
                  发票号
                  <SortIndicator field="invoiceNo" />
                </th>
                <th onClick={() => handleSort('customerName')}>
                  客户名称
                  <SortIndicator field="customerName" />
                </th>
                <th onClick={() => handleSort('amount')}>
                  金额
                  <SortIndicator field="amount" />
                </th>
                <th onClick={() => handleSort('date')}>
                  日期
                  <SortIndicator field="date" />
                </th>
                <th onClick={() => handleSort('status')}>
                  状态
                  <SortIndicator field="status" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <span className="empty-state-icon">📋</span>
                      <span className="empty-state-text">暂无发票数据</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => handleRowClick(invoice)}
                  >
                    <td>{invoice.invoiceNo}</td>
                    <td>{invoice.customerName}</td>
                    <td>¥{formatCurrency(invoice.amount)}</td>
                    <td>{invoice.date}</td>
                    <td>
                      <span className={`status-badge status-${invoice.status}`}>
                        {STATUS_MAP[invoice.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
