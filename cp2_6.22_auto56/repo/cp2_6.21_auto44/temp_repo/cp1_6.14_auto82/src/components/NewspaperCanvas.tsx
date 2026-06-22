import { memo, Ref } from 'react';
import type { CoverData } from '@/types';
import { TEMPLATES } from '@/types';
import { cn } from '@/lib/utils';

interface NewspaperCanvasProps {
  coverData: CoverData;
  canvasRef?: Ref<HTMLDivElement>;
}

const NEWSPAPER_NAMES: Record<CoverData['template'], { en: string; cn: string }> = {
  serious: { en: 'THE MORNING HERALD', cn: '晨报' },
  entertainment: { en: 'DAILY SCOOP', cn: '每日趣闻' },
  vintage: { en: 'THE TIMES CHRONICLE', cn: '时代纪事' },
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    return `${year}年${month}月${day}日 ${weekday}`;
  } catch {
    return dateStr;
  }
};

const getVolInfo = (dateStr: string): { vol: string; no: string } => {
  try {
    const date = new Date(dateStr);
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const diffDays = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const vol = String(date.getFullYear() % 100).padStart(2, '0');
    const no = String(diffDays + 1).padStart(3, '0');
    return { vol, no };
  } catch {
    return { vol: '01', no: '001' };
  }
};

const splitIntoColumns = (text: string, columns: number): string[] => {
  if (!text) return Array(columns).fill('');
  const charsPerCol = Math.ceil(text.length / columns);
  const result: string[] = [];
  for (let i = 0; i < columns; i++) {
    const start = i * charsPerCol;
    result.push(text.slice(start, start + charsPerCol));
  }
  return result;
};

