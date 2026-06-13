import { useParams } from 'react-router-dom';

export default function ActivityPage() {
  const { activityId } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">
        活动详情 #{activityId}
      </h1>
      <p className="mt-2 text-gray-600">活动页面内容</p>
    </div>
  );
}
