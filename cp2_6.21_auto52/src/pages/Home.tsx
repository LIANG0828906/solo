import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_TEMPLATES } from '../editor/templates';
import { TemplateThumbnail } from '../components/TemplateThumbnail';
import { BarChart3, ArrowRight, Layout, Sparkles } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Infographic Studio - 选择模板';
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const getTemplateColors = (id: string) => {
    const colorSchemes = [
      { primary: '#2b5797', secondary: '#00a1d6', accent: '#6c63ff' },
      { primary: '#4caf50', secondary: '#8bc34a', accent: '#ffb300' },
      { primary: '#6c63ff', secondary: '#00a1d6', accent: '#f50057' },
      { primary: '#e91e63', secondary: '#ff9800', accent: '#ffc107' },
      { primary: '#2196f3', secondary: '#3f51b5', accent: '#00bcd4' },
    ];
    const idx = DEFAULT_TEMPLATES.findIndex((t) => t.id === id);
    return colorSchemes[idx % colorSchemes.length];
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        padding: '60px 40px',
        overflowY: 'auto',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #2196f3 0%, #6c63ff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
              }}
            >
              <BarChart3 size={28} color="#fff" />
            </div>
            <h1
              style={{
                fontSize: 42,
                fontWeight: 700,
                color: '#1a1a1a',
                margin: 0,
                background: 'linear-gradient(135deg, #2196f3 0%, #6c63ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Infographic Studio
            </h1>
          </div>
          <p style={{ fontSize: 18, color: '#666', marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>
            轻量级在线信息图表编辑器，让非设计背景的你也能快速制作专业精美的信息图表
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Layout size={20} color="#666" />
          <h2 style={{ fontSize: 20, fontWeight: 600, color: '#333', margin: 0 }}>
            选择模板开始创作
          </h2>
          <span style={{
            fontSize: 12,
            color: '#999',
            backgroundColor: '#fff',
            padding: '4px 10px',
            borderRadius: 12,
            border: '1px solid #e0e0e0',
          }}>
            共 {DEFAULT_TEMPLATES.length} 个模板
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 24,
          }}
        >
          {DEFAULT_TEMPLATES.map((template) => {
            const colors = getTemplateColors(template.id);
            const isHovered = hoveredId === template.id;

            return (
              <div
                key={template.id}
                onClick={() => handleSelectTemplate(template.id)}
                onMouseEnter={() => setHoveredId(template.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: `2px solid ${isHovered ? '#2196f3' : 'transparent'}`,
                  boxShadow: isHovered
                    ? '0 16px 40px rgba(33, 150, 243, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)'
                    : '0 2px 8px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: 130,
                    background: `linear-gradient(135deg, ${colors.primary}10 0%, ${colors.secondary}10 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div
                    style={{
                      backgroundColor: '#fff',
                      padding: 8,
                      borderRadius: 10,
                      boxShadow: isHovered
                        ? '0 8px 24px rgba(0, 0, 0, 0.12)'
                        : '0 2px 8px rgba(0, 0, 0, 0.06)',
                      transition: 'box-shadow 0.3s ease',
                    }}
                  >
                    <TemplateThumbnail
                      templateId={template.id}
                      width={140}
                      height={90}
                      primaryColor={colors.primary}
                      secondaryColor={colors.secondary}
                    />
                  </div>

                  {template.isTwoColumn && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: 'rgba(33, 150, 243, 0.9)',
                        padding: '4px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        color: '#fff',
                        fontWeight: 600,
                        boxShadow: '0 2px 6px rgba(33, 150, 243, 0.3)',
                      }}
                    >
                      <Sparkles size={12} />
                      栏宽可调
                    </div>
                  )}

                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(8px)',
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 11,
                      color: colors.primary,
                      fontWeight: 600,
                      border: `1px solid ${colors.primary}20`,
                    }}
                  >
                    {template.category}
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      fontSize: 11,
                      color: '#999',
                    }}
                  >
                    {template.components.length} 个组件
                  </div>
                </div>

                <div style={{ padding: '18px 20px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', margin: 0 }}>
                      {template.name}
                    </h3>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: isHovered ? '#2196f3' : '#f5f7fa',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                      }}
                    >
                      <ArrowRight
                        size={16}
                        color={isHovered ? '#fff' : '#999'}
                      />
                    </div>
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: '#999',
                    margin: '8px 0 0',
                    lineHeight: 1.5,
                    height: 36,
                    overflow: 'hidden',
                  }}>
                    {template.isTwoColumn
                      ? '支持左右栏宽比例调整，Shift同步拖拽，灵活突出重点内容'
                      : template.category === '时间线'
                        ? '横向时间轴布局，清晰展示事件发展脉络'
                        : template.category === '流程图'
                          ? '垂直流程节点，一目了然的步骤展示'
                          : template.category === '数据卡片'
                            ? '网格化数据展示，直观呈现关键指标'
                            : '人物头像加简介，专业团队介绍模板'}
                  </p>
                </div>

                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 14,
                      border: `2px solid ${colors.primary}`,
                      pointerEvents: 'none',
                      opacity: 0,
                      animation: 'pulseBorder 1.5s ease-in-out infinite',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 60,
            padding: '32px',
            backgroundColor: '#fff',
            borderRadius: 16,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            border: '1px solid #f0f0f0',
          }}
        >
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#333', margin: '0 0 20px' }}>
            主要功能
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 24,
            }}
          >
            {[
              { icon: '🎨', title: '5套精美主题', desc: '一键切换全局配色，保持视觉统一' },
              { icon: '📊', title: '数据图表', desc: '柱状图/折线图/饼图，数据可视化' },
              { icon: '↔️', title: '栏宽调整', desc: '双栏对比支持比例调节，Shift同步' },
              { icon: '↩️', title: '撤销重做', desc: '无限级操作历史，放心编辑' },
              { icon: '🖼️', title: 'PNG导出', desc: '2倍高清分辨率，下载即用' },
              { icon: '🔗', title: '分享链接', desc: '一键生成短链接，快速分享' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: 12,
                padding: '12px',
                borderRadius: 10,
                transition: 'background-color 0.2s ease',
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{
                  fontSize: 28,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f5f7fa',
                  borderRadius: 10,
                }}>{feature.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{feature.title}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 3, lineHeight: 1.5 }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseBorder {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.01); }
        }
      `}</style>
    </div>
  );
};
