import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useToast } from '@/App';
import InvoiceForm from '@/components/InvoiceForm';
import type { Invoice, InvoiceFormData, InvoiceStatus } from '@/utils/helpers';

const STATUS_MAP: Record<InvoiceStatus, string> = {
  pending: '待审核',
  approved: '已审核',
  archived: '已归档',
};

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    getInvoiceById,
    addInvoice,
    updateInvoice,
    approveInvoice,
    archiveInvoice,
  } = useInvoiceStore();

  const isNew = id === 'new';
  const [invoice, setInvoice] = useState<Invoice | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [archiving, setArchiving] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      const data = getInvoiceById(id);
      setInvoice(data);
    }
  }, [id, isNew, getInvoiceById]);

  const handleFormSubmit = async (data: InvoiceFormData) => {
    setSubmitting(true);
    try {
      if (isNew) {
        await addInvoice(data);
        showToast('发票创建成功');
      } else if (id) {
        const updateData: Partial<Invoice> = {
          invoiceNo: data.invoiceNo,
          customerName: data.customerName,
          amount: Number(data.amount),
          date: data.date,
          status: data.status,
        };
        await updateInvoice(id, updateData);
        showToast('发票保存成功');
      }
      setTimeout(() => navigate('/invoices'), 500);
    } catch {
      showToast('操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id || invoice?.status !== 'pending') return;
    setApproving(true);
    try {
      const result = await approveInvoice(id);
      if (result) {
        setInvoice(result);
        showToast('发票审核通过');
        setTimeout(() => navigate('/invoices'), 500);
      }
    } catch {
      showToast('操作失败，请重试');
    } finally {
      setApproving(false);
    }
  };

  const handleArchive = async () => {
    if (!id || invoice?.status !== 'approved') return;
    setArchiving(true);
    try {
      const result = await archiveInvoice(id);
      if (result) {
        setInvoice(result);
        showToast('发票已归档');
        setTimeout(() => navigate('/invoices'), 500);
      }
    } catch {
      showToast('操作失败，请重试');
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="page-enter">
      <div className="detail-header">
        <div className="detail-title">
          <button
            className="btn btn-outline"
            onClick={() => navigate('/invoices')}
          >
            <ArrowLeft size={18} />
            返回
          </button>
          {isNew ? (
            <span>新增发票</span>
          ) : invoice ? (
            <>
              <span>{invoice.invoiceNo}</span>
              <span className={`status-badge status-${invoice.status}`}>
                {STATUS_MAP[invoice.status]}
              </span>
            </>
          ) : (
            <span>加载中...</span>
          )}
        </div>

        {!isNew && invoice && (
          <div className="detail-actions">
            <button
              className="btn btn-success"
              onClick={handleApprove}
              disabled={invoice.status !== 'pending' || approving}
            >
              {approving && <span className="spinner" />}
              {approving ? '审核中...' : '审核通过'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleArchive}
              disabled={invoice.status !== 'approved' || archiving}
            >
              {archiving && <span className="spinner" />}
              {archiving ? '归档中...' : '归档'}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        {(isNew || invoice) && (
          <InvoiceForm
            initialData={invoice ?? null}
            onSubmit={handleFormSubmit}
            submitText={isNew ? '创建发票' : '保存修改'}
            loading={submitting}
          />
        )}
      </div>
    </div>
  );
}
