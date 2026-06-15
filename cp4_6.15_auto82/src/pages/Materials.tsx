import MaterialList from '@/components/MaterialList';

export default function Materials() {
  return (
    <div className="page-fade-enter">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>
          <i className="fa-solid fa-boxes-stacked" style={{ marginRight: 10, color: 'var(--color-primary)' }}></i>
          材料库
        </h1>
        <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
          管理您的毛线、木材、颜料等手工材料
        </p>
      </div>
      <MaterialList />
    </div>
  );
}
