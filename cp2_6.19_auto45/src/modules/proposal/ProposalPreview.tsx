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

  const isDark = template === 'dark';
  const isBusiness = template === 'business';
  const isMinimal = template === 'minimal';

  const rootBg = isDark ? theme.bg : theme.bg;
  const rootColor = theme.text;

  const headerBgStyle: React.CSSProperties = isBusiness || isDark
    ? { background: theme.headerBg, color: '#fff' }
    : { background: theme.headerBg, color: theme.text };

  const tagStyle: React.CSSProperties = isBusiness
    ? { background: theme.accent, color: '#0c2d57' }
    : isDark
      ? { background: theme.accent, color: '#0f172a' }
      : { background: theme.primary, color: '#fff' };

  const titleColor = isBusiness ? '#ffffff' : isDark ? '#ffffff' : theme.primary;
  const clientColor = isBusiness ? 'rgba(255,255,255,0.85)' : isDark ? 'rgba(226,232,240,0.8)' : theme.textMuted;

  const accentLine = isBusiness
    ? { width: 60, height: 3, borderRadius: 2, background: theme.accent }
    : isDark
      ? { width: 60, height: 3, borderRadius: 2, background: theme.accent }
      : { width: 0, height: 0 };

  const sectionTitleStyle: React.CSSProperties = {
    color: isDark ? theme.primary : theme.primary,
    borderBottomColor: theme.border,
    borderBottomStyle: theme.dividerStyle as React.CSSProperties['borderBottomStyle'],
  };

  const theadBgStyle: React.CSSProperties = isBusiness
    ? { background: theme.tableHeadBg, color: '#ffffff' }
    : isDark
      ? { background: theme.tableHeadBg, color: theme.primary }
      : { background: theme.tableHeadBg, color: theme.secondary };

  const footerBgStyle: React.CSSProperties = isBusiness || isDark
    ? { background: theme.footerBg, color: isDark ? theme.text : '#ffffff' }
    : { background: theme.footerBg, color: theme.text };

  const footerTotalColor = isBusiness ? theme.accent : isDark ? theme.primary : theme.primary;

  return (
    <div style={{ background: rootBg, color: rootColor, fontFamily: theme.bodyFont, borderRadius: 'inherit' }}>
      <div className="ff-preview__header" style={headerBgStyle}>
        {(isBusiness || isDark) && (
          <div style={{
            position: 'absolute', top: '-40%', right: '-20%',
            width: '300px', height: '300px', borderRadius: '50%',
            filter: 'blur(50px)', opacity: 0.15,
            background: isBusiness ? theme.accent : theme.accent,
          }} />
        )}
        {isMinimal && (
          <div style={{
            position: 'absolute', top: '-40%', right: '-20%',
            width: '300px', height: '300px', borderRadius: '50%',
            filter: 'blur(40px)', opacity: 0.08,
            background: theme.accent,
          }} />
        )}
        <span className="ff-preview__tag" style={tagStyle}>PROJECT PROPOSAL</span>
        <h1
          className="ff-preview__title"
          style={{
            fontFamily: theme.headerFont,
            color: titleColor,
            fontWeight: isBusiness || isDark ? 800 : 700,
            letterSpacing: isBusiness ? '0.5px' : 'normal',
          }}
        >
          {title || '（未命名提案）'}
        </h1>
        <div className="ff-preview__client" style={{ color: clientColor }}>
          致：{clientName || '（客户名称）'}
        </div>
        {(isBusiness || isDark) && (
          <div style={{ ...accentLine, marginTop: 16, position: 'relative', zIndex: 1 }} />
        )}
      </div>

      <div className="ff-preview__body" style={{ background: theme.bg }}>
        <h2 className="ff-preview__section-title" style={sectionTitleStyle}>服务明细</h2>
        <table className="ff-table" style={{ color: theme.text }}>
          <thead>
            <tr style={theadBgStyle}>
              <th style={{ textAlign: 'left', color: 'inherit', borderBottomColor: theme.border, borderBottomStyle: theme.dividerStyle as React.CSSProperties['borderBottomStyle'] }}>服务项</th>
              <th className="num" style={{ color: 'inherit', borderBottomColor: theme.border, borderBottomStyle: theme.dividerStyle as React.CSSProperties['borderBottomStyle'] }}>单价</th>
              <th className="num" style={{ color: 'inherit', borderBottomColor: theme.border, borderBottomStyle: theme.dividerStyle as React.CSSProperties['borderBottomStyle'] }}>数量</th>
              <th className="num" style={{ color: 'inherit', borderBottomColor: theme.border, borderBottomStyle: theme.dividerStyle as React.CSSProperties['borderBottomStyle'] }}>小计</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr style={{ borderBottomColor: theme.border }}>
                <td colSpan={4} style={{ padding: '24px 10px', textAlign: 'center', opacity: 0.5, color: theme.textMuted }}>
                  暂无服务项
                </td>
              </tr>
            ) : (
              services.map((s, idx) => {
                const subtotal = (Number(s.unitPrice) || 0) * (Number(s.quantity) || 0);
                const rowBg = idx % 2 === 1 ? theme.tableStripe : 'transparent';
                return (
                  <tr key={s.id} style={{ borderBottomColor: theme.border, background: rowBg }}>
                    <td>
                      <div className="svc-name" style={{ color: theme.text }}>{s.name || '（未命名）'}</div>
                      <div className="svc-desc" style={{ color: theme.textMuted }}>{s.description}</div>
                    </td>
                    <td className="num" style={{ color: theme.text }}>{formatCurrency(Number(s.unitPrice) || 0)}</td>
                    <td className="num" style={{ color: theme.text }}>{s.quantity}</td>
                    <td className="num" style={{ fontWeight: 600, color: isBusiness ? theme.accent : isDark ? theme.primary : theme.primary }}>
                      {formatCurrency(subtotal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="ff-preview__footer" style={{
        ...footerBgStyle,
        borderTopColor: isBusiness ? theme.accent : theme.border,
        borderTopWidth: isBusiness ? 3 : 2,
      }}>
        <span className="ff-preview__footer-label" style={{ color: isBusiness ? '#ffffff' : isDark ? theme.text : theme.text }}>
          合计金额
        </span>
        <span className="ff-preview__footer-total" style={{
          color: footerTotalColor,
          fontFamily: theme.headerFont,
          fontWeight: isBusiness || isDark ? 800 : 700,
        }}>
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
