export default function HUD() {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-between p-4 pointer-events-none">
      <div className="text-white font-mono">
        <div>波次: 1</div>
        <div>敌人: 0</div>
      </div>
      <div className="text-white font-mono">
        <div>联动: 0</div>
      </div>
    </div>
  );
}
