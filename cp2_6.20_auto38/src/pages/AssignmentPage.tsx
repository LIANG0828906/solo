import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useStore } from '../store/useStore';
import CodeEditor from '../components/CodeEditor';
import TestResultPanel from '../components/TestResultPanel';
import ReportPreview from '../components/ReportPreview';
import Loading from '../components/Loading';

dayjs.extend(relativeTime);

export default function AssignmentPage() {
  const { id } = useParams<{ id: string }>();
  const {
    currentAssignment,
    evaluationResult,
    code,
    language,
    isEvaluating,
    isLoading,
    fetchAssignment,
    evaluateCode,
    setCode,
    setLanguage,
    resetEvaluation,
  } = useStore();

  const [showReport, setShowReport] = useState(false);
  const [leftWidth, setLeftWidth] = useState(40);
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    if (id) fetchAssignment(id);
  }, [id, fetchAssignment]);

  useEffect(() => {
    return () => {
      resetEvaluation();
    };
  }, [resetEvaluation]);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const container = dividerRef.current?.parentElement;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.max(20, Math.min(60, percent)));
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const handleEvaluate = useCallback(() => {
    setShowReport(false);
    evaluateCode();
  }, [evaluateCode]);

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
  }, [setCode]);

  if (isLoading || !currentAssignment) {
    return <Loading />;
  }

  const deadline = dayjs(currentAssignment.deadline);
  const isOverdue = deadline.isBefore(dayjs());

  return (
    <div className="assignment-page">
      <div className="assignment-toolbar">
        <div className="toolbar-left">
          <h2 className="assignment-page-title">{currentAssignment.title}</h2>
          <span className={`assignment-deadline ${isOverdue ? 'overdue' : ''}`}>
            截止: {deadline.format('YYYY-MM-DD HH:mm')} ({deadline.fromNow()})
          </span>
          <span className={`status-badge status-${currentAssignment.status.replace('_', '-')}`}>
            {currentAssignment.status === 'not_started' ? '未开始' :
             currentAssignment.status === 'in_progress' ? '进行中' : '已提交'}
          </span>
        </div>
        <div className="toolbar-right">
          <select
            className="language-selector"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'python' | 'javascript' | 'java')}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
          </select>
          <button
            className="evaluate-btn"
            onClick={handleEvaluate}
            disabled={isEvaluating}
          >
            {isEvaluating ? <><span className="btn-spinner" /> 评测中...</> : '运行评测'}
          </button>
          <button className="submit-btn">提交</button>
        </div>
      </div>

      <div className="workspace-layout">
        <div className="workspace-left" style={{ width: `${leftWidth}%` }}>
          <div className="assignment-description">
            <ReactMarkdown>{currentAssignment.description}</ReactMarkdown>
          </div>
        </div>

        <div
          ref={dividerRef}
          className="workspace-divider"
          onMouseDown={handleMouseDown}
        />

        <div className="workspace-right" style={{ width: `${100 - leftWidth}%` }}>
          <CodeEditor
            initialCode={currentAssignment.templateCode}
            language={language}
            onChange={handleCodeChange}
            lintIssues={evaluationResult?.lintIssues ?? []}
          />

          {evaluationResult && !showReport && (
            <div className="workspace-results">
              <div className="results-toggle">
                <button
                  className="toggle-active"
                >
                  测试结果
                </button>
                <button onClick={() => setShowReport(true)}>
                  查看报告
                </button>
              </div>
              <TestResultPanel
                results={evaluationResult.testResults}
                lintIssues={evaluationResult.lintIssues}
              />
            </div>
          )}

          {evaluationResult && showReport && (
            <div className="workspace-results">
              <div className="results-toggle">
                <button onClick={() => setShowReport(false)}>
                  测试结果
                </button>
                <button className="toggle-active">
                  查看报告
                </button>
              </div>
              <ReportPreview
                evaluationResult={evaluationResult}
                assignmentTitle={currentAssignment.title}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
