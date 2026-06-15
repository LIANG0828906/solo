import WorksGallery from '@/components/WorksGallery';

export default function Gallery() {
  return (
    <div className="page-fade-enter">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          <i className="fa-solid fa-image" style={{ marginRight: 10, color: 'var(--color-accent-dark)' }}></i>
          作品墙
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
          展示您用心完成的每一件精美作品
        </p>
      </div>
      <WorksGallery />
    </div>
  );
}
