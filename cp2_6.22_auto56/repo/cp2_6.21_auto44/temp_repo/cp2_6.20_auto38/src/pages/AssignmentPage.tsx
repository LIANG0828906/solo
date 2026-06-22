import { useEffect, useState, useCallback, useRef, lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useStore } from '../store/useStore';
import Loading from '../components/Loading';

const CodeEditor = lazy(() => import('../components/CodeEditor'));
const TestResultPanel = lazy(() => import('../components/TestResultPanel'));
const ReportPreview = lazy(() => import('../components/ReportPreview'));

dayjs.extend(relativeTime);

const MOBILE_BREAKPOINT = 768;

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
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const mouseMoveHandler = useRef<((e: MouseEvent) => void) | null>(null);
  const mouseUpHandler = useRef<((e: MouseEvent) => void) | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileLayout(window.innerWidth <= MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (id) fetchAssignment(id);
  }, [id, fetchAssignment]);

  useEffect(() => {
    return () => {
      resetEvaluation();
    };
  }, [resetEvaluation]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const container = dividerRef.current?.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    setLeftWidth(Math.max(20, Math.min(60, percent)));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
    if (mouseMoveHandler.current) {
      document.removeEventListener('mousemove', mouseMoveHandler.current);
      mouseMoveHandler.current = null;
    }
    if (mouseUpHandler.current) {
      document.removeEventListener('mouseup', mouseUpHandler.current);
      mouseUpHandler.current = null;
    }
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const handleMouseDown = useCallback(() => {
    if (isMobileLayout) return;
    isDragging.current = true;
    mouseMoveHandler.current = handleMouseMove;
    mouseUpHandler.current = handleMouseUp;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove, handleMouseUp, isMobileLayout]);

  useEffect(() => {
    return () => {
      if (mouseMoveHandler.current) {
        document.removeEventListener('mousemove', mouseMoveHandler.current);
      }
      if (mouseUpHandler.current) {
        document.removeEventListener('mouseup', mouseUpHandler.current);
      }
    };
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
    <div className="assignment-page fade-in">
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

      <div className={`workspace-layout ${isMobileLayout ? 'mobile' : ''}`}>
        <div
          className="workspace-left"
          style={{ width: isMobileLayout ? '100%' : `${leftWidth}%` }}
        >
          <div className="assignment-description">
            <ReactMarkdown>{currentAssignment.description}</ReactMarkdown>
          </div>
        </div>

        {!isMobileLayout && (
          <div
            ref={dividerRef}
            className="workspace-divider"
            onMouseDown={handleMouseDown}
          />
        )}

        <div
          className="workspace-right"
          style={{ width: isMobileLayout ? '100%' : `${100 - leftWidth}%` }}
        >
          <Suspense fallback={<Loading />}>
            <CodeEditor
              initialCode={currentAssignment.templateCode}
              language={language}
              onChange={handleCodeChange}
              lintIssues={evaluationResult?.lintIssues ?? []}
            />
          </Suspense>

          {evaluationResult && !showReport && (
            <div className="workspace-results">
              <div className="results-toggle">
                <button className="toggle-active">测试结果</button>
                <button onClick={() => setShowReport(true)}>查看报告</button>
              </div>
              <Suspense fallback={<Loading />}>
                <TestResultPanel
                  results={evaluationResult.testResults}
                  lintIssues={evaluationResult.lintIssues}
                />
              </Suspense>
            </div>
          )}

          {evaluationResult && showReport && (
            <div className="workspace-results">
              <div className="results-toggle">
                <button onClick={() => setShowReport(false)}>测试结果</button>
                <button className="toggle-active">查看报告</button>
              </div>
              <Suspense fallback={<Loading />}>
                <ReportPreview
                  evaluationResult={evaluationResult}
                  assignmentTitle={currentAssignment.title}
                />
              </Suspense>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
