import { useState } from "react";
import { X, Copy, Users } from "lucide-react";
import { useWorkshopStore } from "@/store/workshop";

export default function CreateWorkshopModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { createWorkshop } = useWorkshopStore();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteCode: string; shareLink: string } | null>(null);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await createWorkshop({ name: name.trim(), description: description.trim(), maxParticipants });
      setResult({ inviteCode: data.inviteCode, shareLink: data.shareLink });
    } catch (err) {
      alert(err instanceof Error ? err.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">创建工作坊</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {result ? (
          <div className="p-5 space-y-4">
            <div className="text-center text-green-600 text-sm font-medium">创建成功！</div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">邀请码</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {result.inviteCode}
                  </span>
                  <button onClick={() => copyText(result.inviteCode)} className="text-gray-400 hover:text-primary">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">分享链接</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 break-all">{result.shareLink}</span>
                  <button onClick={() => copyText(result.shareLink)} className="text-gray-400 hover:text-primary shrink-0">
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="btn-primary w-full">完成</button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工作坊名称</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="输入工作坊名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                placeholder="输入工作坊描述"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Users size={14} className="inline mr-1" />
                参与人数上限: {maxParticipants}
              </label>
              <input
                type="range"
                min={2}
                max={20}
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>2</span>
                <span>20</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim()}
              className="btn-accent w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "创建中..." : "创建工作坊"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