function NewspaperCanvasComponent({ coverData, canvasRef }: NewspaperCanvasProps) {
  const template = TEMPLATES.find((t) => t.id === coverData.template)!;
  const newspaperName = NEWSPAPER_NAMES[coverData.template];
  const { vol, no } = getVolInfo(coverData.date);
  const formattedDate = formatDate(coverData.date);
  const animationKey = `${coverData.template}-${coverData.title}-${coverData.date}-${coverData.author}`;

  const isSerious = coverData.template === 'serious';
  const isEntertainment = coverData.template === 'entertainment';
  const isVintage = coverData.template === 'vintage';

  const renderHeader = () => {
    const headerAlignClass =
      template.layout.headerAlign === 'left'
        ? 'text-left'
        : template.layout.headerAlign === 'right'
          ? 'text-right'
          : 'text-center';

    if (isSerious) {
      return (
        <div
          className={cn('py-6 px-6 border-b-4', headerAlignClass)}
          style={{
            backgroundColor: template.colors.headerBg,
            borderColor: template.colors.accent,
          }}
        >
          <div
            className="tracking-widest text-xs mb-2 opacity-70"
            style={{ color: template.colors.headerText }}
          >
            ★ EST. 1985 ★ TRUSTED SOURCE ★
          </div>
          <h1
            className="font-bold tracking-wider"
            style={{
              fontFamily: template.fontFamily.title,
              color: template.colors.accent,
              fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
              letterSpacing: '0.08em',
              textShadow: '0 0 20px rgba(255,215,0,0.3)',
            }}
          >
            {newspaperName.en}
          </h1>
          <div
            className="mt-1 text-lg font-semibold"
            style={{
              fontFamily: template.fontFamily.title,
              color: template.colors.headerText,
            }}
          >
            {newspaperName.cn}
          </div>
          <div
            className="mt-4 flex items-center justify-between text-xs flex-wrap gap-2"
            style={{ color: template.colors.body }}
          >
            <span>VOL.{vol} · No.{no}</span>
            <span className="font-medium" style={{ color: template.colors.accent }}>
              ¥ 2.00
            </span>
            <span>{formattedDate}</span>
          </div>
        </div>
      );
    }

    if (isEntertainment) {
      return (
        <div
          className={cn('py-5 px-5 rounded-t-lg', headerAlignClass)}
          style={{
            background: `linear-gradient(135deg, ${template.colors.headerBg} 0%, ${template.colors.accent} 100%)`,
          }}
        >
          <div className="text-white/80 text-xs tracking-widest mb-1">
            ✨ 八卦 · 娱乐 · 生活 ✨
          </div>
          <h1
            className="font-bold drop-shadow-lg"
            style={{
              fontFamily: template.fontFamily.title,
              color: '#ffffff',
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              fontStyle: 'italic',
            }}
          >
            {newspaperName.en}
          </h1>
          <div
            className="mt-1 text-lg"
            style={{
              fontFamily: template.fontFamily.title,
              color: '#FFF0F5',
            }}
          >
            {newspaperName.cn} 💕
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-white/90 flex-wrap gap-2">
            <span>VOL.{vol} · No.{no}</span>
            <span className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm font-medium">
              今日特价 ¥ 1.50
            </span>
            <span>{formattedDate}</span>
          </div>
        </div>
      );
    }

    return (
      <div className={cn('py-5 px-6 border-b-2', headerAlignClass)} style={{ borderColor: template.colors.accent }}>
        <div
          className="text-xs tracking-widest mb-2"
          style={{ color: template.colors.accent, fontFamily: template.fontFamily.body }}
        >
          ━━━━━━ 创立于 1905 年 · 权威发布 ━━━━━━
        </div>
        <h1
          className="font-bold tracking-widest"
          style={{
            fontFamily: template.fontFamily.title,
            color: template.colors.title,
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
          }}
        >
          {newspaperName.en}
        </h1>
        <div
          className="mt-1 text-lg tracking-wide"
          style={{
            fontFamily: template.fontFamily.title,
            color: template.colors.title,
          }}
        >
          《{newspaperName.cn}》
        </div>
        <div
          className="mt-3 pt-3 border-t-2 flex items-center justify-between text-xs flex-wrap gap-2"
          style={{
            borderColor: template.colors.accent,
            color: template.colors.body,
            fontFamily: template.fontFamily.body,
          }}
        >
          <span>第 {vol} 卷 · 第 {no} 期</span>
          <span>定价：大洋伍角</span>
          <span>{formattedDate}</span>
        </div>
      </div>
    );
  };

  const renderDivider = () => {
    if (isSerious) {
      return (
        <div className="px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1" style={{ backgroundColor: template.colors.accent }} />
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rotate-45"
                style={{ backgroundColor: template.colors.accent }}
              />
              <span
                className="text-xs font-bold tracking-widest"
                style={{ color: template.colors.accent }}
              >
                头版头条
              </span>
              <div
                className="w-2 h-2 rotate-45"
                style={{ backgroundColor: template.colors.accent }}
              />
            </div>
            <div className="flex-1 h-1" style={{ backgroundColor: template.colors.accent }} />
          </div>
        </div>
      );
    }

    if (isEntertainment) {
      return (
        <div className="px-5 py-3">
          <div className="flex items-center justify-center gap-2 text-2xl">
            <span>✨</span>
            <span>💫</span>
            <span>⭐</span>
            <span>🌟</span>
            <span>✨</span>
          </div>
          <div
            className="mt-2 h-0.5 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${template.colors.accent}, ${template.colors.title}, ${template.colors.accent}, transparent)`,
            }}
          />
        </div>
      );
    }

    return (
      <div className="px-6 py-3">
        <div
          className="h-px w-full"
          style={{ backgroundColor: template.colors.accent }}
        />
        <div
          className="h-px w-full mt-1"
          style={{ backgroundColor: template.colors.accent, opacity: 0.5 }}
        />
        <div className="mt-2 flex items-center justify-center gap-4 text-xs tracking-widest" style={{ color: template.colors.accent }}>
          <span>【</span>
          <span>头 版 要 闻</span>
          <span>】</span>
        </div>
      </div>
    );
  };

  const renderDecorativeVerticalLine = () => {
    if (!isSerious) return null;
    return (
      <div
        className="absolute left-4 top-1/2 -translate-y-1/2 w-0.5 h-32 opacity-30"
        style={{ backgroundColor: template.colors.accent }}
      />
    );
  };

  const renderTitle = () => {
    const alignClass =
      template.layout.titleAlign === 'left'
        ? 'text-left'
        : template.layout.titleAlign === 'right'
          ? 'text-right'
          : 'text-center';

    if (isEntertainment) {
      return (
        <div className="px-5 py-4 relative">
          <div
            className="absolute -top-1 left-4 text-3xl opacity-60 animate-float"
            style={{ animationDelay: '0.2s' }}
          >
            💥
          </div>
          <div
            className="absolute -top-2 right-6 text-2xl opacity-60 animate-float"
            style={{ animationDelay: '0.5s' }}
          >
            🔥
          </div>
          <h2
            className={cn(
              'font-bold leading-tight relative z-10',
              alignClass,
              template.layout.titleItalic ? 'italic' : ''
            )}
            style={{
              fontFamily: template.fontFamily.title,
              color: template.colors.title,
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              textShadow: `2px 2px 0px ${template.colors.accent}40`,
            }}
          >
            {coverData.title || '请输入头条标题'}
          </h2>
        </div>
      );
    }

    if (isVintage) {
      return (
        <div className="px-6 py-4">
          <h2
            className={cn(
              'font-bold leading-tight',
              alignClass,
              template.layout.titleItalic ? 'italic' : ''
            )}
            style={{
              fontFamily: template.fontFamily.title,
              color: template.colors.title,
              fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
              letterSpacing: '0.02em',
            }}
          >
            {coverData.title || '请输入头条标题'}
          </h2>
        </div>
      );
    }

    return (
      <div className="px-6 py-4 relative">
        {renderDecorativeVerticalLine()}
        <h2
          className={cn(
            'font-bold leading-tight relative z-10 pl-2',
            alignClass,
            template.layout.titleItalic ? 'italic' : ''
          )}
          style={{
            fontFamily: template.fontFamily.title,
            color: template.colors.accent,
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            letterSpacing: '0.03em',
          }}
        >
          {coverData.title || '请输入头条标题'}
        </h2>
      </div>
    );
  };

  const renderAuthorLine = () => {
    if (isEntertainment) {
      return (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="text-lg">📝</span>
            <span
              className="px-4 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: `${template.colors.accent}15`,
                color: template.colors.accent,
              }}
            >
              特约记者：{coverData.author || '匿名'}
            </span>
            <span className="text-sm text-gray-500">独家报道</span>
          </div>
        </div>
      );
    }

    if (isVintage) {
      return (
        <div className="px-6 pb-4">
          <div
            className="flex items-center gap-3 text-sm flex-wrap"
            style={{ color: template.colors.body, fontFamily: template.fontFamily.body }}
          >
            <span style={{ color: template.colors.accent }}>记者：</span>
            <span className="font-medium">{coverData.author || '佚名'}</span>
            <span style={{ color: template.colors.accent }}>|</span>
            <span>专 稿</span>
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 pb-4">
        <div
          className="flex items-center gap-4 text-sm flex-wrap"
          style={{ color: template.colors.body }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-px"
              style={{ backgroundColor: template.colors.accent }}
            />
            <span style={{ color: template.colors.accent }}>首席记者</span>
          </div>
          <span className="font-medium">{coverData.author || '本报记者'}</span>
          <span className="opacity-60">发自新闻现场</span>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    const summary = coverData.summary || '请输入新闻摘要内容，这里将展示报纸的主要报道内容...';

    if (isEntertainment) {
      const columns = splitIntoColumns(summary, 2);
      return (
        <div className="px-5 pb-6">
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: `${template.colors.title}08`,
              border: `2px dashed ${template.colors.accent}40`,
            }}
          >
            <div className="grid grid-cols-2 gap-6">
              {columns.map((col, idx) => (
                <div
                  key={idx}
                  className="relative"
                  style={{
                    fontFamily: template.fontFamily.body,
                    color: template.colors.body,
                    fontSize: '0.875rem',
                    lineHeight: 1.8,
                    textAlign: 'justify',
                  }}
                >
                  {idx === 0 && col.length > 0 && (
                    <>
                      <span
                        className="float-left leading-none mr-1 font-bold"
                        style={{
                          fontFamily: template.fontFamily.title,
                          color: template.colors.title,
                          fontSize: '2.75rem',
                          paddingTop: '0.25rem',
                          fontStyle: 'italic',
                        }}
                      >
                        {col[0]}
                      </span>
                      {col.slice(1)}
                    </>
                  )}
                  {idx !== 0 && col}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (isVintage) {
      const columns = splitIntoColumns(summary, 3);
      return (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-3 gap-5">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="relative"
                style={{
                  fontFamily: template.fontFamily.body,
                  color: template.colors.body,
                  fontSize: '0.8125rem',
                  lineHeight: 1.9,
                  textAlign: 'justify',
                }}
              >
                {idx > 0 && (
                  <div
                    className="absolute -left-2.5 top-0 bottom-0 w-px opacity-30"
                    style={{ backgroundColor: template.colors.accent }}
                  />
                )}
                {idx === 0 && col.length > 0 ? (
                  <>
                    <span
                      className="float-left leading-none mr-1 font-bold"
                      style={{
                        fontFamily: template.fontFamily.title,
                        color: template.colors.accent,
                        fontSize: '3rem',
                        paddingTop: '0.35rem',
                        lineHeight: '0.85',
                      }}
                    >
                      {col[0]}
                    </span>
                    {col.slice(1)}
                  </>
                ) : (
                  col
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    const columns = splitIntoColumns(summary, 2);
    return (
      <div className="px-6 pb-6">
        <div
          className="relative p-5 rounded-lg"
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderLeft: `3px solid ${template.colors.accent}`,
          }}
        >
          <div className="grid grid-cols-2 gap-8">
            {columns.map((col, idx) => (
              <div
                key={idx}
                className="relative"
                style={{
                  fontFamily: template.fontFamily.body,
                  color: template.colors.body,
                  fontSize: '0.875rem',
                  lineHeight: 1.9,
                  textAlign: 'justify',
                }}
              >
                {idx > 0 && (
                  <div
                    className="absolute -left-4 top-0 bottom-0 w-px"
                    style={{ backgroundColor: `${template.colors.accent}30` }}
                  />
                )}
                {idx === 0 && col.length > 0 ? (
                  <>
                    <span
                      className="float-left leading-none mr-2 font-bold"
                      style={{
                        fontFamily: template.fontFamily.title,
                        color: template.colors.accent,
                        fontSize: '3.25rem',
                        paddingTop: '0.25rem',
                        lineHeight: '0.8',
                      }}
                    >
                      {col[0]}
                    </span>
                    {col.slice(1)}
                  </>
                ) : (
                  col
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => {
    if (isEntertainment) {
      return (
        <div
          className="mt-auto px-5 py-4 text-xs text-center rounded-b-lg"
          style={{
            background: `linear-gradient(135deg, ${template.colors.accent}99 0%, ${template.colors.title}99 100%)`,
            color: '#ffffff',
          }}
        >
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span>📱</span>
            <span>关注我们获取更多劲爆资讯</span>
            <span>💖</span>
          </div>
          <div className="mt-1 opacity-80 text-[0.6875rem]">
            © {new Date(coverData.date).getFullYear()} Daily Scoop Media · 版权所有
          </div>
        </div>
      );
    }

    if (isVintage) {
      return (
        <div className="mt-auto px-6 py-4">
          <div
            className="h-px w-full mb-3"
            style={{ backgroundColor: template.colors.accent, opacity: 0.4 }}
          />
          <div
            className="flex items-center justify-between text-xs flex-wrap gap-2"
            style={{
              color: template.colors.body,
              fontFamily: template.fontFamily.body,
              opacity: 0.8,
            }}
          >
            <span>本报地址：申报馆旧址 · 汉口路三〇九号</span>
            <span style={{ color: template.colors.accent }}>第 1 版</span>
            <span>印刷：商务印书馆</span>
          </div>
        </div>
      );
    }

    return (
      <div className="mt-auto px-6 py-4">
        <div
          className="flex items-center justify-between text-xs flex-wrap gap-2 pt-3 border-t"
          style={{
            borderColor: `${template.colors.accent}30`,
            color: template.colors.body,
            opacity: 0.7,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: template.colors.accent }}>◆</span>
            <span>第 {vol} 卷 · 第 {no} 期 · 第 1 版</span>
          </div>
          <span>MORNING HERALD PUBLISHING GROUP © {new Date(coverData.date).getFullYear()}</span>
        </div>
      </div>
    );
  };

  const getPaperBgStyle = () => {
    if (isSerious) {
      return {
        backgroundColor: template.colors.background,
        backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,215,0,0.03) 0%, transparent 50%),
                          radial-gradient(circle at 80% 20%, rgba(255,215,0,0.02) 0%, transparent 50%)`,
      };
    }
    if (isEntertainment) {
      return {
        backgroundColor: template.colors.background,
        backgroundImage: `radial-gradient(circle at 10% 10%, ${template.colors.accent}10 0%, transparent 40%),
                          radial-gradient(circle at 90% 90%, ${template.colors.title}10 0%, transparent 40%)`,
      };
    }
    return {
      backgroundColor: template.colors.background,
    };
  };

  return (
    <div
      ref={canvasRef}
      className={cn(
        'rounded-lg overflow-hidden shadow-paper-shadow-lg relative mx-auto',
        !isVintage && 'paper-texture',
        isVintage && 'paper-texture-light'
      )}
      style={{
        aspectRatio: '210 / 297',
        width: '100%',
        maxWidth: '620px',
        ...getPaperBgStyle(),
      }}
    >
      <div key={animationKey} className={cn('flex flex-col h-full animate-fadeIn')}>
        {renderHeader()}
        {renderDivider()}
        {renderTitle()}
        {renderAuthorLine()}
        <div className="flex-1">{renderSummary()}</div>
        {renderFooter()}
      </div>
    </div>
  );
}

export const NewspaperCanvas = memo(NewspaperCanvasComponent);
export default NewspaperCanvas;
