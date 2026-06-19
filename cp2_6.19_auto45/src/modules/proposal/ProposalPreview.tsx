import { TEMPLATE_THEMES, type ServiceItem, type TemplateType } from './types';
import { formatCurrency, calculateTotal } from '@/api/mockApi';

interface ProposalPreviewProps {
  title: string;
  clientName: string;
  template: TemplateType;
  services: ServiceItem[];
}

export function ProposalPreview({ title, clientName, template, services }: ProposalPreviewProps) {
  const theme = TEMPLATE_THEMES[template];
  const total = calculateTotal(services);

  const headerStyle: React.CSSProperties = {
    background: theme.bg,
    color: theme.text,
    fontFamily: theme.bodyFont,
  };

  const tagStyle: React.CSSProperties = {
    background: theme.primary,
    color: theme.bg,
  };

  const headerBeforeStyle: React.CSSProperties = {
    background: theme.accent,
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: theme.primary,
    borderBottomColor: theme.border,
  };

  const tableStyle: React.CSSProperties = {
    color: theme.text,
  };

  const theadStyle: React.CSSProperties = {
    borderBottomColor: theme.border,
    color: theme.secondary,
  };

  const tbodyTrStyle: React.CSSProperties = {
    borderBottomColor: theme.border,
  };

  const footerStyle: React.CSSProperties = {
    background: theme.bg,
    color: theme.text,
    borderTopColor: theme.border,
  };

  const footerTotalStyle: React.CSSProperties = {
    color: theme.primary,
  };

  return (
    <div className="ff-preview" style={headerStyle}>
      <div className="ff-preview__header" style={{ ...headerStyle }}>
        <div style={{ ...headerBeforeStyle, position: 'absolute', top: '-40%', right: '-20%', width: '300px', height: '300px', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.22 }} />
        <span className="ff-preview__tag" style={tagStyle}>PROJECT PROPOSAL</span>
        <h1 className="ff-preview__title" style={{ fontFamily: theme.headerFont, color: theme.primary }}>
          {title || '（未命名提案）'}
        </h1>
        <div className="ff-preview__client">
          致：{clientName || '（客户名称）'}
        </div>
      </div>

      <div className="ff-preview__body" style={{ background: theme.bg }}>
        <h2 className="ff-preview__section-title" style={sectionTitleStyle}>服务明细</h2>
        <table className="ff-table" style={tableStyle}>
          <thead>
            <tr style={theadStyle}>
              <th style={{ ...theadStyle, textAlign: 'left' }}>服务项</th>
              <th className="num" style={theadStyle}>单价</th>
              <th className="num" style={theadStyle}>数量</th>
              <th className="num" style={theadStyle}>小计</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr style={tbodyTrStyle}>
                <td colSpan={4} style={{ padding: '24px 10px', textAlign: 'center', opacity: 0.5 }}>
                  暂无服务项
                </td>
              </tr>
            ) : (
              services.map((s) => {
                const subtotal = (Number(s.unitPrice) || 0) * (Number(s.quantity) || 0);
                return (
                  <tr key={s.id} style={tbodyTrStyle}>
                    <td>
                      <div className="svc-name">{s.name || '（未命名）'}</div>
                      <div className="svc-desc">{s.description}</div>
                    </td>
                    <td className="num">{formatCurrency(Number(s.unitPrice) || 0)}</td>
                    <td className="num">{s.quantity}</td>
                    <td className="num" style={{ fontWeight: 600, color: theme.primary }}>
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="ff-preview__footer" style={footerStyle}>
        <span className="ff-preview__footer-label">合计金额</span>
        <span className="ff-preview__footer-total" style={{ ...footerTotalStyle, fontFamily: theme.headerFont }}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
