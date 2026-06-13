import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import { GradingResult, ScoreResult } from './types';

interface ScoreDashboardProps {
  gradingResult: GradingResult;
}

const ScoreDashboard: React.FC<ScoreDashboardProps> = ({ gradingResult }) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});
  const animationRefs = useRef<Record<string, number>>({});

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return 'green';
    if (percentage >= 60) return 'orange';
    return 'red';
  };

  useEffect(() => {
    gradingResult.results.forEach((result, index) => {
      setTimeout(() => {
        animateScore(result.ruleId, result.score, result.maxScore);
      }, index * 100);
    });
  }, [gradingResult]);

  const animateScore = (ruleId: string, targetScore: number, maxScore: number) => {
    const duration = 1000;
    const startTime = performance.now();
    const startScore = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentScore = Math.round(startScore + (targetScore - startScore) * easeProgress);

      setAnimatedScores(prev => ({ ...prev, [ruleId]: currentScore }));

      if (progress < 1) {
        animationRefs.current[ruleId] = requestAnimationFrame(animate);
      }
    };

    if (animationRefs.current[ruleId]) {
      cancelAnimationFrame(animationRefs.current[ruleId]);
    }
    animationRefs.current[ruleId] = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return () => {
      Object.values(animationRefs.current).forEach(id => cancelAnimationFrame(id));
    };
  }, []);

  const toggleCard = (ruleId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(ruleId)) {
        next.delete(ruleId);
      } else {
        next.add(ruleId);
      }
      return next;
    });
  };

  const highlightText = (text: string, pattern: string): React.ReactNode => {
    try {
      const regex = new RegExp(`(${pattern})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, index) => 
        regex.test(part) ? <span key={index} className="highlight">{part}</span> : part
      );
    } catch {
      return text;
    }
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.text('AutoLab 评分报告', 20, 25);
      
      doc.setFontSize(12);
      doc.text(`文件名: ${gradingResult.filename}`, 20, 40);
      doc.text(`评分时间: ${new Date(gradingResult.timestamp).toLocaleString()}`, 20, 50);
      doc.text(`总分: ${gradingResult.totalScore} / ${gradingResult.maxScore} (${gradingResult.percentage}%)`, 20, 60);

      let yPos = 80;
      doc.setFontSize(14);
      doc.text('详细评分:', 20, yPos);
      yPos += 10;

      gradingResult.results.forEach((result, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(11);
        doc.text(`${index + 1}. ${result.ruleName}: ${result.score}/${result.maxScore} ${result.passed ? '✓' : '✗'}`, 25, yPos);
        yPos += 7;

        if (result.suggestion) {
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`建议: ${result.suggestion}`, 30, yPos);
          doc.setTextColor(0, 0, 0);
          yPos += 7;
        }
        yPos += 3;
      });

      const passedCount = gradingResult.results.filter(r => r.passed).length;
      const failedCount = gradingResult.results.filter(r => !r.passed).length;
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.text(`统计: 通过 ${passedCount} 项, 未通过 ${failedCount} 项`, 20, yPos);

      doc.save(`评分报告_${gradingResult.filename.replace(/\.[^/.]+$/, '')}.pdf`);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const passedCount = gradingResult.results.filter(r => r.passed).length;
  const failedCount = gradingResult.results.filter(r => !r.passed).length;
  const circumference = 2 * Math.PI * 65;
  const offset = circumference - (gradingResult.percentage / 100) * circumference;
  const scoreColor = getScoreColor(gradingResult.percentage);

  return (
    <div>
      <div className="score-summary">
        <div className="score-circle-container">
          <svg className="score-circle" viewBox="0 0 140 140">
            <circle className="score-circle-bg" cx="70" cy="70" r="65" />
            <circle
              className={`score-circle-progress ${scoreColor}`}
              cx="70"
              cy="70"
              r="65"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="score-text">
            <div className="score-number">{gradingResult.percentage}%</div>
            <div className="score-label">综合评分</div>
          </div>
        </div>
        <div className="score-info">
          <h2>{gradingResult.filename}</h2>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>
            {new Date(gradingResult.timestamp).toLocaleString('zh-CN')}
          </div>
          <div className="score-stats">
            <div className="score-stat">
              <div className="score-stat-value">{gradingResult.totalScore}</div>
              <div className="score-stat-label">实际得分</div>
            </div>
            <div className="score-stat">
              <div className="score-stat-value">{gradingResult.maxScore}</div>
              <div className="score-stat-label">满分</div>
            </div>
            <div className="score-stat">
              <div className="score-stat-value">{passedCount}</div>
              <div className="score-stat-label">通过规则</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ marginTop: '24px' }}>
        {gradingResult.results.map((result: ScoreResult, index: number) => {
          const isExpanded = expandedCards.has(result.ruleId);
          const animatedScore = animatedScores[result.ruleId] ?? 0;
          const scorePercentage = (result.score / result.maxScore) * 100;

          return (
            <div
              key={result.ruleId}
              className={`card rule-card ${result.passed ? '' : 'failed'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => toggleCard(result.ruleId)}
            >
              <div className="rule-card-header">
                <div className="rule-name">{result.ruleName}</div>
                <div className={`rule-score ${result.passed ? 'passed' : 'failed'}`}>
                  {animatedScore}/{result.maxScore}
                </div>
              </div>
              <div className="rule-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${scorePercentage}%`,
                      background: result.passed 
                        ? 'linear-gradient(90deg, #4ecdc4, #44a08d)' 
                        : 'linear-gradient(90deg, #ff6b6b, #ee5a5a)'
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                {result.passed ? '✓ 通过' : '✗ 未通过'}
              </div>

              {isExpanded && (
                <div className="rule-expand">
                  {result.matchedTexts.length > 0 && (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                        匹配的文本片段:
                      </div>
                      {result.matchedTexts.map((text, idx) => (
                        <div key={idx} className="matched-text">
                          {highlightText(text, result.ruleName)}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {result.suggestion && (
                    <div className="suggestion-box">
                      <div className="suggestion-label">💡 修改建议</div>
                      <div>{result.suggestion}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="dashboard-footer">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-dot passed" />
            <span>通过 {passedCount} 项</span>
          </div>
          <div className="stat-item">
            <span className="stat-dot failed" />
            <span>未通过 {failedCount} 项</span>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={exportToPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <div className="loading-spinner" />
              导出中...
            </>
          ) : (
            '📥 导出PDF报告'
          )}
        </button>
      </div>
    </div>
  );
};

export default ScoreDashboard;
