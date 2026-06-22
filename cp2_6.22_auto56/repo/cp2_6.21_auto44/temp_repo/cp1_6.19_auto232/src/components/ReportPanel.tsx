import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import { COLOR_PALETTE, OPACITY_MIN, OPACITY_MAX, MAX_NAME_LENGTH } from '../constants';
import { generateReport } from '../reportGenerator';

const IconReport = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

interface CardData {
  key: 'zoning' | 'circulation' | 'ecology';
  title: string;
  subtitle: string;
}

const CARDS: CardData[] = [
  { key: 'zoning', title: '一、功能分区', subtitle: '场地分区建议' },
  { key: 'circulation', title: '二、动线分析', subtitle: '交通流线组织' },
  { key: 'ecology', title: '三、生态评估', subtitle: '生态格局评价' },
];

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0 },
};

export default function ReportPanel() {
  const selectedBubbleId = useAppStore((s) => s.selectedBubbleId);
  const bubbles = useAppStore((s) => s.bubbles);
  const connections = useAppStore((s) => s.connections);
  const report = useAppStore((s) => s.report);
  const setReport = useAppStore((s) => s.setReport);
  const updateBubble = useAppStore((s) => s.updateBubble);

  const selectedBubble = bubbles.find((b) => b.id === selectedBubbleId) || null;

  const handleGenerateReport = () => {
    const content = generateReport(bubbles, connections);
    setReport({
      id: Math.random().toString(36).slice(2, 10),
      content,
      generatedAt: Date.now(),
      manuallyEdited: false,
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBubbleId) return;
    updateBubble(selectedBubbleId, { name: e.target.value });
  };

  const handleColorSelect = (color: string) => {
    if (!selectedBubbleId) return;
    updateBubble(selectedBubbleId, { color });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedBubbleId) return;
    updateBubble(selectedBubbleId, { opacity: parseFloat(e.target.value) });
  };

  const handleContentChange = (key: 'zoning' | 'circulation' | 'ecology') => (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!report) return;
    setReport({
      ...report,
      manuallyEdited: true,
      content: {
        ...report.content,
        [key]: e.target.value,
      },
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        top: 24,
        width: 320,
        height: 'calc(100vh - 48px)',
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflowY: 'auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        zIndex: 40,
        boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
      }}
    >
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1A365D', marginBottom: 4 }}>
          场地分析报告
        </h2>
        <p style={{ fontSize: 12, color: '#718096', lineHeight: 1.5 }}>
          创建气泡图并生成分析报告，支持SVG/PDF导出
        </p>
      </div>

      {selectedBubble && (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            border: '1px solid #E2E8F0',
            background: '#F8F9FA',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1A365D' }}>
            气泡属性编辑
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4A5568' }}>名称</label>
            <input
              type="text"
              value={selectedBubble.name}
              maxLength={MAX_NAME_LENGTH}
              onChange={handleNameChange}
              style={{
                width: '100%',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: '#4A5568' }}>颜色</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
              }}
            >
              {COLOR_PALETTE.map((color) => (
              <div
                key={color}
                onClick={() => handleColorSelect(color)}
                className="color-swatch"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: color,
                  cursor: 'pointer',
                  border:
                    selectedBubble.color === color
                      ? '2px solid #1A365D'
                      : '2px solid transparent',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
              />
            ))}
            </div>
          </div>

          <div className="slider">
            <label>透明度</label>
            <input
              type="range"
              min={OPACITY_MIN}
              max={OPACITY_MAX}
              step={0.05}
              value={selectedBubble.opacity}
              onChange={handleOpacityChange}
            />
            <span className="value">{Math.round(selectedBubble.opacity * 100)}%</span>
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleGenerateReport}
        style={{
          fontSize: 16,
          background: '#1A365D',
          color: '#FFFFFF',
          borderRadius: 10,
          padding: '14px 16px',
          fontWeight: 500,
          border: 'none',
          cursor: 'pointer',
          width: '100%',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#2B6CB0';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = '#1A365D';
        }}
      >
        生成报告
      </motion.button>

      <AnimatePresence mode="wait">
        {report === null ? (
          <motion.div
            key="empty"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={cardVariants}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 20px',
              color: '#A0AEC0',
              textAlign: 'center',
              borderRadius: 12,
              background: '#F8F9FA',
              border: '1px dashed #E2E8F0',
              flex: 1,
            }}
          >
            <div style={{ opacity: 0.5, marginBottom: 12 }}>
              <IconReport />
            </div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#718096', marginBottom: 6 }}>
              暂无报告
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6, color: '#A0AEC0' }}>
              点击上方"生成报告"按钮
              <br />
              基于气泡布局生成分析内容
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="report"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={cardVariants}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}
          >
            <AnimatePresence>
              {CARDS.map((card, index) => (
                <motion.div
                  key={card.key}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={cardVariants}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: index * 0.08 }}
                  style={{
                    borderRadius: 12,
                    padding: 16,
                    border: '1px solid #E2E8F0',
                    marginBottom: index < CARDS.length - 1 ? 0 : 12,
                    borderTop: `2px solid #2F855A`,
                    background: '#F8F9FA',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#2F855A',
                      }}
                    >
                      {card.title}
                    </span>
                    <span style={{ fontSize: 12, color: '#718096', marginTop: 2 }}>
                      {card.subtitle}
                    </span>
                  </div>
                  <textarea
                    value={report.content[card.key]}
                    onChange={handleContentChange(card.key)}
                    style={{
                      width: '100%',
                      fontSize: 13,
                      lineHeight: 1.7,
                      color: '#2D3748',
                      border: '1px solid #E2E8F0',
                      borderRadius: 8,
                      padding: 10,
                      minHeight: 90,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      background: '#FFFFFF',
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
