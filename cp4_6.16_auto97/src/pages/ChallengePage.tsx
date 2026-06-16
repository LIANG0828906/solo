import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useStore } from '@/store';
import CodeEditorPanel from '@/components/CodeEditorPanel';
import AchievementBadge from '@/components/AchievementBadge';
import type { Language } from '@/types';

export default function ChallengePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    challenges,
    currentChallenge,
    isRunning,
    isSubmitting,
    runOutput,
    runError,
    testStatus,
    achievements,
    showAchievementAnimation,
    newlyUnlockedAchievement,
    dismissAchievementAnimation,
    setCurrentChallenge,
    executeCode,
    submitCode,
  } = useStore();

  const [language, setLanguage] = useState<Language>('javascript');
  const [currentCode, setCurrentCode] = useState('');

  const challenge = challenges.find(c => c.id === id);

  useEffect(() => {
    if (challenge && (!currentChallenge || currentChallenge.id !== challenge.id)) {
      setCurrentChallenge(challenge);
    }
  }, [challenge, currentChallenge, setCurrentChallenge]);

  useEffect(() => {
    if (challenge) {
      setCurrentCode(language === 'javascript' ? challenge.initialCodeJS : challenge.initialCodePY);
    }
  }, [challenge, language]);

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  const handleRun = useCallback(() => {
    const code = currentCode;
    executeCode(code, language);
  }, [currentCode, language, executeCode]);

  const handleSubmit = useCallback(() => {
    if (!challenge) return;
    const code = currentCode;
    submitCode(code, language, challenge);
  }, [currentCode, language, challenge, submitCode]);

  if (!challenge) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary text-lg mb-4">题目未找到</p>
          <button
            onClick={() => navigate('/')}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-accent-hover"
          >
            返回主页
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#45475a] h-full">
        <div className="flex items-center gap-2 border-b border-[#45475a] p-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-text-secondary transition-colors hover:text-accent"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">返回</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar p-4">
          <div className="markdown-content" dangerouslySetInnerHTML={{ __html: renderMarkdown(challenge.description) }} />
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full p-4">
        <div className="flex-1 min-h-0">
          <CodeEditorPanel
            initialCode={currentCode}
            language={language}
            onRun={handleRun}
            onSubmit={handleSubmit}
            isRunning={isRunning}
            isSubmitting={isSubmitting}
            output={runOutput}
            error={runError}
            testStatus={testStatus}
            onLanguageChange={handleLanguageChange}
          />
        </div>
      </div>

      {showAchievementAnimation && newlyUnlockedAchievement && (
        <div className="achievement-overlay" onClick={dismissAchievementAnimation}>
          <div className="flex flex-col items-center">
            <div className="achievement-icon-anim text-7xl">
              {newlyUnlockedAchievement.icon}
            </div>
            <div className="mt-4 animate-fade-in text-center">
              <p className="text-lg font-bold text-accent">成就解锁!</p>
              <p className="text-sm text-text-primary">{newlyUnlockedAchievement.name}</p>
              <p className="text-xs text-text-secondary">{newlyUnlockedAchievement.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function renderMarkdown(md: string): string {
  let html = md;

  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  html = html.replace(/^---$/gm, '<hr/>');

  const lines = html.split('\n');
  const result: string[] = [];
  let inList = false;
  let inParagraph = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('<h') || trimmed.startsWith('<hr')) {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inParagraph) { result.push('</p>'); inParagraph = false; }
      result.push(trimmed);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (inParagraph) { result.push('</p>'); inParagraph = false; }
      if (!inList) { result.push('<ul>'); inList = true; }
      result.push(`<li>${trimmed.slice(2)}</li>`);
      continue;
    }

    if (trimmed === '') {
      if (inList) { result.push('</ul>'); inList = false; }
      if (inParagraph) { result.push('</p>'); inParagraph = false; }
      continue;
    }

    if (!inList && !inParagraph) {
      result.push(`<p>${trimmed}</p>`);
    } else if (inParagraph) {
      result.push(trimmed);
    }
  }

  if (inList) result.push('</ul>');
  if (inParagraph) result.push('</p>');

  return result.join('\n');
}
