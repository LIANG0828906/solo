import { useState } from 'react';
import { useDataStore } from '@/utils/dataStore';
import { CATEGORY_LABELS, type Product } from '@/types';

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const TagIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
    <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
);

const SparklesIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function ImageCarousel({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  const goPrev = () => setCurrent((c) => (c === 0 ? images.length - 1 : c - 1));
  const goNext = () => setCurrent((c) => (c === images.length - 1 ? 0 : c + 1));

  if (images.length === 0) {
    return (
      <div style={{ width: '100%', aspectRatio: '4/3', backgroundColor: 'var(--morandi-gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--morandi-brown)' }}>
        暂无图片
      </div>
    );
  }

  return (
    <div className="carousel">
      <div
        className="carousel-track"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((img, i) => (
          <div key={i} className="carousel-slide">
            <img src={img} alt={`图片 ${i + 1}`} />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          <button onClick={goPrev} className="carousel-arrow prev" aria-label="上一张">
            <ChevronLeftIcon style={{ width: 20, height: 20 }} />
          </button>
          <button onClick={goNext} className="carousel-arrow next" aria-label="下一张">
            <ArrowRightIcon style={{ width: 20, height: 20 }} />
          </button>
          <div className="carousel-dots">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`carousel-dot ${current === i ? 'active' : ''}`}
                aria-label={`第 ${i + 1} 张图片`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DetailPage() {
  const { state, navigate, addRequest } = useDataStore();
  const productId = state.route.params?.id;
  const product: Product | undefined = state.products.find((p) => p.id === productId);

  const [showModal, setShowModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [offerDescription, setOfferDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  const isOwner = product?.ownerId === state.currentUserId;

  const handleSubmit = () => {
    if (!offerDescription.trim()) {
      alert('请填写你能提供的物品描述');
      return;
    }
    if (!contactInfo.trim()) {
      alert('请填写联系方式');
      return;
    }
    if (!product) return;
    addRequest({
      productId: product.id,
      offerDescription: offerDescription.trim(),
      contactInfo: contactInfo.trim(),
      requesterId: state.currentUserId,
    });
    setShowModal(false);
    setShowSuccess(true);
    setOfferDescription('');
    setContactInfo('');
  };

  const conditionLabel = (v: number) => {
    if (v >= 9) return '几乎全新';
    if (v >= 7) return '成色较好';
    if (v >= 5) return '有使用痕迹';
    if (v >= 3) return '有明显磨损';
    return '品相一般';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (!product) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 768 }}>
            <button
              onClick={() => navigate({ name: 'browse' })}
              style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--morandi-brown)', transition: 'all 300ms' }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--morandi-gray)')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              aria-label="返回"
            >
              <ArrowLeftIcon style={{ width: 22, height: 22 }} />
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>物品详情</h1>
          </div>
        </div>
        <div style={{ padding: '64px 16px', textAlign: 'center' }}>
          <p style={{ color: 'var(--morandi-brown)', marginBottom: 16 }}>物品不存在或已下架</p>
          <button
            onClick={() => navigate({ name: 'browse' })}
            className="btn btn-primary"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 768 }}>
          <button
            onClick={() => navigate({ name: 'browse' })}
            style={{ width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--morandi-brown)', transition: 'all 300ms' }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--morandi-gray)')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            aria-label="返回"
          >
            <ArrowLeftIcon style={{ width: 22, height: 22 }} />
          </button>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>物品详情</h1>
        </div>
      </div>

      <div style={{ animation: 'fadeIn 300ms ease-out' }}>
        <ImageCarousel images={product.images} />

        <div className="detail-info">
          <div style={{ maxWidth: 768, margin: '0 auto' }}>
            <div className="detail-title-row">
              <h2 className="detail-title">{product.title}</h2>
              <span className="detail-category">{CATEGORY_LABELS[product.category]}</span>
            </div>

            <div className="detail-condition-row">
              <span className="detail-condition-item">
                <SparklesIcon style={{ width: 16, height: 16, color: 'var(--morandi-green)' }} />
                <span>新旧程度：<span className="detail-condition-value">{product.condition}/10</span></span>
              </span>
              <span className="detail-condition-label">{conditionLabel(product.condition)}</span>
            </div>

            <div className="detail-full-bar">
              <div
                className="detail-full-bar-fill"
                style={{ width: `${product.condition * 10}%` }}
              />
            </div>

            <div className="detail-preference">
              <TagIcon style={{ width: 16, height: 16, color: 'var(--morandi-sand)' }} />
              <span className="detail-preference-label">交换意向：</span>
              <span className="detail-preference-value">{product.exchangePreference}</span>
            </div>

            <div className="detail-date">发布于 {formatDate(product.createdAt)}</div>
          </div>
        </div>

        <div className="detail-description">
          <div style={{ maxWidth: 768, margin: '0 auto' }}>
            <h3 className="detail-section-title">物品描述</h3>
            <p className="detail-description-text">
              {product.description || '暂无详细描述'}
            </p>
          </div>
        </div>
      </div>

      <div className="detail-bottom-bar">
        <div className="detail-bottom-inner">
          {isOwner ? (
            <div className="detail-owner-hint">
              <MessageSquareIcon style={{ width: 18, height: 18 }} />
              <span>这是你发布的物品</span>
            </div>
          ) : product.status === 'sold' ? (
            <div className="detail-owner-hint">
              <CheckIcon style={{ width: 18, height: 18, color: 'var(--morandi-green)' }} />
              <span>这件物品已被交换</span>
            </div>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="btn btn-primary btn-block btn-lg"
              style={{ gap: 8 }}
            >
              <MessageSquareIcon style={{ width: 20, height: 20 }} />
              申请交换
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">申请交换</h3>
              <button onClick={() => setShowModal(false)} className="modal-close" aria-label="关闭">
                <XIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: 'var(--morandi-brown)', marginBottom: 20 }}>
                请描述你能提供的物品，以及联系方式，物主会与你联系。
              </p>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">你能提供的物品</label>
                <textarea
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  placeholder="描述一下你想用来交换的物品..."
                  rows={3}
                  className="textarea"
                  maxLength={300}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 20 }}>
                <label className="input-label">联系方式</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="微信号 / 手机号 / 其他"
                  className="input"
                  maxLength={50}
                />
              </div>

              <div className="modal-footer">
                <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                  取消
                </button>
                <button onClick={handleSubmit} className="btn btn-primary">
                  提交申请
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-backdrop" onClick={() => setShowSuccess(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 384 }}>
            <div className="modal-body">
              <div style={{ textAlign: 'center' }}>
                <div className="success-icon-wrap" style={{ animation: 'scaleIn 300ms ease-out' }}>
                  <CheckIcon style={{ width: 32, height: 32 }} />
                </div>
                <h3 className="success-title">申请已发送！</h3>
                <p className="success-desc">物主会收到你的交换申请，请耐心等待回复</p>
                <button
                  onClick={() => {
                    setShowSuccess(false);
                    navigate({ name: 'browse' });
                  }}
                  className="btn btn-primary"
                  style={{ padding: '10px 32px', borderRadius: 999, marginTop: 8 }}
                >
                  返回首页
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
