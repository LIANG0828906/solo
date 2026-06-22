import { useMemo, useCallback, useEffect, useState } from 'react';
import { useSelectionStore } from '@/stores/selectionStore';
import SelectionCard from '@/components/SelectionCard';
import ResultPanel from '@/components/ResultPanel';
import type { Option } from '@/stores/selectionStore';

const DEMO_OPTIONS: { title: string; description: string }[] = [
  { title: '勇敢面对', description: '主角挺身而出，直面黑暗势力的威胁' },
  { title: '悄悄逃离', description: '趁夜色掩护，沿着密道悄然离开' },
  { title: '寻求帮助', description: '向城镇的守卫和长者请求支援' },
  { title: '隐藏真相', description: '将秘密藏在心底，假装一切如常' },
];

function OptionCreator() {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const addOption = useSelectionStore((s) => s.addOption);
  const optionIds = useSelectionStore((s) => s.optionIds);
  const lockedOptionId = useSelectionStore((s) => s.lockedOptionId);

  const canAdd = optionIds.length < 6 && !lockedOptionId;

  const handleAdd = useCallback(() => {
    const trimmedTitle = title.trim().slice(0, 20);
    const trimmedDesc = desc.trim().slice(0, 50);
    if (!trimmedTitle || !canAdd) return;
    addOption(trimmedTitle, trimmedDesc);
    setTitle('');
    setDesc('');
  }, [title, desc, canAdd, addOption]);

  if (!canAdd && optionIds.length >= 6) return null;

  return (
    <div className="option-creator">
      <input
        type="text"
        placeholder="选项标题（≤20字）"
        value={title}
        onChange={(e) => setTitle(e.target.value.slice(0, 20))}
        maxLength={20}
        disabled={!canAdd}
        className="creator-input"
      />
      <input
        type="text"
        placeholder="简短描述（≤50字）"
        value={desc}
        onChange={(e) => setDesc(e.target.value.slice(0, 50))}
        maxLength={50}
        disabled={!canAdd}
        className="creator-input"
      />
      <button
        onClick={handleAdd}
        disabled={!canAdd || !title.trim()}
        className="creator-btn"
      >
        添加选项
      </button>
    </div>
  );
}

function App() {
  const optionsMap = useSelectionStore((s) => s.optionsMap);
  const optionIds = useSelectionStore((s) => s.optionIds);
  const vote = useSelectionStore((s) => s.vote);
  const reset = useSelectionStore((s) => s.reset);
  const lockedOptionId = useSelectionStore((s) => s.lockedOptionId);
  const feedback = useSelectionStore((s) => s.feedback);

  const [bgColor, setBgColor] = useState('#0D1117');

  const options = useMemo(
    () => optionIds.map((id) => optionsMap[id]).filter(Boolean) as Option[],
    [optionIds, optionsMap]
  );

  const lockedOption = useMemo(
    () => (lockedOptionId ? optionsMap[lockedOptionId] : null),
    [lockedOptionId, optionsMap]
  );

  const handleVote = useCallback(
    (optionId: string) => {
      vote(optionId);
    },
    [vote]
  );

  const handleReset = useCallback(() => {
    reset();
    setBgColor('#0D1117');
  }, [reset]);

  const handleLoadDemo = useCallback(() => {
    const store = useSelectionStore.getState();
    for (const opt of DEMO_OPTIONS) {
      store.addOption(opt.title, opt.description);
    }
  }, []);

  useEffect(() => {
    if (feedback?.colorFilter) {
      setBgColor(feedback.colorFilter);
    }
  }, [feedback]);

  return (
    <div className="app-root" style={{ background: bgColor }}>
      <header className="app-header">
        <button className="reset-btn" onClick={handleReset} title="重置">
          ↺
        </button>
        <h1 className="app-title">剧情互动投票</h1>
        <p className="app-subtitle">你的选择改变故事</p>
      </header>

      {optionIds.length === 0 && (
        <div className="empty-state">
          <p className="empty-text">暂无选项</p>
          <button className="demo-btn" onClick={handleLoadDemo}>
            加载示例剧情
          </button>
        </div>
      )}

      <OptionCreator />

      <div className="card-grid">
        {options.map((opt) => (
          <SelectionCard key={opt.id} option={opt} onVote={handleVote} />
        ))}
      </div>

      {lockedOption && feedback && (
        <div className="result-wrapper">
          <ResultPanel lockedOption={lockedOption} feedback={feedback} />
        </div>
      )}
    </div>
  );
}

export default App;
