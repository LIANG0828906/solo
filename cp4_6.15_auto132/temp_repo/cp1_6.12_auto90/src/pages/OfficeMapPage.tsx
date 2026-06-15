import Navbar from '@/components/Navbar';
import OfficeMap from '@/components/OfficeMap';

export default function OfficeMapPage() {
  return (
    <>
      <Navbar />
      <div className="container page-wrapper">
        <h1 className="page-title">🗺️ 办公室平面图</h1>
        <p className="page-desc">
          10 × 8 虚拟工位地图。悬停头像查看偏好摘要，点击头像放大查看完整详情。
          带呼吸动画的是你的工位 ✨
        </p>

        <OfficeMap />
      </div>
    </>
  );
}
