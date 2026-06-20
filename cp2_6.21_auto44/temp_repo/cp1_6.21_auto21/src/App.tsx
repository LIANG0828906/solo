import { useState, useCallback, useMemo } from 'react';
import CardEditor from './CardEditor';
import CardPreview from './CardPreview';
import { templates, getTemplateById, LayoutConfig } from './templates';
function App() {
 const [title, setTitle] = useState('如何打造个人品牌');
 const [body, setBody] = useState('在这个信息爆炸的时代，建立独特的个人品牌已经成为脱颖而出的关键。本文将分享三个核心策略，帮助你从零开始打造令人印象深刻的个人IP。');
 const [templateId, setTemplateId] = useState('minimal-white');
 const [showGrid, setShowGrid] = useState(false);
 const [showExport, setShowExport] = useState(false);
 const [isExporting, setIsExporting] = useState(false);
 const currentTemplate = useMemo(() => getTemplateById(templateId), [templateId]);
 const [layout, setLayout] = useState<LayoutConfig>(currentTemplate.defaultLayout);
 const handleTemplateChange = useCallback((newTemplateId: string) => {
 const newTemplate = getTemplateById(newTemplateId);
 setTemplateId(newTemplateId);
 setLayout({ ...newTemplate.defaultLayout });
 }, []);
 const handleLayoutChange = useCallback((newLayout: LayoutConfig) => {
 setLayout(newLayout);
 }, []);
 const handleResetLayout = useCallback(() => {
 setLayout({ ...currentTemplate.defaultLayout });
 }, [currentTemplate]);
 const handleExport = useCallback(() => {
 setIsExporting(true);
 setShowExport(true);
 setTimeout(() => {
 setIsExporting(false);
 }, 1500);
 }, []);
 const handleCloseExport = useCallback(() => {
 setShowExport(false);
 }, []);
 const handleExportComplete = useCallback(() => {
 setIsExporting(false);
 }, []);
 return (<div className="app" style={{ '--template-primary': currentTemplate.colors.primary } as React.CSSProperties}>
 <nav className="navbar">
 <div className="navbar-brand">
 <div className="navbar-brand-icon">C</div>
 <span>卡片工坊</span>
 </div>

 <div className="navbar-center">
 <select className="template-select" value={templateId} onChange={(e) => handleTemplateChange(e.target.value)}>
 {templates.map((t) => (<option key={t.id} value={t.id}>
 {t.name}
 </option>))}
 </select>
 </div>

 <button className="export-btn" onClick={handleExport}>
 导出卡片
 </button>
 </nav>

 <div className="main-content">
 <CardEditor title={title} body={body} templateId={templateId} showGrid={showGrid} onTitleChange={setTitle} onBodyChange={setBody} onTemplateChange={handleTemplateChange} onShowGridChange={setShowGrid} onResetLayout={handleResetLayout}/>

 <CardPreview title={title} body={body} template={currentTemplate} layout={layout} showGrid={showGrid} onLayoutChange={handleLayoutChange} onToggleGrid={() => setShowGrid(!showGrid)} isExporting={isExporting} onExportComplete={handleExportComplete} showExport={showExport} onCloseExport={handleCloseExport}/>
 </div>
 </div>);
}
export default App;
