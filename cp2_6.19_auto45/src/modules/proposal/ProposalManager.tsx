import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Copy, Check, FileText, Eye, Save } from 'lucide-react';
import { ProposalPreview } from './ProposalPreview';
import { ServiceItemForm } from './ServiceItemForm';
import { useProposalStore } from '@/store/useProposalStore';
import { TEMPLATE_THEMES, TEMPLATE_LABELS, type TemplateType, type ServiceItem } from './types';
import { calculateTotal, formatCurrency, createProposal, updateProposal, getProposalById } from '@/api/mockApi';
import { useAnimatedCounter } from '@/hooks/useAnimatedCounter';
import { useToast } from '@/hooks/useToast';

export default function ProposalManager() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();

  const {
    id: storeId,
    title,
    clientName,
    template,
    services,
    shareLink,
    setId,
    setTitle,
    setClientName,
    setTemplate,
    addService,
    updateService,
    removeService,
    setShareLink,
    reset,
    loadProposal,
  } = useProposalStore();

  const [previewFade, setPreviewFade] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [clientError, setClientError] = useState(false);
  const [servicesError, setServicesError] = useState(false);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const p = await getProposalById(id);
      if (cancelled) return;
      if (p) {
        loadProposal(p);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, loadProposal]);

  useEffect(() => {
    if (!id) return;
    if (storeId === id) return;
  }, [id, storeId]);

  useEffect(() => {
    setPreviewFade(true);
    const t1 = setTimeout(() => setPreviewFade(false), 250);
    return () => clearTimeout(t1);
  }, [template]);

  const total = calculateTotal(services);
  const animatedTotal = useAnimatedCounter(total, 350);

  const handleAddService = () => {
    if (services.length >= 10) {
      show('最多添加 10 项服务');
      return;
    }
    const newItem: ServiceItem = {
      id: uuidv4(),
      name: '',
      description: '',
      unitPrice: 0,
      quantity: 1,
    };
    addService(newItem);
  };

  const handleCopyLink = async () => {
    if (!shareLink) {
      show('请先保存提案以生成分享链接');
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      show('分享链接已复制');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      show('复制失败，请手动复制');
    }
  };

  const triggerShake = (setter: (v: boolean) => void) => {
    setter(true);
    setTimeout(() => setter(false), 500);
  };

  const validate = () => {
    let ok = true;
    if (!title.trim()) {
      triggerShake(setTitleError);
      ok = false;
    }
    if (!clientName.trim()) {
      triggerShake(setClientError);
      ok = false;
    }
    if (services.length === 0) {
      triggerShake(setServicesError);
      ok = false;
    }
    return ok;
  };

  const handleSave = async () => {
    if (!validate()) {
      show('请填写必填项');
      return;
    }
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        clientName: clientName.trim(),
        template,
        services,
      };
      if (storeId) {
        const updated = await updateProposal(storeId, data);
        if (updated) {
          setShareLink(updated.shareLink);
          show('提案已更新');
          navigate('/tracking');
        }
      } else {
        const created = await createProposal(data);
        setId(created.id);
        setShareLink(created.shareLink);
        show('提案已创建');
        navigate('/tracking');
      }
    } catch (e) {
      show('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  const templates: TemplateType[] = ['minimal', 'business', 'creative'];

  if (loading) {
    return (
      <div className="ff-page">
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--ff-muted)' }}>
          加载中...
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <h1 className="ff-page__title">
        <FileText style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '10px', width: '28px', height: '28px', color: '#6366f1' }} />
        {storeId ? '编辑提案' : '新建提案'}
      </h1>
      <p className="ff-page__subtitle">填写基本信息，添加服务项，右侧实时预览效果</p>

      <div className="ff-editor-layout">
        <div className="ff-editor-col">
          <div className="ff-section">
            <h2 className="ff-section__title">基本信息</h2>
            <div className="ff-form-grid">
              <div className="ff-full">
                <label className="ff-label">提案标题 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className={`ff-input ${titleError ? 'ff-input--error' : ''}`}
                  placeholder="例如：企业官网设计与开发"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (titleError) setTitleError(false);
                  }}
                />
                {titleError && <div className="ff-error">请输入提案标题</div>}
              </div>
              <div className="ff-full">
                <label className="ff-label">客户名称 <span style={{ color: '#ef4444' }}>*</span></label>
                <input
                  type="text"
                  className={`ff-input ${clientError ? 'ff-input--error' : ''}`}
                  placeholder="例如：星辰科技有限公司"
                  value={clientName}
                  onChange={(e) => {
                    setClientName(e.target.value);
                    if (clientError) setClientError(false);
                  }}
                />
                {clientError && <div className="ff-error">请输入客户名称</div>}
              </div>
            </div>
          </div>

          <div className="ff-section">
            <h2 className="ff-section__title">
              <Eye style={{ width: '18px', height: '18px', color: '#6366f1' }} />
              选择模板
            </h2>
            <div className="ff-templates">
              {templates.map((t) => {
                const theme = TEMPLATE_THEMES[t];
                const isActive = template === t;
                return (
                  <div
                    key={t}
                    className={`ff-template-card ${isActive ? 'active' : ''}`}
                    onClick={() => setTemplate(t)}
                    style={isActive ? { borderColor: theme.primary } : undefined}
                  >
                    <div className="ff-template-card__thumb" style={{ background: theme.bg }}>
                      <div className="ff-template-card__thumb-header" style={{
                        background: t === 'minimal' ? theme.bgAlt : theme.headerBg,
                        borderBottom: `2px solid ${t === 'business' ? theme.accent : theme.border}`,
                      }}>
                        <div className="ff-template-card__thumb-line" style={{ background: theme.primary, width: '45%' }} />
                        <div className="ff-template-card__thumb-line ff-template-card__thumb-line--sm" style={{ background: theme.textMuted, width: '30%' }} />
                      </div>
                      <div className="ff-template-card__thumb-body">
                        <div className="ff-template-card__thumb-row" style={{ background: theme.tableStripe }}>
                          <div className="ff-template-card__thumb-bar" style={{ background: theme.border, width: '60%' }} />
                          <div className="ff-template-card__thumb-bar" style={{ background: theme.accent, width: '20%' }} />
                        </div>
                        <div className="ff-template-card__thumb-row">
                          <div className="ff-template-card__thumb-bar" style={{ background: theme.border, width: '55%' }} />
                          <div className="ff-template-card__thumb-bar" style={{ background: theme.accent, width: '18%' }} />
                        </div>
                      </div>
                    </div>
                    <div className="ff-template-card__name" style={{ color: isActive ? theme.primary : undefined }}>
                      {TEMPLATE_LABELS[t]}
                    </div>
                    <div className="ff-template-card__colors">
                      <span className="ff-template-card__dot" style={{ background: theme.primary }} />
                      <span className="ff-template-card__dot" style={{ background: theme.accent }} />
                      <span className="ff-template-card__dot" style={{ background: theme.bg }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="ff-section">
            <h2 className="ff-section__title">
              服务清单
              <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: 'var(--ff-muted)', fontWeight: 500 }}>
                {services.length}/10
              </span>
            </h2>

            {servicesError && (
              <div className="ff-error" style={{ marginBottom: '14px', animation: 'ff-shake 0.38s cubic-bezier(.36,.07,.19,.97) both' }}>
                请至少添加一项服务
              </div>
            )}

            {services.length === 0 ? (
              <div className="ff-service-list__empty">
                还没有服务项，点击下方按钮添加
              </div>
            ) : (
              <div className="ff-service-list">
                {services.map((item, idx) => (
                  <ServiceItemForm
                    key={item.id}
                    item={item}
                    index={idx}
                    onUpdate={(patch) => updateService(item.id, patch)}
                    onRemove={() => removeService(item.id)}
                  />
                ))}
              </div>
            )}

            <button
              type="button"
              className="ff-btn ff-btn--outline"
              style={{ marginTop: '14px', width: '100%' }}
              onClick={handleAddService}
              disabled={services.length >= 10}
            >
              <Plus size={18} />
              添加服务项
            </button>

            <div className="ff-total-row">
              <span className="ff-total-row__label">合计金额</span>
              <span className="ff-total-row__value">
                {formatCurrency(animatedTotal)}
              </span>
            </div>
          </div>

          <div className="ff-section">
            <h2 className="ff-section__title">分享链接</h2>
            <div className="ff-share">
              <div className="ff-share__link">
                {shareLink || '保存后自动生成分享链接'}
              </div>
              <button
                type="button"
                className={`ff-btn ff-btn--primary ff-btn--sm ff-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="ff-btn ff-btn--primary"
              style={{ flex: 1, padding: '14px 24px', fontSize: '15.5px' }}
              onClick={handleSave}
              disabled={saving}
            >
              <Save size={18} />
              {saving ? '保存中...' : (storeId ? '更新提案' : '保存提案')}
            </button>
          </div>
        </div>

        <div className="ff-editor-col">
          <div className="ff-preview-wrap">
            <div className={`ff-preview ${previewFade ? 'ff-preview--fading' : 'ff-preview--visible'}`}>
              <ProposalPreview
                title={title}
                clientName={clientName}
                template={template}
                services={services}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
