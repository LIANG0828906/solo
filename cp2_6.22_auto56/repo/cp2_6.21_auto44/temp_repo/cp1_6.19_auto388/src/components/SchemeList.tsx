import React, { useState } from 'react';
import { useFlowerStore, Scheme } from '../store';
import { generateCanvasPreview, packagingStyles } from '../utils/canvasPreview';

const SchemeList: React.FC = () => {
  const { savedSchemes, deleteScheme } = useFlowerStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [detailScheme, setDetailScheme] = useState<Scheme | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    setTimeout(async () => {
      await deleteScheme(id);
      setDeletingId(null);
    }, 200);
  };

  const handleExportAll = () => {
    const exportData = savedSchemes.map((scheme) => ({
      id: scheme.id,
      name: scheme.name,
      flowers: scheme.flowers.map((f) => ({
        name: f.name,
        quantity: f.quantity,
        price: f.price,
        subtotal: f.price * f.quantity,
      })),
      packagingStyle: scheme.packagingStyle,
      packagingFeeRatio: scheme.packagingFeeRatio,
      totalPrice: scheme.totalPrice,
      createdAt: scheme.createdAt,
    }));

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `花束方案_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleViewDetail = (scheme: Scheme, e: React.MouseEvent) => {
    e.stopPropagation();
    setDetailScheme(scheme);
  };

  return (
    <div
      style={{
        marginTop: '30px',
        padding: '24px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: '#333',
          }}
        >
          已保存方案 ({savedSchemes.length})
        </h2>
        {savedSchemes.length > 0 && (
          <button
            onClick={handleExportAll}
            className="export-btn"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#B5D8EB',
              color: '#333',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease-out',
            }}
          >
            导出订单
          </button>
        )}
      </div>

      {savedSchemes.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#999',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '14px' }}>暂无保存的方案，设计一束花吧！</div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {savedSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className={`scheme-card ${deletingId === scheme.id ? 'deleting' : ''}`}
              onMouseEnter={() => setHoveredId(scheme.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                width: '280px',
                height: '180px',
                borderRadius: '8px',
                backgroundColor: '#F3E5F5',
                padding: '16px',
                cursor: 'pointer',
                transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#333',
                    marginBottom: '8px',
                  }}
                >
                  {scheme.name}
                </h3>
                <div
                  style={{
                    fontSize: '13px',
                    color: '#666',
                    marginBottom: '4px',
                  }}
                >
                  {scheme.flowers.length} 种花材 ·{' '}
                  {scheme.flowers.reduce((sum, f) => sum + f.quantity, 0)} 枝
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#999',
                  }}
                >
                  包装：
                  {packagingStyles.find((s) => s.id === scheme.packagingStyle)?.name ||
                    '牛皮纸'}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#9C27B0',
                    }}
                  >
                    ¥{scheme.totalPrice.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    opacity: hoveredId === scheme.id ? 1 : 0,
                    transform: hoveredId === scheme.id ? 'translateY(0)' : 'translateY(10px)',
                    transition: 'all 0.25s ease-out',
                  }}
                >
                  <button
                    onClick={(e) => handleViewDetail(scheme, e)}
                    className="action-btn view-btn"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#B5D8EB',
                      color: '#333',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-out',
                    }}
                  >
                    查看详情
                  </button>
                  <button
                    onClick={(e) => handleDelete(scheme.id, e)}
                    className="action-btn delete-btn"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#FFCDD2',
                      color: '#C62828',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease-out',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  borderRadius: '0 0 8px 8px',
                  background: 'linear-gradient(90deg, #CE93D8, #BA68C8)',
                  opacity: 0.6,
                }}
              />
            </div>
          ))}
        </div>
      )}

      {detailScheme && (
        <div
          className="detail-modal-overlay"
          onClick={() => setDetailScheme(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#00000080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '28px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #F3E5F5',
              }}
            >
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#333',
                }}
              >
                {detailScheme.name}
              </h2>
              <button
                onClick={() => setDetailScheme(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F5F5F5',
                  color: '#666',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease-out',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: '12px',
                }}
              >
                花材明细
              </h3>
              <div
                style={{
                  backgroundColor: '#FAFAFA',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                {detailScheme.flowers.map((flower, index) => (
                  <div
                    key={flower.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      borderBottom: index < detailScheme.flowers.length - 1 ? '1px solid #EEE' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: flower.color,
                        }}
                      />
                      <span style={{ fontSize: '14px', color: '#333' }}>{flower.name}</span>
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        ×{flower.quantity}枝
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#666' }}>
                      ¥{(flower.price * flower.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px dashed #EEE',
              }}
            >
              <span style={{ fontSize: '14px', color: '#888' }}>包装方式</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                {packagingStyles.find((s) => s.id === detailScheme.packagingStyle)?.name}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px dashed #EEE',
              }}
            >
              <span style={{ fontSize: '14px', color: '#888' }}>包装费比例</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                {(detailScheme.packagingFeeRatio * 100).toFixed(0)}%
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px 0 8px',
                marginTop: '8px',
                borderTop: '2px solid #F3E5F5',
              }}
            >
              <span style={{ fontSize: '16px', fontWeight: 600, color: '#333' }}>
                总价
              </span>
              <span style={{ fontSize: '24px', fontWeight: 700, color: '#9C27B0' }}>
                ¥{detailScheme.totalPrice.toFixed(2)}
              </span>
            </div>

            {detailScheme.createdAt && (
              <div
                style={{
                  textAlign: 'right',
                  fontSize: '12px',
                  color: '#AAA',
                  marginTop: '8px',
                }}
              >
                创建时间：{new Date(detailScheme.createdAt).toLocaleString('zh-CN')}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .scheme-card:hover {
          transform: translateY(-3px) !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.12) !important;
        }
        
        .scheme-card.deleting {
          animation: cardScaleOut 0.2s ease-out forwards;
        }
        
        @keyframes cardScaleOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.9);
          }
        }
        
        .action-btn:hover {
          transform: scale(1.05);
        }
        
        .action-btn:active {
          transform: scale(0.95);
        }
        
        .view-btn:hover {
          background-color: #81D4FA !important;
        }
        
        .delete-btn:hover {
          background-color: #EF9A9A !important;
        }
        
        .export-btn:hover {
          background-color: #81D4FA !important;
          transform: translateY(-2px);
        }
        
        .export-btn:active {
          transform: scale(0.95);
        }
        
        .detail-modal-overlay {
          animation: fadeIn 0.25s ease-out;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default SchemeList;
