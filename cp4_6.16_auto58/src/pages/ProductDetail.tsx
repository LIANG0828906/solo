import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/useProjectStore';
import { useProductStore } from '@/store/useProductStore';
import { ArrowLeft, Calendar, Clock, Package, Sparkles, CheckCircle, Image as ImageIcon } from 'lucide-react';
import { formatDate, formatHours, formatCurrency, getDifficultyLabel, getDifficultyColor, formatDateTime } from '@/utils/format';

export function ProductDetail() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { projects } = useProjectStore();
  const { getProductById, getProductStats, refreshProducts } = useProductStore();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    refreshProducts();
    const t = setTimeout(() => setLoaded(true), 50);
    return () => clearTimeout(t);
  }, [refreshProducts, projects.length]);

  if (!productId) return null;

  const product = getProductById(productId);
  const stats = getProductStats(productId);
  const project = projects.find(p => p.id === productId);

  if (!product || !stats || !project) {
    return (
      <div className="detail-page">
        <div className="not-found">
          <h2>未找到该作品</h2>
          <button className="btn-primary" onClick={() => navigate('/showcase')}>
            <ArrowLeft size={16} /> 返回展示架
          </button>
        </div>
      </div>
    );
  }

  const sortedSteps = [...stats.steps].sort((a, b) => a.order - b.order);

  return (
    <div className={`detail-page ${loaded ? 'loaded' : ''}`}>
      <div className="detail-back-bar">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> 返回
        </button>
      </div>

      <div className="detail-hero">
        <div className="detail-cover">
          {product.coverImage ? (
            <img src={product.coverImage} alt={product.title} />
          ) : (
            <div className="no-cover-placeholder">
              <ImageIcon size={64} />
              <span>无封面</span>
            </div>
          )}
        </div>
        <div className="detail-hero-info">
          <div className="detail-badge">
            <Sparkles size={14} /> 手作精品
          </div>
          <h1 className="detail-title">{product.title}</h1>
          <p className="detail-description">{product.description || '暂无描述'}</p>
          <div className="detail-meta-grid">
            <div className="meta-card">
              <Calendar size={18} />
              <div>
                <label>创作日期</label>
                <span>{formatDate(product.completedDate)}</span>
              </div>
            </div>
            <div className="meta-card">
              <Clock size={18} />
              <div>
                <label>创作耗时</label>
                <span>{formatHours(product.totalHours)}</span>
              </div>
            </div>
            <div className="meta-card">
              <Package size={18} />
              <div>
                <label>材料种类</label>
                <span>{stats.materialUsages.length} 种</span>
              </div>
            </div>
            <div className="meta-card highlight">
              <CheckCircle size={18} />
              <div>
                <label>材料总成本</label>
                <span className="cost">{formatCurrency(product.totalCost)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <div className="section-header">
            <h2>创作日志</h2>
            <span className="section-count">共 {sortedSteps.length} 个步骤</span>
          </div>
          {sortedSteps.length === 0 ? (
            <div className="section-empty">暂无创作步骤记录</div>
          ) : (
            <div className="detail-timeline">
              {sortedSteps.map((step, idx) => (
                <div key={step.id} className="detail-step" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="detail-step-node">
                    <span className="step-number">{idx + 1}</span>
                    <div className="step-connector" />
                  </div>
                  <div className="detail-step-card">
                    <div className="detail-step-header">
                      <h3>
                        <span
                          className="difficulty-dot"
                          style={{ backgroundColor: getDifficultyColor(step.difficulty) }}
                        />
                        {step.title}
                      </h3>
                      <div className="detail-step-meta">
                        <span style={{ color: getDifficultyColor(step.difficulty) }}>
                          ● {getDifficultyLabel(step.difficulty)}
                        </span>
                        <span className="dot-sep">·</span>
                        <span>{formatDateTime(step.createdAt)}</span>
                      </div>
                    </div>
                    {step.imageData && (
                      <div className="detail-step-image">
                        <img src={step.imageData} alt={step.title} loading="lazy" />
                      </div>
                    )}
                    {step.description && (
                      <p className="detail-step-desc">{step.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="detail-section">
          <div className="section-header">
            <h2>所用材料清单</h2>
            <span className="section-count">共 {stats.materialUsages.length} 项</span>
          </div>
          {stats.materialUsages.length === 0 ? (
            <div className="section-empty">暂无材料使用记录</div>
          ) : (
            <div className="materials-breakdown">
              <div className="materials-table-wrapper">
                <table className="materials-breakdown-table">
                  <thead>
                    <tr>
                      <th style={{ width: '8%' }}>序号</th>
                      <th>材料名称</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>使用量</th>
                      <th style={{ width: '15%', textAlign: 'right' }}>单价</th>
                      <th style={{ width: '18%', textAlign: 'right' }}>小计成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.materialUsages.map((u, idx) => (
                      <tr key={u.id} style={{ animationDelay: `${idx * 40}ms` }}>
                        <td className="text-center">{idx + 1}</td>
                        <td className="material-name-cell">{u.materialName}</td>
                        <td className="text-right">{u.quantityUsed} {u.unit}</td>
                        <td className="text-right">{formatCurrency(u.unitPrice)}</td>
                        <td className="text-right sub-cost">
                          {formatCurrency(u.quantityUsed * u.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="total-label">材料成本合计</td>
                      <td className="total-cost">{formatCurrency(product.totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
