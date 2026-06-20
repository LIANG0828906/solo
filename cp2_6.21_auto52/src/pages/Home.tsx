import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DEFAULT_TEMPLATES } from '../editor/templates';
import { BarChart3, ArrowRight, Layout } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Infographic Studio - 选择模板';
  }, []);

  const handleSelectTemplate = (templateId: string) => {
    navigate(`/editor/${templateId}`);
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case '对比图': return '⚖️';
      case '时间线': return '⏱️';
      case '流程图': return '🔀';
      case '数据卡片': return '📊';
      case '人物介绍': return '👥';
      default: return '📄';
    }
  };

  const getTemplateGradient = (id: string) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    const idx = DEFAULT_TEMPLATES.findIndex((t) => t.id === id);
    return gradients[idx % gradients.length];
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f5f7fa',
        padding: '60px 40px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
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
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}
        >
          {DEFAULT_TEMPLATES.map((template) => (
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
                boxShadow: hoveredId === template.id
                  ? '0 12px 32px rgba(0, 0, 0, 0.12)'
                  : '0 4px 16px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: hoveredId === template.id ? 'translateY(-4px)' : 'translateY(0)',
              }}
            >
              <div
                style={{
                  height: 180,
                  background: getTemplateGradient(template.id),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ fontSize: 64, opacity: 0.9 }}>
                  {getTemplateIcon(template.category)}
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(10px)',
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 12,
                    color: '#fff',
                    fontWeight: 500,
                  }}
                >
                  {template.category}
                </div>
                {template.isTwoColumn && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      padding: '4px 10px',
                      borderRadius: 20,
                      fontSize: 11,
                      color: '#1976d2',
                      fontWeight: 600,
                    }}
                  >
                    ✨ 支持栏宽调整
                  </div>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: '#333', margin: 0 }}>
                    {template.name}
                  </h3>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: hoveredId === template.id ? '#2196f3' : '#f5f7fa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <ArrowRight
                      size={18}
                      color={hoveredId === template.id ? '#fff' : '#666'}
                    />
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#999', margin: '8px 0 0', lineHeight: 1.5 }}>
                  {template.components.length} 个可编辑组件
                  {template.isTwoColumn && ' · 支持左右栏宽比例调整'}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 60,
            padding: '32px',
            backgroundColor: '#fff',
            borderRadius: 16,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
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
              { icon: '🎨', title: '5套精美主题', desc: '一键切换全局配色' },
              { icon: '📊', title: '数据图表', desc: '柱状图/折线图/饼图' },
              { icon: '↕️', title: '栏宽调整', desc: '双栏对比支持比例调节' },
              { icon: '↩️', title: '撤销重做', desc: '无限级操作历史' },
              { icon: '🖼️', title: 'PNG导出', desc: '2倍高清分辨率' },
              { icon: '🔗', title: '分享链接', desc: '一键生成短链接' },
            ].map((feature, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 12 }}>
                <div style={{ fontSize: 28 }}>{feature.icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{feature.title}</div>
                  <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
