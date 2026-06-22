import React, { useState, useEffect, useCallback } from 'react';
import { Plus, X, Mail, Calendar, DollarSign, User, FileText } from 'lucide-react';
import InvoiceCard from './components/InvoiceCard';
import ClientPanel from './components/ClientPanel';
import NotificationModal from './components/NotificationModal';
import type { Invoice, Client } from './utils/storage';
import {
  fetchInvoicesFromAPI,
  fetchClientsFromAPI,
  updateInvoiceAPI,
  createInvoiceAPI
} from './utils/storage';
import {
  checkOverdueInvoices,
  updateInvoiceStatus,
  generateReminderText,
  getStatusColor,
  getStatusText,
  formatCurrency,
  formatDate,
  calculateOverdueDays
} from './utils/invoiceLogic';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pulsingIds, setPulsingIds] = useState<Set<string>>(new Set());
  const [showNotification, setShowNotification] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [reminderInvoiceNumber, setReminderInvoiceNumber] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newInvoice, setNewInvoice] = useState({
    clientName: '',
    clientEmail: '',
    projectDescription: '',
    amount: '',
    currency: 'CNY',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'pending' as 'draft' | 'pending' | 'paid' | 'overdue'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [invoicesData, clientsData] = await Promise.all([
          fetchInvoicesFromAPI(),
          fetchClientsFromAPI()
        ]);
        
        const { updated, changedIds } = checkOverdueInvoices(invoicesData);
        
        if (changedIds.length > 0) {
          for (const id of changedIds) {
            const invoice = updated.find(inv => inv.id === id);
            if (invoice) {
              await updateInvoiceAPI(id, {
                status: invoice.status,
                paymentHistory: invoice.paymentHistory,
                updatedAt: invoice.updatedAt
              });
            }
          }
          setPulsingIds(new Set(changedIds));
          setTimeout(() => setPulsingIds(new Set()), 500);
        }
        
        setInvoices(updated);
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { updated, changedIds } = checkOverdueInvoices(invoices);
      
      if (changedIds.length > 0) {
        for (const id of changedIds) {
          const invoice = updated.find(inv => inv.id === id);
          if (invoice) {
            await updateInvoiceAPI(id, {
              status: invoice.status,
              paymentHistory: invoice.paymentHistory,
              updatedAt: invoice.updatedAt
            });
          }
        }
        setInvoices(updated);
        setPulsingIds(new Set(changedIds));
        setTimeout(() => setPulsingIds(new Set()), 500);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [invoices]);

  const filteredInvoices = invoices.filter(invoice => {
    const clientMatch = selectedClient === null || invoice.clientName === selectedClient;
    const statusMatch = statusFilter === 'all' || invoice.status === statusFilter;
    return clientMatch && statusMatch;
  });

  const handleStatusChange = useCallback(async (invoice: Invoice, newStatus: 'draft' | 'pending' | 'paid' | 'overdue') => {
    const updatedInvoice = updateInvoiceStatus(invoice, newStatus);
    await updateInvoiceAPI(invoice.id, {
      status: newStatus,
      paymentHistory: updatedInvoice.paymentHistory,
      updatedAt: updatedInvoice.updatedAt
    });
    
    setInvoices(prev => prev.map(inv => 
      inv.id === invoice.id ? updatedInvoice : inv
    ));
    
    if (selectedInvoice?.id === invoice.id) {
      setSelectedInvoice(updatedInvoice);
    }
    
    setPulsingIds(prev => new Set([...prev, invoice.id]));
    setTimeout(() => {
      setPulsingIds(prev => {
        const next = new Set(prev);
        next.delete(invoice.id);
        return next;
      });
    }, 500);

    const clientsData = await fetchClientsFromAPI();
    setClients(clientsData);
  }, [selectedInvoice]);

  const handleGenerateReminder = useCallback((invoice: Invoice) => {
    const text = generateReminderText(invoice);
    setReminderText(text);
    setReminderInvoiceNumber(invoice.invoiceNumber);
    setShowNotification(true);
  }, []);

  const handleCreateInvoice = useCallback(async () => {
    if (!newInvoice.clientName || !newInvoice.amount || !newInvoice.projectDescription) {
      alert('请填写完整信息');
      return;
    }

    try {
      const created = await createInvoiceAPI({
        clientName: newInvoice.clientName,
        clientEmail: newInvoice.clientEmail,
        projectDescription: newInvoice.projectDescription,
        amount: parseFloat(newInvoice.amount),
        currency: newInvoice.currency,
        invoiceDate: newInvoice.invoiceDate,
        dueDate: newInvoice.dueDate,
        status: newInvoice.status
      });

      setInvoices(prev => [...prev, created]);
      
      const clientsData = await fetchClientsFromAPI();
      setClients(clientsData);

      setShowCreateModal(false);
      setNewInvoice({
        clientName: '',
        clientEmail: '',
        projectDescription: '',
        amount: '',
        currency: 'CNY',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending'
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  }, [newInvoice]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F3F4F6' }}>
        <div style={{ fontSize: '18px', color: '#6B7280' }}>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F3F4F6' }}>
      <ClientPanel
        clients={clients}
        selectedClient={selectedClient}
        statusFilter={statusFilter}
        onClientSelect={(name) => {
          setSelectedClient(name);
          setIsMobileMenuOpen(false);
        }}
        onStatusFilterChange={setStatusFilter}
        isMobileOpen={isMobileMenuOpen}
        onMobileToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="main-content">
        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: '#111827' }}>
                {selectedClient ? `${selectedClient} 的发票` : '所有发票'}
              </h2>
              <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0 0' }}>
                共 {filteredInvoices.length} 张发票
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#1E3A5F',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'background-color 0.2s ease',
                boxShadow: '2px 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#162D4A';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1E3A5F';
              }}
            >
              <Plus size={18} />
              新建发票
            </button>
          </div>

          {filteredInvoices.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              backgroundColor: '#fff', 
              borderRadius: '12px',
              boxShadow: '2px 4px 12px rgba(0,0,0,0.1)'
            }}>
              <FileText size={48} style={{ color: '#D1D5DB', marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', color: '#6B7280', margin: 0 }}>暂无发票</p>
              <p style={{ fontSize: '14px', color: '#9CA3AF', margin: '8px 0 0 0' }}>点击右上角按钮创建第一张发票</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, 300px)', 
              gap: '20px',
              justifyContent: 'flex-start'
            }}>
              {filteredInvoices.map((invoice, index) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  index={index}
                  isSelected={selectedInvoice?.id === invoice.id}
                  isPulsing={pulsingIds.has(invoice.id)}
                  onClick={() => setSelectedInvoice(invoice)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            width: '460px',
            maxWidth: '100vw',
            height: '100vh',
            backgroundColor: '#fff',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            transform: 'translateX(100%)',
            animation: 'slideInRight 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            zIndex: 200,
            overflowY: 'auto'
          }}
        >
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0, color: '#111827' }}>
                发票详情
              </h3>
              <button
                onClick={() => setSelectedInvoice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#6B7280',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ 
              padding: '20px', 
              borderRadius: '12px', 
              backgroundColor: '#F9FAFB',
              marginBottom: '24px',
              border: '1px solid #E5E7EB'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827' }}>
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                    {formatCurrency(selectedInvoice.amount, selectedInvoice.currency)}
                  </div>
                </div>
                <span
                  style={{
                    padding: '6px 14px',
                    borderRadius: '14px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#fff',
                    backgroundColor: getStatusColor(selectedInvoice.status)
                  }}
                >
                  {getStatusText(selectedInvoice.status)}
                </span>
              </div>

              {selectedInvoice.status === 'overdue' && (
                <div style={{ fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>
                  已逾期 {calculateOverdueDays(selectedInvoice.dueDate)} 天
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                    <User size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    客户
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                    {selectedInvoice.clientName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>
                    {selectedInvoice.clientEmail}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                    <DollarSign size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    币种
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                    {selectedInvoice.currency}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    发票日期
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {formatDate(selectedInvoice.invoiceDate)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    到期日
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {formatDate(selectedInvoice.dueDate)}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '4px' }}>
                  <FileText size={12} style={{ display: 'inline', marginRight: '4px' }} />
                  项目描述
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {selectedInvoice.projectDescription}
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
                状态操作
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(['draft', 'pending', 'paid', 'overdue'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(selectedInvoice, status)}
                    disabled={selectedInvoice.status === status}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: selectedInvoice.status === status ? `2px solid ${getStatusColor(status)}` : '1px solid #D1D5DB',
                      backgroundColor: selectedInvoice.status === status ? `${getStatusColor(status)}15` : '#fff',
                      color: selectedInvoice.status === status ? getStatusColor(status) : '#374151',
                      fontSize: '13px',
                      fontWeight: 500,
                      cursor: selectedInvoice.status === status ? 'default' : 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedInvoice.status !== status) {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                        e.currentTarget.style.borderColor = getStatusColor(status);
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedInvoice.status !== status) {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#D1D5DB';
                      }
                    }}
                  >
                    {getStatusText(status)}
                  </button>
                ))}
              </div>
            </div>

            {selectedInvoice.status === 'overdue' && (
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={() => handleGenerateReminder(selectedInvoice)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#EF4444',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#DC2626';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#EF4444';
                  }}
                >
                  <Mail size={16} />
                  生成催款通知
                </button>
              </div>
            )}

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px 0', color: '#111827' }}>
                付款记录
              </h4>
              <div style={{ position: 'relative', paddingLeft: '24px' }}>
                {selectedInvoice.paymentHistory.map((record, index) => (
                  <div key={record.id} style={{ position: 'relative', paddingBottom: index < selectedInvoice.paymentHistory.length - 1 ? '20px' : 0 }}>
                    {index < selectedInvoice.paymentHistory.length - 1 && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '-18px',
                          top: '12px',
                          bottom: '-8px',
                          width: '2px',
                          backgroundColor: '#D1D5DB'
                        }}
                      />
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-24px',
                        top: '4px',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        backgroundColor: getStatusColor(record.status),
                        border: '3px solid #fff',
                        boxShadow: '0 0 0 1px #D1D5DB'
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                        {getStatusText(record.status)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
                        {formatDate(record.timestamp)} {new Date(record.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {record.note && (
                        <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                          {record.note}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <div
          className="detail-overlay"
          onClick={() => setSelectedInvoice(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 150,
            animation: 'fadeIn 0.3s ease'
          }}
        />
      )}

      <NotificationModal
        isOpen={showNotification}
        onClose={() => setShowNotification(false)}
        invoiceNumber={reminderInvoiceNumber}
        reminderText={reminderText}
      />

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            style={{
              width: '560px',
              maxWidth: '90vw',
              backgroundColor: '#fff',
              borderRadius: '16px',
              boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
              padding: '32px',
              maxHeight: '85vh',
              overflowY: 'auto',
              animation: 'slideUp 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600, margin: 0, color: '#1F2937' }}>
                新建发票
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '6px',
                  color: '#6B7280',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  客户名称 *
                </label>
                <input
                  type="text"
                  value={newInvoice.clientName}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="请输入客户名称"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  客户邮箱
                </label>
                <input
                  type="email"
                  value={newInvoice.clientEmail}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, clientEmail: e.target.value }))}
                  placeholder="请输入客户邮箱"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  项目描述 *
                </label>
                <textarea
                  value={newInvoice.projectDescription}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, projectDescription: e.target.value }))}
                  placeholder="请输入项目描述"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  金额 *
                </label>
                <input
                  type="number"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  币种
                </label>
                <select
                  value={newInvoice.currency}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, currency: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                >
                  <option value="CNY">人民币 (CNY)</option>
                  <option value="USD">美元 (USD)</option>
                  <option value="EUR">欧元 (EUR)</option>
                  <option value="GBP">英镑 (GBP)</option>
                  <option value="JPY">日元 (JPY)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  发票日期
                </label>
                <input
                  type="date"
                  value={newInvoice.invoiceDate}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  到期日
                </label>
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, dueDate: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px', display: 'block' }}>
                  初始状态
                </label>
                <select
                  value={newInvoice.status}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, status: e.target.value as 'draft' | 'pending' | 'paid' | 'overdue' }))}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    backgroundColor: '#fff',
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1E3A5F';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#D1D5DB';
                  }}
                >
                  <option value="draft">草稿</option>
                  <option value="pending">待付款</option>
                  <option value="paid">已付款</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #D1D5DB',
                  backgroundColor: '#fff',
                  color: '#374151',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateInvoice}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#1E3A5F',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#162D4A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1E3A5F';
                }}
              >
                创建发票
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
