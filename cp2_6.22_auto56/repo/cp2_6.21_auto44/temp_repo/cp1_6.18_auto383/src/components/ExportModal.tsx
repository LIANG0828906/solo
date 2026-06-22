import { useState, useEffect, useRef } from 'react';
import {
  X as CloseIcon,
  FileJson as FileJsonIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  AlertCircle as AlertCircleIcon,
} from 'lucide-react';
import { useTimelineStore } from '@/dataManager';
import { createUIController } from '@/uiController';
import { cn } from '@/lib/utils';

const ui = createUIController();

type TabKey = 'export' | 'import';

export default function ExportModal() {
  const showExportModal = useTimelineStore((s) => s.showExportModal);
  const events = useTimelineStore((s) => s.events);
  const connections = useTimelineStore((s) => s.connections);

  const [activeTab, setActiveTab] = useState<TabKey>('export');
  const [file, setFile] = useState<File | null>(null);
  const [validateState, setValidateState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [validateMsg, setValidateMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExportModal) {
        ui.closeExportModal();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showExportModal]);

  useEffect(() => {
    if (!showExportModal) {
      setActiveTab('export');
      setFile(null);
      setValidateState('idle');
      setValidateMsg('');
    }
  }, [showExportModal]);

  if (!showExportModal) return null;

  const handleClose = () => ui.closeExportModal();

  const handleFileSelect = async (f: File | null) => {
    setFile(f);
    if (!f) {
      setValidateState('idle');
      setValidateMsg('');
      return;
    }
    if (!f.name.toLowerCase().endsWith('.json')) {
      setValidateState('error');
      setValidateMsg('仅支持 .json 文件');
      return;
    }
    setValidateState('loading');
    setValidateMsg('正在校验文件...');
    try {
      const text = await f.text();
      const data = JSON.parse(text);
      if (data && data.events && Array.isArray(data.events)) {
        const evCount = data.events.length;
        const coCount = (data.connections ?? []).length;
        setValidateState('success');
        setValidateMsg(`校验通过：${evCount} 个事件，${coCount} 条关联`);
      } else {
        setValidateState('error');
        setValidateMsg('文件格式无效：缺少 events 字段');
      }
    } catch {
      setValidateState('error');
      setValidateMsg('文件解析失败：JSON 格式错误');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileSelect(f);
  };

  const handleImport = async () => {
    if (!file) return