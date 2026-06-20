import { useParams } from 'react-router-dom';

export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>拍卖详情</h1>
      <p>当前拍卖品 ID: {id}</p>
    </div>
  );
}
