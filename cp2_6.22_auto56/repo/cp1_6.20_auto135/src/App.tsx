import React, { useState, useCallback } from 'react';
import Scene from '@components/Scene';
import UIPanel from '@components/UIPanel';
import {
  Stratum,
  Fault,
  GeologyTemplate,
  createDefaultTemplate
} from '@utils/geologyData';

export type CameraMode = 'auto' | 'manual';

export interface SectionCut {
  axis: 'x' | 'y' | 'z';
  position: number;
  enabled: boolean;
}

const App: React.FC = () => {
  const defaultTemplate = createDefaultTemplate();

  const [strata, setStrata] = useState<Stratum[]>(defaultTemplate.strata);
  const [faults, setFaults] = useState<Fault[]>(defaultTemplate.faults);
  const [modelSize, setModelSize] = useState(defaultTemplate.modelSize);
  const [cameraMode, setCameraMode] = useState<CameraMode>('auto');
  const [templateName, setTemplateName] = useState(defaultTemplate.name);
  const [sectionCut, setSectionCut] = useState<SectionCut | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const updateStratum = useCallback((id: string, updates: Partial<Stratum>) => {
    setStrata((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const addStratum = useCallback(() => {
    if (strata.length >= 7) return;
    const newStratum: Stratum = {
      id: `stratum-${Date.now()}`,
      name: `新地层 ${strata.length + 1}`,
      lithologyCode: `L${strata.length + 1}`,
      thickness: 30,
      color: '#A0522D',
      textureDensity: 0.5
    };
    setStrata((prev) => [...prev, newStratum]);
  }, [strata.length]);

  const removeStratum = useCallback((id: string) => {
    if (strata.length <= 4) return;
    setStrata((prev) => prev.filter((s) => s.id !== id));
  }, [strata.length]);

  const updateFault = useCallback((id: string, updates: Partial<Fault>) => {
    setFaults((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  }, []);

  const addFault = useCallback(() => {
    if (faults.length >= 3) return;
    const newFault: Fault = {
      id: `fault-${Date.now()}`,
      type: 'normal',
      dip: 60,
      strike: 0,
      throw: 20,
      position: (faults.length + 1) * 0.25
    };
    setFaults((prev) => [...prev, newFault]);
  }, [faults.length]);

  const removeFault = useCallback((id: string) => {
    if (faults.length <= 1) return;
    setFaults((prev) => prev.filter((f) => f.id !== id));
  }, [faults.length]);

  const handleSaveTemplate = useCallback(async () => {
    const { saveTemplate } = await import('@utils/geologyData');
    const template: GeologyTemplate = {
      id: '',
      name: templateName,
      strata,
      faults,
      modelSize,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await saveTemplate(template);
    alert('模板保存成功！');
  }, [templateName, strata, faults, modelSize]);

  const handleLoadTemplate = useCallback(
    (template: GeologyTemplate) => {
      setTemplateName(template.name);
      setStrata(template.strata);
      setFaults(template.faults);
      setModelSize(template.modelSize);
    },
    []
  );

  const handleReset = useCallback(() => {
    const def = createDefaultTemplate();
    setStrata(def.strata);
    setFaults(def.faults);
    setModelSize(def.modelSize);
    setSectionCut(null);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Scene
        strata={strata}
        faults={faults}
        modelSize={modelSize}
        cameraMode={cameraMode}
        sectionCut={sectionCut}
        onSectionCutChange={setSectionCut}
      />
      <UIPanel
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(!isPanelOpen)}
        strata={strata}
        faults={faults}
        modelSize={modelSize}
        cameraMode={cameraMode}
        templateName={templateName}
        sectionCut={sectionCut}
        onUpdateStratum={updateStratum}
        onAddStratum={addStratum}
        onRemoveStratum={removeStratum}
        onUpdateFault={updateFault}
        onAddFault={addFault}
        onRemoveFault={removeFault}
        onCameraModeChange={setCameraMode}
        onTemplateNameChange={setTemplateName}
        onSaveTemplate={handleSaveTemplate}
        onLoadTemplate={handleLoadTemplate}
        onModelSizeChange={setModelSize}
        onSectionCutChange={setSectionCut}
        onReset={handleReset}
      />
    </div>
  );
};

export default App;
