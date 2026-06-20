import { useCallback, useEffect, useState } from 'react';
import Editor from '@/components/Editor';
import ControlPanel from '@/components/ControlPanel';
import TemplateSelector from '@/components/TemplateSelector';
import type { HazardZone } from '@/types/shared';
import { useEditorStore } from '@/stores/useEditorStore';

export default function App() {
  const [hazards, setHazards] = useState<HazardZone[]>([]);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  const handleHazardsChange = useCallback((newHazards: HazardZone[]) => {
    setHazards(newHazards);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [undo, redo]);

  return (
    <div
      className="w-full h-screen flex flex-col md:flex-row overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a252f 0%, #2c3e50 100%)',
      }}
    >
      <div className="relative w-full md:w-[70%] h-[60%] md:h-full min-h-0">
        <TemplateSelector />
        <Editor onHazardsChange={handleHazardsChange} />
      </div>
      <div className="w-full md:w-[30%] h-[40%] md:h-full min-h-0 p-2 md:p-4">
        <ControlPanel hazards={hazards} />
      </div>
    </div>
  );
}
