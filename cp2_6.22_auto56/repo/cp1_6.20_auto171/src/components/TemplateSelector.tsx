import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useEditorStore } from '@/stores/useEditorStore';
import { listTemplates, getTemplate } from '@/api';

export default function TemplateSelector() {
  const templateList = useEditorStore((s) => s.templateList);
  const setTemplateList = useEditorStore((s) => s.setTemplateList);
  const replaceLevel = useEditorStore((s) => s.replaceLevel);
  const setLoading = useEditorStore((s) => s.setLoading);
  const [selectedId, setSelectedId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);

  const fetchList = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setRefreshing(true);
    setLoading(true);
    try {
      const list = await listTemplates();
      setTemplateList(list);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
      setLoading(false);
      loadingRef.current = false;
    }
  }, [setTemplateList, setLoading]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) return;
    setSelectedId(id);
    setLoading(true);
    try {
      const template = await getTemplate(id);
      replaceLevel(template.level);
    } catch (e) {
      console.error(e);
    } finally {
      setSelectedId('');
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-4 left-4 z-30 flex items-center gap-2">
      <label className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2 text-sm">
        <span className="text-white font-medium whitespace-nowrap">加载模板</span>
        <select
          value={selectedId}
          onChange={handleSelect}
          className="bg-transparent text-white border border-white/20 rounded px-2 py-1 outline-none focus:border-white/40 cursor-pointer"
        >
          <option value="" className="bg-gray-800">-- 选择模板 --</option>
          {templateList.map((t) => (
            <option key={t.id} value={t.id} className="bg-gray-800">
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <button
        onClick={fetchList}
        disabled={refreshing}
        className="glass-panel rounded-lg px-3 py-2 text-white hover:bg-white/10 disabled:opacity-50 transition-all duration-200 ease"
        title="刷新列表"
      >
        <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
      </button>
    </div>
  );
}
