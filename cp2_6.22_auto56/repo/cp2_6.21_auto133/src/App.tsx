import React, { useEffect, useRef } from 'react';
import { FaSearch, FaBriefcase, FaArrowRight } from 'react-icons/fa';
import ResumeUploader from './components/ResumeUploader';
import ResumeCard from './components/ResumeCard';
import JobCard from './components/JobCard';
import MatchDetail from './components/MatchDetail';
import { useAppStore } from './store';
import { PRESET_JOBS, MatcherModule } from './modules/matcher/MatcherModule';

const STAGGER_INTERVAL_MS = 100;

function applyStagger(items: NodeListOf<Element> | HTMLElement[]) {
  if (items.length === 0) return;

  let pendingVisibility: { el: HTMLElement; delay: number }[] = [];
  let frameId: number | null = null;

  items.forEach((item, index) => {
    const el = item as HTMLElement;
    const delay = index * STAGGER_INTERVAL_MS;
    el.style.transitionDelay = `${delay}ms`;

    if (!el.classList.contains('stagger-visible')) {
      pendingVisibility.push({ el, delay });
    }
  });

  if (pendingVisibility.length > 0) {
    const maxDelay = pendingVisibility[pendingVisibility.length - 1].delay;
    const step = (timestamp: number, start: number) => {
      const elapsed = timestamp - start;
      let batchDone = true;
      pendingVisibility = pendingVisibility.filter(({ el, delay }) => {
        if (elapsed >= delay) {
          el.classList.add('stagger-visible');
          return false;
        }
        batchDone = false;
        return true;
      });
      if (!batchDone && elapsed < maxDelay + 200) {
        frameId = requestAnimationFrame((ts) => step(ts, start));
      } else {
        pendingVisibility.forEach(({ el }) => el.classList.add('stagger-visible'));
        pendingVisibility = [];
        frameId = null;
      }
    };
    frameId = requestAnimationFrame((ts) => step(ts, performance.now()));
  }

  return () => {
    if (frameId !== null) cancelAnimationFrame(frameId);
  };
}

const App: React.FC = () => {
  const {
    resumeData,
    selectedJobId,
    matchResults,
    setSelectedJobId,
    setMatchResult,
  } = useAppStore();

  const observerRef = useRef<MutationObserver | null>(null);
  const cancelAnimRef = useRef<(() => void) | null>(null);
  const lastItemCountRef = useRef<number>(0);
  const rafScheduledRef = useRef<number | null>(null);

  const selectedJob = PRESET_JOBS.find((j) => j.id === selectedJobId) || null;
  const selectedMatch = selectedJobId ? matchResults[selectedJobId] : null;

  useEffect(() => {
    const reevaluate = () => {
      if (rafScheduledRef.current !== null) return;
      rafScheduledRef.current = requestAnimationFrame(() => {
        rafScheduledRef.current = null;
        const allItems = document.querySelectorAll<HTMLElement>('.stagger-item');
        if (allItems.length !== lastItemCountRef.current) {
          lastItemCountRef.current = allItems.length;
          if (cancelAnimRef.current) cancelAnimRef.current();
          cancelAnimRef.current = applyStagger(allItems) || null;
        } else {
          const newItems = document.querySelectorAll<HTMLElement>('.stagger-item:not(.stagger-visible)');
          if (newItems.length > 0) {
            if (cancelAnimRef.current) cancelAnimRef.current();
            cancelAnimRef.current = applyStagger(allItems) || null;
          }
        }
      });
    };

    const observer = new MutationObserver(() => {
      reevaluate();
    });
    observerRef.current = observer;

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });

    reevaluate();

    const handleResize = () => reevaluate();
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (rafScheduledRef.current !== null) cancelAnimationFrame(rafScheduledRef.current);
      if (cancelAnimRef.current) cancelAnimRef.current();
    };
  }, []);

  const handleJobClick = (jobId: string) => {
    setSelectedJobId(jobId);
    if (resumeData && !matchResults[jobId]) {
      const job = PRESET_JOBS.find((j) => j.id === jobId);
      if (job) {
        const result = MatcherModule.matchResumeToJob(resumeData, job);
        setMatchResult(jobId, result);
      }
    }
  };

  return (
    <div className="app-container">
      <div className="left-column">
        <ResumeUploader />
        <ResumeCard />
      </div>

      <div className="center-column">
        <div className="page-header stagger-item">
          <h1 className="page-title">智能简历解析与岗位匹配度评估器</h1>
          <p className="page-subtitle">
            上传您的简历PDF，系统将自动提取关键信息并与目标岗位进行多维度匹配分析，
            <br />
            助您快速了解自身优势与提升方向，精准定位心仪工作机会。
          </p>
        </div>

        {selectedJob && selectedMatch ? (
          <MatchDetail matchResult={selectedMatch} job={selectedJob} />
        ) : (
          <div className="match-detail-card guide-text stagger-item">
            <FaSearch className="guide-icon" />
            {!resumeData ? (
              <>
                <h3 className="guide-title">上传简历开始匹配</h3>
                <p className="guide-desc">
                  请在左侧上传您的简历PDF文件，系统将自动解析并结构化提取您的个人信息、技能、工作经历与教育背景。
                  <br />
                  <br />
                  解析完成后，点击右侧任意岗位卡片即可查看详细匹配分析报告。
                </p>
              </>
            ) : (
              <>
                <h3 className="guide-title">
                  <FaBriefcase style={{ marginRight: '8px' }} />
                  选择一个岗位查看匹配详情
                </h3>
                <p className="guide-desc">
                  简历已成功解析！请在右侧岗位列表中点击感兴趣的岗位卡片，
                  <br />
                  系统将为您展示五维雷达图分析、具体优势项和待提升建议。
                  <FaArrowRight style={{ marginLeft: '6px', verticalAlign: 'middle' }} />
                </p>
              </>
            )}
          </div>
        )}
      </div>

      <div className="right-column">
        <h3 className="right-column-title stagger-item">热门岗位推荐</h3>
        {PRESET_JOBS.map((job) => (
          <JobCard key={job.id} job={job} onClick={() => handleJobClick(job.id)} />
        ))}
      </div>
    </div>
  );
};

export default App;

