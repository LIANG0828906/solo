import React, { useEffect } from 'react';
import { FaSearch, FaBriefcase, FaArrowRight } from 'react-icons/fa';
import ResumeUploader from './components/ResumeUploader';
import ResumeCard from './components/ResumeCard';
import JobCard from './components/JobCard';
import MatchDetail from './components/MatchDetail';
import { useAppStore } from './store';
import { PRESET_JOBS, MatcherModule } from './modules/matcher/MatcherModule';

const App: React.FC = () => {
  const {
    resumeData,
    selectedJobId,
    matchResults,
    setSelectedJobId,
    setMatchResult,
  } = useAppStore();

  const selectedJob = PRESET_JOBS.find((j) => j.id === selectedJobId) || null;
  const selectedMatch = selectedJobId ? matchResults[selectedJobId] : null;

  useEffect(() => {
    const items = document.querySelectorAll('.stagger-item');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('stagger-visible');
      }, index * 100);
    });
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
