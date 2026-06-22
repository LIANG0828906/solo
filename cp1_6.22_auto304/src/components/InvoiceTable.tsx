import React, { useCallback, useMemo } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from './common/Badge';
import { usePagination } from '@/hooks/usePagination';
import type { Invoice, InvoiceStatus } from '@/types';
import { InvoiceManager } from '@/InvoiceManager';

interface InvoiceTableProps {
  invoices: Invoice[];
  invoiceManager: InvoiceManager;
  onStatusChange: (id: string, status: InvoiceStatus) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = React.memo(
  ({ invoices, invoiceManager, onStatusChange }) => {
    const {
      currentItems: paginatedInvoices,
      currentPage,
      totalPages,
      shouldPaginate,
      nextPage,
      prevPage,
    } = usePagination(invoices, 10);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('zh-CN');
    };

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.4);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s ease-out;
        pointer-events: none;
      `;

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    };

    const handleStatusClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>, invoice: Invoice) => {
        handleRipple(e);
        const nextStatus = invoiceManager.getNextStatus(invoice.status);
        onStatusChange(invoice.id, nextStatus);
      },
      [invoiceManager, onStatusChange]
    );

    const tableContent = useMemo(
      () => (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#2A2A2A' }}>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                }}
              >
                发票号
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                }}
              >
                项目名称
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                }}
              >
                金额
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                }}
              >
                开票日期
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'center',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                }}
              >
                状态
              </th>
              <th
                style={{
                  padding: '12px 16px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#E0E0E0',
                }}
              >
                逾期天数
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedInvoices.map((invoice, index) => {
              const isOverdue = invoiceManager.isOverdue(invoice);
              const overdueDays = invoiceManager.getOverdueDays(invoice);
              const statusColor = invoiceManager.getStatusColor(invoice.status);
              const statusLabel = invoiceManager.getStatusLabel(invoice.status);

              return (
                <tr
                  key={invoice.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#1E1E1E' : '#2A2A2A',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor =
                      index % 2 === 0 ? '#1E1E1E' : '#2A2A2A';
                  }}
                >
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#E0E0E0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    {isOverdue && (
                      <AlertCircle
                        size={16}
                        style={{
                          color: '#F44336',
                          animation: 'pulse 1s ease-in-out infinite',
                        }}
                      />
                    )}
                    {invoice.invoiceNumber}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#E0E0E0',
                    }}
                  >
                    {invoice.projectName}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#E0E0E0',
                      textAlign: 'right',
                    }}
                  >
                    {formatCurrency(invoice.amount)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      color: '#9E9E9E',
                      textAlign: 'center',
                    }}
                  >
                    {formatDate(invoice.invoiceDate)}
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <button
                      onClick={(e) => handleStatusClick(e, invoice)}
                      style={{
                        position: 'relative',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        overflow: 'visible',
                        minHeight: '32px',
                      }}
                    >
                      <Badge
                        status={invoice.status}
                        label={statusLabel}
                        color={statusColor}
                      />
                    </button>
                  </td>
                  <td
                    style={{
                      padding: '12px 16px',
                      fontSize: '14px',
                      textAlign: 'right',
                      color: isOverdue ? '#F44336' : '#9E9E9E',
                      fontWeight: isOverdue ? 600 : 400,
                    }}
                  >
                    {isOverdue ? `${overdueDays} 天` : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ),
      [paginatedInvoices, invoiceManager, handleStatusClick]
    );

    return (
      <div
        style={{
          backgroundColor: '#1E1E1E',
          borderRadius: '8px',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease',
        }}
      >
        <div style={{ overflowX: 'auto' }}>{tableContent}</div>

        {shouldPaginate && totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              borderTop: '1px solid #2A2A2A',
            }}
          >
            <button
              onClick={prevPage}
              disabled={currentPage === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                backgroundColor: currentPage === 1 ? '#2A2A2A' : '#333333',
                color: currentPage === 1 ? '#666666' : '#E0E0E0',
                border: '1px solid #333333',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '40px',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== 1) {
                  e.currentTarget.style.backgroundColor = '#3A3A3A';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  currentPage === 1 ? '#2A2A2A' : '#333333';
              }}
            >
              <ChevronLeft size={16} />
              上一页
            </button>
            <span style={{ fontSize: '14px', color: '#9E9E9E' }}>
              第 {currentPage} 页 / 共 {totalPages} 页
            </span>
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                backgroundColor: currentPage === totalPages ? '#2A2A2A' : '#333333',
                color: currentPage === totalPages ? '#666666' : '#E0E0E0',
                border: '1px solid #333333',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                minHeight: '40px',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== totalPages) {
                  e.currentTarget.style.backgroundColor = '#3A3A3A';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor =
                  currentPage === totalPages ? '#2A2A2A' : '#333333';
              }}
            >
              下一页
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {invoices.length === 0 && (
          <div
            style={{
              padding: '48px',
              textAlign: 'center',
              color: '#9E9E9E',
              fontSize: '14px',
            }}
          >
            暂无发票数据
          </div>
        )}
      </div>
    );
  }
);

InvoiceTable.displayName = 'InvoiceTable';
