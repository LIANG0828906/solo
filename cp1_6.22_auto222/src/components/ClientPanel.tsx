import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import type { Client } from '../utils/storage';
import { formatCurrency } from '../utils/invoiceLogic';

interface ClientPanelProps {
  clients: Client[];
  selectedClient: string | null;
  statusFilter: string;
  onClientSelect: (clientName: string | null) => void;
  onStatusFilterChange: (status: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待付款' },
  { value: 'overdue', label: '逾期' },
  { value: 'paid', label: '已付款' },
  { value: 'draft', label: '草稿' }
];

const ClientPanel: React.FC<ClientPanelProps> = ({
  clients,
  selectedClient,
  statusFilter,
  onClientSelect,
  onStatusFilterChange,
  isMobileOpen,
  onMobileToggle
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedStatusLabel = statusOptions.find(opt => opt.value === statusFilter)?.label || '全部状态';

  return (
    <>
      <button
        className="mobile-menu-toggle"
        onClick={onMobileToggle}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 100,
          padding: '12px 16px',
          backgroundColor: '#1E3A5F',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: 500,
          boxShadow: '2px 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <Users size={18} />
        客户菜单
        {isMobileOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>

      <div
        className={`client-panel ${isMobileOpen ? 'mobile-open' : ''}`}
        style={{
          width: '300px',
          backgroundColor: '#1E3A5F',
          color: '#fff',
          height: '100vh',
          padding: '24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: 0,
          top: 0,
          overflowY: 'auto',
          transition: 'transform 0.3s ease'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, marginBottom: '4px' }}>
            发票管理
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            自由职业者助手
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '8px', display: 'block' }}>
          按状态筛选
          </label>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                width: '100%',
                padding: '10px 14px',
                backgroundColor: '#fff',
                color: '#1F2937',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <span>{selectedStatusLabel}</span>
              <ChevronDown
                size={16}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: filterOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </button>
            {filterOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: '#fff',
                  borderRadius: '8px',
                  boxShadow: '2px 4px 12px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  animation: 'fadeIn 0.2s ease',
                  zIndex: 10
                }}
              >
                {statusOptions.map((option) => (
                  <div
                    key={option.value}
                    onClick={() => {
                      onStatusFilterChange(option.value);
                      setFilterOpen(false);
                    }}
                    style={{
                      padding: '10px 14px',
                      fontSize: '14px',
                      color: statusFilter === option.value ? '#1E3A5F' : '#374151',
                      backgroundColor: statusFilter === option.value ? '#EEF2FF' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      fontWeight: statusFilter === option.value ? 600 : 400
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = statusFilter === option.value ? '#EEF2FF' : '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = statusFilter === option.value ? '#EEF2FF' : 'transparent';
                    }}
                  >
                    {option.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            客户列表
          </div>
          <div
            onClick={() => onClientSelect(null)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '4px',
              cursor: 'pointer',
              backgroundColor: selectedClient === null ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = selectedClient === null ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = selectedClient === null ? 'rgba(255,255,255,0.1)' : 'transparent';
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 500 }}>
              全部客户
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
              共 {clients.reduce((sum, c) => sum + c.totalInvoices, 0)} 张发票
            </div>
          </div>
          {clients.map((client) => (
            <div
              key={client.name}
              onClick={() => onClientSelect(client.name)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '4px',
                cursor: 'pointer',
                backgroundColor: selectedClient === client.name ? 'rgba(255,255,255,0.1)' : 'transparent',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = selectedClient === client.name ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = selectedClient === client.name ? 'rgba(255,255,255,0.1)' : 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>
                  {client.name}
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  {client.totalInvoices} 张
                </div>
              </div>
              {client.outstandingAmount > 0 && (
                <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: 600, marginTop: '4px' }}>
                  未结: {formatCurrency(client.outstandingAmount, 'CNY')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isMobileOpen && (
        <div
          className="mobile-menu-overlay"
          onClick={onMobileToggle}
          style={{
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 98
          }}
        />
      )}
    </>
  );
};

export default ClientPanel;
