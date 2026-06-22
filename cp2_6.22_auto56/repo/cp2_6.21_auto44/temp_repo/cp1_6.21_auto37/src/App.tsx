import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  ActiveTab,
  JobRole,
  ParsedResult
} from './types';
import { STORAGE_KEYS } from './types';
import { DEFAULT_JOB } from './constants/jobTemplates';
import { SAMPLE_RESUME } from './constants/sampleResume';
import { parseResume } from './engine/ParserEngine';
import { readLS, writeLS } from './hooks/useLocalStorage';
import { useResponsive } from './hooks/useResponsive';
import { ResumeInput } from './components/ResumeInput';
import { TabNav } from './components/TabNav';
import { SkillRadar } from './components/SkillRadar';
import { SkillWordCloud } from './components/SkillWordCloud';
import { ExperienceTimeline } from './components/ExperienceTimeline';
import { MatchScore } from './components/MatchScore';
import { MobileHeader } from './components/MobileHeader';

const TAB_KEYS: ActiveTab[] = ['skills', 'timeline', 'matching'];

function App() {
  const responsive = useResponsive();

  const [resumeText, setResumeText] = useState<string>(() =>
    readLS<string>(STORAGE_KEYS.RESUME_TEXT, SAMPLE_RESUME)
  );
  const [parsedResult, setParsedResult] = useState<ParsedResult | null>(() =>
    readLS<ParsedResult | null>(STORAGE_KEYS.PARSED_RESULT, null)
  );
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [inputFading, setInputFading] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = readLS<ActiveTab | null>(STORAGE_KEYS.ACTIVE_TAB, null);
    return saved && TAB_KEYS.includes(saved) ? saved : 'skills';
  });
  const [selectedJob, setSelectedJob] = useState<JobRole>(() => {
    const saved = readLS<JobRole | null>(STORAGE_KEYS.SELECTED_JOB, null);
    return saved ?? DEFAULT_JOB;
  });
  const [mobileInputOpen, setMobileInputOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [tabEntering, setTabEntering] = useState<ActiveTab>(activeTab);

  const progressTimer = useRef<number | null>(null);

  useEffect(() => {
    writeLS(STORAGE_KEYS.RESUME_TEXT, resumeText);
  }, [resumeText]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.PARSED_RESULT, parsedResult);
  }, [parsedResult]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  useEffect(() => {
    writeLS(STORAGE_KEYS.SELECTED_JOB, selectedJob);
  }, [selectedJob]);

  const runParse = useCallback(() => {
    const text = resumeText.trim();
    if (!text) return;
    if (isParsing) return;

    setIsParsing(true);
    setParseProgress(0);
    setInputFading(true);

    let progress = 0;
    const totalMs = 1400;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      progress = Math.min(95, (elapsed / totalMs) * 100);
      setParseProgress(Math.round(progress));
      if (elapsed < totalMs) {
        progressTimer.current = window.requestAnimationFrame(tick);
      } else {
        try {
          const result = parseResume(text);
          setParsedResult(result);
          setAnimKey((k) => k + 1);
          setParseProgress(100);
          setActiveTab('skills');
          setTabEntering('skills');
          setTimeout(() => {
            setIsParsing(false);
            setInputFading(false);
            setMobileInputOpen(false);
          }, 500);
        } catch (e) {
          console.error('Parse error:', e);
          setIsParsing(false);
          setInputFading(false);
          setParseProgress(0);
          alert('简历解析失败，请检查文本格式后重试');
        }
      }
    };
    progressTimer.current = window.requestAnimationFrame(tick);
  }, [resumeText, isParsing]);

  useEffect(() => {
    return () => {
      if (progressTimer.current) cancelAnimationFrame(progressTimer.current);
    };
  }, []);

  const handleTabChange = useCallback((tab: ActiveTab) => {
    if (tab === activeTab) return;
    setTabEntering(tab);
    setTimeout(() => {
      setActiveTab(tab);
    }, 10);
  }, [activeTab]);

  const mainVisible = parsedResult !== null || isParsing;

  return (
    <>
      <MobileHeader
        open={mobileInputOpen}
        onToggle={() => setMobileInputOpen((v) => !v)}
      />
      <div className="app-layout">
        <ResumeInput
          value={resumeText}
          onChange={setResumeText}
          onParse={runParse}
          isParsing={isParsing}
          parseProgress={parseProgress}
          fading={inputFading && !responsive.isMobile}
          mobileOpen={mobileInputOpen}
          isMobile={responsive.isMobile}
        />

        <section
          className={`main-panel ${mainVisible ? 'visible' : 'empty'}`}
        >
          {!mainVisible && (
            <div className="empty-state">
              <h2>👋 欢迎使用智能简历仪表盘</h2>
              <p>
                将您的简历文本粘贴到左侧输入框，点击「开始解析」按钮，
                系统将自动提取<strong style={{ color: '#1565C0' }}>技能标签</strong>、
                <strong style={{ color: '#1565C0' }}>工作经历</strong>和
                <strong style={{ color: '#1565C0' }}>项目信息</strong>，
                并以可视化形式呈现。
              </p>
              <p style={{ fontSize: 13, color: '#90a4ae' }}>
                💡 输入框中已预置一份示例简历，可直接点击解析查看效果
              </p>
            </div>
          )}

          {mainVisible && (
            <>
              <TabNav active={activeTab} onChange={handleTabChange} />

              <div className="tab-content-wrap">
                {TAB_KEYS.map((tab) => {
                  const isActive = tab === activeTab;
                  const isEntering = tab === tabEntering && !isActive;
                  const show = isActive || isEntering;
                  if (!show) return null;

                  let content: React.ReactNode = null;

                  if (tab === 'skills' && parsedResult) {
                    content = (
                      <div className="skills-section">
                        <SkillRadar
                          scores={parsedResult.skillScores}
                          animationKey={animKey}
                        />
                        <SkillWordCloud words={parsedResult.wordFrequencies} />
                      </div>
                    );
                  } else if (tab === 'timeline' && parsedResult) {
                    content = (
                      <ExperienceTimeline
                        experiences={parsedResult.experiences}
                      />
                    );
                  } else if (tab === 'matching' && parsedResult) {
                    content = (
                      <MatchScore
                        parsed={parsedResult}
                        initialJob={selectedJob}
                        onJobChange={setSelectedJob}
                        animationKey={animKey}
                      />
                    );
                  }

                  if (!content) return null;

                  return (
                    <div
                      key={tab}
                      className={`tab-content ${isActive ? 'active' : ''} ${
                        isEntering ? 'entering' : ''
                      }`}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  );
}

export default App;
