import React, { useEffect, useState, useCallback } from 'react';
import { useAppStore } from './store';
import { eventBus } from './eventBus';
import { processText } from './TextProcessor';
import { saveSnapshot, compareSnapshots, CompareResult } from './VersionManager';
import { VersionPanel } from './VersionPanel';
import { SummaryCard } from './components/SummaryCard';
import { CompareModal } from './components/CompareModal';
import { Toast } from './components/Toast';

const SAMPLE_TEXT = `人工智能技术正在深刻改变我们的生活方式。从智能语音助手到自动驾驶汽车，从医疗诊断到金融风控，AI的应用场景越来越广泛。

在内容创作领域，人工智能同样发挥着重要作用。通过自然语言处理技术，AI可以帮助作者快速生成文章摘要、提取关键词、甚至自动撰写初稿。这不仅大大提高了工作效率，也让创作者能够将更多精力投入到创意和思考中。

然而，AI并非万能的。它生成的内容往往缺乏人类独特的情感和洞察力。因此，最佳的工作模式应该是"人机协作"——AI负责处理重复性、机械性的工作，而人类则专注于创意、审校和战略层面的决策。

展望未来，随着大语言模型的不断进化，我们有理由相信，内容创作的效率和质量都将迈上新的台阶。但无论技术如何发展，始终不变的是，好的内容源于对生活的观察和对人性的理解。`;

const App: React.FC = () => {
  const {
    versions,
    selectedVersionId,
    currentEditorText,
    currentWeibo,
    currentOfficialAccount,
    currentSeo,
    keywords,
    setCurrentEditorText,
    setProcessedResults,
    setCurrentWeibo,
    setCurrentOfficialAccount,
    setCurrentSeo,
    selectVersion,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);
  const [compareData, setCompareData] = useState<{
    targetSnapshot: typeof versions[number];
    diff: CompareResult;
  } | null>(null);

  useEffect(() => {
    const offProcess = eventBus.on('processText', ({ text }) => {
      handleProcess(text);
    });
    const offSave = eventBus.on('saveSnapshot', (data) => {
      handleSave(data);
    });
    return () => {
      offProcess();
      offSave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleProcess = useCallback((text: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      const result = processText(text);
      setProcessedResults(result);
      eventBus.emit('onProcessComplete', result);
      setIsProcessing(false);
      eventBus.emit('showToast', { message: '已生成3个版本的摘要' });
    }, 50);
  }, [setProcessedResults]);

  const handleSave = useCallback(
    (data: { weibo: string; officialAccount: string; seo: string }) => {
      const snapshot = saveSnapshot(data);
      eventBus.emit('onSnapshotCreated', {
        id: snapshot.id,
        timestamp: snapshot.timestamp,
      });
      eventBus.emit('showToast', { message: '版本快照已保存' });
      selectVersion(null);
    },
    [selectVersion]
  );

  const handleGenerate = () => {
    if (!currentEditorText.trim()) {
      eventBus.emit('showToast', { message: '请先输入文章内容' });
      return;
    }
    eventBus.emit('processText', { text: currentEditorText });
  };

  const handleSaveClick = () => {
    if (!currentWeibo && !currentOfficialAccount && !currentSeo) {
      eventBus.emit('showToast', { message: '暂无可保存的内容' });
      return;
    }
    eventBus.emit('saveSnapshot', {
      weibo: currentWeibo,
      officialAccount: currentOfficialAccount,
      seo: currentSeo,
    });
  };

  const handleCompare = () => {
    if (!selectedVersionId) return;
    const target = versions.find((v) => v.id === selectedVersionId);
    if (!target) return;

    const tempSnapshot = saveSnapshot({
      weibo: currentWeibo,
      officialAccount: currentOfficialAccount,
      seo: currentSeo,
    });
    const diff = compareSnapshots(tempSnapshot.id, selectedVersionId);
    useAppStore.getState().versions = useAppStore.getState().versions.filter(
      (v) => v.id !== tempSnapshot.id
    );

    if (diff) {
      setCompareData({ targetSnapshot: target, diff });
    }
  };

  const handleExport = () => {
    if (versions.length === 0) {
      eventBus.emit('showToast', { message: '暂无可导出的版本数据' });
      return;
    }
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalSnapshots: versions.length,
      snapshots: versions,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-versions-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    eventBus.emit('showToast', { message: '已导出版本数据' });
  };

  const handleLoadSample = () => {
    setCurrentEditorText(SAMPLE_TEXT);
  };

  const hasContent = currentWeibo || currentOfficialAccount || currentSeo;

  return (
    <div className="app-container">
      <div className="left-panel">
        <div className="header-bar">
          <span className="header-title">📝 文章编辑器</span>
        </div>
        <div className="editor-container">
          <div className="editor-label">
            <span>粘贴或输入文章内容</span>
            <span className="editor-char-count">
              {[...currentEditorText].length} 字
            </span>
          </div>
          <textarea
            className="text-editor"
            placeholder="在此粘贴你的博客文章，支持 Markdown 格式..."
            value={currentEditorText}
            onChange={(e) => setCurrentEditorText(e.target.value)}
          />
          <div className="editor-actions">
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isProcessing || !currentEditorText.trim()}
            >
              {isProcessing ? '生成中...' : '✨ 生成多版本摘要'}
            </button>
            <button className="btn btn-ghost" onClick={handleLoadSample}>
              加载示例
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="keywords-tags">
              {keywords.map((kw) => (
                <span key={kw} className="keyword-tag">
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="right-panel">
        <div className="header-bar">
          <span className="header-title">🚀 多渠道内容版本</span>
          <div className="header-actions">
            <button
              className="btn btn-outline save-btn"
              onClick={handleSaveClick}
              disabled={!hasContent}
            >
              💾 保存快照
            </button>
            <button className="btn btn-ghost" onClick={handleExport}>
              📤 导出全部
            </button>
          </div>
        </div>
        <div className="right-content">
          <div className="cards-section">
            <SummaryCard
              label="微博帖"
              value={currentWeibo}
              maxChars={140}
              onChange={setCurrentWeibo}
            />
            <SummaryCard
              label="公众号摘要"
              value={currentOfficialAccount}
              maxChars={300}
              onChange={setCurrentOfficialAccount}
            />
            <SummaryCard
              label="SEO描述"
              value={currentSeo}
              maxChars={80}
              onChange={setCurrentSeo}
            />
          </div>

          {!hasContent && (
            <div className="empty-state">
              <div className="empty-state-icon">👈</div>
              <div className="empty-state-text">
                在左侧粘贴文章并点击"生成多版本摘要"按钮开始
              </div>
            </div>
          )}

          <VersionPanel
            versions={versions}
            selectedId={selectedVersionId}
            onSelect={selectVersion}
            onCompare={handleCompare}
          />
        </div>
      </div>

      {compareData && (
        <CompareModal
          current={{
            weibo: currentWeibo,
            officialAccount: currentOfficialAccount,
            seo: currentSeo,
          }}
          target={compareData.targetSnapshot}
          diff={compareData.diff}
          onClose={() => setCompareData(null)}
        />
      )}

      <Toast />
    </div>
  );
};

export default App;
