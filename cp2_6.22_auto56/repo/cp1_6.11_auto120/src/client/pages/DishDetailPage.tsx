import { useParams } from 'react-router-dom';

export default function DishDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div style={{ padding: '24px', minHeight: '100vh' }}>
      <h1 style={{ color: '#fff', marginBottom: '24px' }}>菜品详情: {id}</h1>
      <div style={{ background: 'rgba(255,255,255,0.9)', borderRadius: '12px', padding: '24px' }}>
        <p>菜品详情内容</p>
      </div>
    </div>
  );
}
