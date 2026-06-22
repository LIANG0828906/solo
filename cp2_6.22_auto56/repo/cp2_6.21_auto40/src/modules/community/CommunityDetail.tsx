import { useParams } from 'react-router-dom';

export default function CommunityDetail() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="page-container">
      <h1>社区详情</h1>
      <p>批次 ID: {id}</p>
    </div>
  );
}
