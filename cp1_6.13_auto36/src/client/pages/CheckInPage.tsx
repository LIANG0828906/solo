import CheckInScanner from '../components/CheckInScanner';

export default function CheckInPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">扫码签到</h1>
          <p className="page-subtitle">使用摄像头扫描活动二维码完成签到</p>
        </div>
      </div>
      <CheckInScanner />
    </div>
  );
}
