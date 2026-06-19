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

  const isMinimal = template === 'minimal';
  const isBusiness = template === 'business';
  const isCreative = template === 'creative';

  const previewStyle: React.CSSProperties = {
    background: theme.bg,
    color: theme.text,
    fontFamily: theme.bodyFont,
    borderRadius: theme.previewRadius,
    overflow: 'hidden',
    position: 'relative',
  };
  if (isCreative) {
    previewStyle.boxShadow = theme.cardShadow;
    previewStyle.border = `1px solid ${theme.border}`;
  }

  const headerStyle: React.CSSProperties = {};
  const headerTextColor = isMinimal ? theme.primary : isBusiness ? '#ffffff' : '#ffffff';
  const headerClientColor = isMinimal
    ? theme.textMuted
    : isBusiness
      ? 'rgba(255,255,255,0.78)'
      : 'rgba(255,255,255,0.92)';
  const headerPadding = isCreative
    ? { paddingLeft: 32, paddingRight: 32, paddingTop: 36, paddingBottom: 34 }
    : { paddingLeft: 36, paddingRight: 36, paddingTop: 32, paddingBottom: 28 };

  if (isMinimal) {
    headerStyle.background = theme.headerBg;
    headerStyle.borderBottom = `1px solid ${theme.border}`;
  }
  if (isBusiness) {
    headerStyle.background = theme.headerBg;
    headerStyle.position = 'relative';
  }
  if (isCreative) {
    headerStyle.background = theme.headerBg;
    headerStyle.position = 'relative';
    headerStyle.overflow = 'hidden';
  }

  const badgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: isCreative ? '7px 16px' : isBusiness ? '6px 14px' : '5px 12px',
    borderRadius: theme.badgeRadius,
    fontSize: isCreative ? '11px' : '12px',
    fontWeight: isBusiness ? 800 : 700,
    letterSpacing: isBusiness ? '1.2px' : isCreative ? '0.8px' : '0.5px',
    marginBottom: 14,
    color: isMinimal ? '#ffffff' : isBusiness ? theme.accent : '#ffffff',
    background: isMinimal
      ? theme.primary
      : isBusiness
        ? 'rgba(255,255,255,0.08)'
        : 'rgba(255,255,255,0.22)',
    backdropFilter: isCreative ? 'blur(6px)' : undefined,
    textTransform: isBusiness ? 'uppercase' : undefined,
    border: isBusiness ? `1px solid ${theme.accent}` : undefined,
    position: 'relative',
    zIndex: 1,
  };

  const accentDecor = (
    <div
      key="accent"
      style={{
        width: isBusiness ? 64 : isCreative ? 80 : 0,
        height: isBusiness ? 3 : isCreative ? 4 : 0,
        borderRadius: isCreative ? 4 : 2,
        background: theme.accent,
        marginTop: 16,
        position: 'relative',
        zIndex: 1,
      }}
    />
  );

  const creativeDecor = isCreative ? (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 220,
        height: 220,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 70%)',
        pointerEvents: 'none',
      }}
    />
  ) : null;

  const businessDecor = isBusiness ? (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 5,
        background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentAlt} 100%)`,
        pointerEvents: 'none',
      }}
    />
  ) : null;

  const sectionTitleStyle: React.CSSProperties = {
    color: isBusiness ? theme.primary : theme.primary,
    borderBottom: `2px ${theme.dividerStyle} ${theme.border}`,
    fontFamily: theme.headerFont,
    fontWeight: isBusiness ? 800 : 700,
    letterSpacing: isBusiness ? '0.3px' : 'normal',
    paddingBottom: isCreative ? 14 : 10,
    marginBottom: isCreative ? 20 : 14,
    fontSize: isCreative ? 17 : 16,
  };

  const theadStyle: React.CSSProperties = isBusiness
    ? { background: theme.tableHeadBg, color: '#ffffff' }
    : isCreative
      ? { background: theme.tableHeadBg, color: theme.accent }
      : { background: theme.tableHeadBg, color: theme.secondary };

  const cellPad = theme.cellVerticalPad;

  const footerStyle: React.CSSProperties = {};
  const footerTextColor = isBusiness ? '#ffffff' : theme.text;
  const footerTotalColor = isMinimal
    ? theme.primary
    : isBusiness
      ? theme.accent
      : theme.primary;

  if (isMinimal) {
    footerStyle.background = theme.footerBg;
    footerStyle.borderTop = `1px ${theme.dividerStyle} ${theme.border}`;
  }
  if (isBusiness) {
    footerStyle.background = theme.footerBg;
    footerStyle.borderTop = `3px solid ${theme.accent}`;
    footerStyle.position = 'relative';
  }
  if (isCreative) {
    footerStyle.background = theme.footerBg;
    footerStyle.borderTop = `2px ${theme.dividerStyle} ${theme.border}`;
    footerStyle.margin = '0 20px 22px';
    footerStyle.borderRadius = '16px';
    footerStyle.background = `linear-gradient(135deg, #fff 0%, ${theme.bgAlt} 100%)`;
    footerStyle.boxShadow = '0 4px 14px rgba(249,115,22,0.10)';
  }

  const priceStyle: React.CSSProperties = {
    color: footerTotalColor,
    fontFamily: theme.headerFont,
    fontWeight: theme.priceWeight,
  };
  if (isCreative && theme.priceDecor === 'underline') {
    priceStyle.textDecoration = `3px underline ${theme.accent}`;
    priceStyle.textUnderlineOffset = '6px';
    priceStyle.textDecorationThickness = '3px';
  }
  if (isBusiness && theme.priceDecor === 'shadow') {
    priceStyle.textShadow = `0 1px 0 ${theme.accent}, 0 2px 8px rgba(212,162,76,0.25)`;
  }

  return (
    <div style={previewStyle}>
      {/* ========== Header ========== */}
      <div className="ff-preview__header" style={{ ...headerStyle, ...headerPadding }}>
        {creativeDecor}
        {businessDecor}
        <span style={badgeStyle}>PROJECT PROPOSAL</span>
        <h1
          className="ff-preview__title"
          style={{
            fontFamily: theme.headerFont,
            color: headerTextColor,
            fontWeight: theme.titleWeight,
            fontSize: isCreative ? 32 : 30,
            lineHeight: 1.18,
            position: 'relative',
            zIndex: 1,
            marginTop: 0,
          }}
        >
          {title || '（未命名提案）'}
        </h1>
        <div
          className="ff-preview__client"
          style={{ color: headerClientColor, fontSize: isCreative ? 15 : 14.5, position: 'relative', zIndex: 1, marginTop: 6 }}
        >
          致：{clientName || '（客户名称）'}
        </div>
        {(isBusiness || isCreative) && accentDecor}
      </div>

      {/* ========== Body ========== */}
      <div
        className="ff-preview__body"
        style={{
          background: theme.bg,
          padding: isCreative ? '28px 28px 18px' : '28px 36px',
        }}
      >
        <h2 className="ff-preview__section-title" style={sectionTitleStyle}>
          {isCreative ? '✨ 服务明细' : '服务明细'}
        </h2>

        <div
          style={{
            borderRadius: theme.tableBorderRadius,
            overflow: isCreative ? 'hidden' : 'visible',
            border: isCreative ? `1px solid ${theme.border}` : undefined,
            background: isCreative ? '#fff' : undefined,
          }}
        >
          <table
            className="ff-table"
            style={{
              color: theme.text,
              borderCollapse: isCreative ? 'separate' : 'collapse',
              borderSpacing: 0,
              width: '100%',
            }}
          >
            <thead>
              <tr>
                {(['服务项', '单价', '数量', '小计'] as const).map((h, i) => (
                  <th
                    key={h}
                    style={{
                      textAlign: i === 0 ? 'left' : 'right',
                      color: theadStyle.color,
                      background: theadStyle.background,
                      fontSize: isBusiness ? '11px' : '12px',
                      textTransform: isBusiness ? 'uppercase' : undefined,
                      letterSpacing: isBusiness ? '0.8px' : '0.6px',
                      fontWeight: isBusiness ? 800 : 700,
                      padding: `${cellPad} ${isCreative ? 14 : 10}px`,
                      borderBottom: isMinimal
                        ? `1.5px solid ${theme.border}`
                        : undefined,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: '28px 10px',
                      textAlign: 'center',
                      opacity: 0.55,
                      color: theme.textMuted,
                    }}
                  >
                    暂无服务项
                  </td>
                </tr>
              ) : (
                services.map((s, idx) => {
                  const subtotal = (Number(s.unitPrice) || 0) * (Number(s.quantity) || 0);
                  const stripe = idx % 2 === 1 ? theme.tableStripe : 'transparent';
                  const rowBg = isCreative ? (idx % 2 === 1 ? theme.bgAlt : '#fff') : stripe;
                  const isLast = idx === services.length - 1;
                  return (
                    <tr key={s.id}>
                      <td
                        style={{
                          padding: `${cellPad} ${isCreative ? 14 : 10}px`,
                          background: rowBg,
                          borderBottom: !isLast && !isCreative
                            ? `1px solid ${theme.border}`
                            : undefined,
                          verticalAlign: 'top',
                        }}
                      >
                        <div
                          className="svc-name"
                          style={{
                            color: theme.text,
                            fontWeight: 600,
                            fontSize: 14.5,
                          }}
                        >
                          {s.name || '（未命名）'}
                        </div>
                        <div
                          className="svc-desc"
                          style={{
                            color: theme.textMuted,
                            fontSize: 12.5,
                            marginTop: 4,
                            lineHeight: 1.55,
                          }}
                        >
                          {s.description}
                        </div>
                      </td>
                      <td
                        className="num"
                        style={{
                          padding: `${cellPad} ${isCreative ? 14 : 10}px`,
                          background: rowBg,
                          borderBottom: !isLast && !isCreative
                            ? `1px solid ${theme.border}`
                            : undefined,
                          color: theme.text,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatCurrency(Number(s.unitPrice) || 0)}
                      </td>
                      <td
                        className="num"
                        style={{
                          padding: `${cellPad} ${isCreative ? 14 : 10}px`,
                          background: rowBg,
                          borderBottom: !isLast && !isCreative
                            ? `1px solid ${theme.border}`
                            : undefined,
                          color: theme.text,
                          textAlign: 'right',
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {s.quantity}
                      </td>
                      <td
                        className="num"
                        style={{
                          padding: `${cellPad} ${isCreative ? 14 : 10}px`,
                          background: rowBg,
                          borderBottom: !isLast && !isCreative
                            ? `1px solid ${theme.border}`
                            : undefined,
                          textAlign: 'right',
                          fontWeight: isBusiness ? 800 : 700,
                          color: isBusiness ? theme.accent : isCreative ? theme.primary : theme.primary,
                          fontVariantNumeric: 'tabular-nums',
                          whiteSpace: 'nowrap',
                          fontSize: isCreative ? 14.5 : 14,
                        }}
                      >
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========== Footer ========== */}
      <div
        className="ff-preview__footer"
        style={{
          ...footerStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isCreative ? '18px 22px' : '22px 36px 30px',
        }}
      >
        {isBusiness && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 5,
              background: `linear-gradient(180deg, ${theme.accent} 0%, ${theme.accentAlt} 100%)`,
              pointerEvents: 'none',
            }}
          />
        )}
        <span
          className="ff-preview__footer-label"
          style={{
            color: footerTextColor,
            fontWeight: isBusiness ? 700 : 700,
            fontSize: isCreative ? 16 : 15,
            letterSpacing: isBusiness ? '0.5px' : undefined,
          }}
        >
          合计金额
        </span>
        <span
          className="ff-preview__footer-total"
          style={{
            ...priceStyle,
            fontSize: isCreative ? 32 : isBusiness ? 28 : 28,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {formatCurrency(total)}
        </span>
      </div>
    </div>
  );
}
