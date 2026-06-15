import { useEffect, useRef } from 'react';
import { FileJson, Image, Download } from 'lucide-react';
import { downloadJSON, downloadPNG } from '@/utils/export';
import type { MindMapNode } from '@/types/mindMap';

interface ExportMenuProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Record<string, MindMapNode>;
  rootId: string;
  canvasRef: React.RefObject<HTMLElement | null>;
}

export function ExportMenu({
  isOpen,
  onClose,
  nodes,
  rootId,
  canvasRef,
}: ExportMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleExportJSON = () => {
    downloadJSON(nodes, rootId);
    onClose();
  };

  const handleExportPNG = async () => {
    if (canvasRef.current) {
      await downloadPNG(canvasRef.current);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        top: '44px',
        right: 0,
        minWidth: '160px',
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border