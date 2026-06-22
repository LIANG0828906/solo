import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useBoardStore } from '@/stores/boardStore';
import BoardCanvas from '@/components/BoardCanvas';
import Toolbar from '@/components/Toolbar';
import HistoryPanel from '@/components/HistoryPanel';
import FileMenu from '@/components/FileMenu';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function BoardPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { setRoomId, showClearConfirm, setShowClearConfirm, showRollbackConfirm, setShowRollbackConfirm, snapshots } = useBoardStore();

  useEffect(() => {
    if (roomId) {
      setRoomId(roomId);
    }
  }, [roomId, setRoomId]);

  const handleExport = () => {
    (window as any).__boardExport?.();
  };

  const handleClearConfirm = () => {
    (window as any).__boardClear?.();
  };

  const handleRollbackConfirm = () => {
    if (showRollbackConfirm) {
      (window as any).__boardRollback?.(showRollbackConfirm);
    }
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-white">
      <div className="flex flex-col w-[60px] bg-[#2C2C2C] shrink-0 z-20">
        <FileMenu onExport={handleExport} />
        <Toolbar />
      </div>
      <BoardCanvas />
      <HistoryPanel />

      <ConfirmDialog
        open={showClearConfirm}
        title="清除白板"
        message="确定要清空白板上的所有内容吗？此操作将通知房间内的其他用户。"
        onConfirm={handleClearConfirm}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmDialog
        open={!!showRollbackConfirm}
        title="回滚到历史版本"
        message="确定要回滚到此历史版本吗？回滚点之后的快照将被标记为过期。"
        onConfirm={handleRollbackConfirm}
        onCancel={() => setShowRollbackConfirm(null)}
      />
    </div>
  );
}
