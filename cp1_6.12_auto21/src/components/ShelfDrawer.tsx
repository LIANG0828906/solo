interface ShelfDrawerProps {
  onClose: () => void;
}

export default function ShelfDrawer({ onClose }: ShelfDrawerProps) {
  return (
    <div className="bg-white p-4 max-h-[60vh] overflow-auto">
      <h2 className="text-lg font-bold text-wood-700 mb-3">书架详情</h2>
      <p className="text-wood-400 text-sm">选择书架查看详情</p>
    </div>
  );
}
