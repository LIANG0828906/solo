import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenTool, AlertTriangle, CheckCircle, XCircle, RotateCcw, X, Stamp } from 'lucide-react';
import { useStore } from '@/store';
import { validateJudgementFormat, extractSentence } from '@/utils/judgementValidator';
import type { ValidateResponse, SubmitResponse } from '@/types';

export const SealAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="seal-stamp relative"
      >
        <div className="w-48 h-48 rounded-full border-4 border-red-700 bg-red-800/90 flex items-center justify-center shadow-2xl">
          <div className="text-center">
            <p className="text-yellow-200 text-xs mb-1">江南蘇州府</p>
            <p className="text-yellow-100 text-lg font-bold tracking-widest">吳江縣印</p>
            <p className="text-yellow-200 text-xs mt-1">光緒年造</p>
          </div>
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.5, 1], opacity: [0, 0.8, 0.4] }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="absolute inset-0 rounded-full bg-red-500"
          style={{ mixBlendMode: 'screen' }}
        />
      </motion.div>
    </div>
  );
};

export const RollingAnimation: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="text-center">
        <p className="text-red-500 text-lg mb-8 animate-pulse">
          冤——抑——！
        </p>
        
        <div className="relative w-96 h-32 overflow-hidden">
          <div 
            className="absolute bottom-0 left-0 right-0 h-16 rounded-lg"
            style={{
              background: 'linear-gradient(to bottom, #8b5e3c, #5d3a1a)',
              boxShadow: 'inset 0 -5px 10px rgba(0,0,0,0.5)',
            }}
          >
            <div className="absolute inset-0 flex justify-around items-start pt-1">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1"
                  style={{
                    height: '20px',
                    background: `linear-gradient(to bottom, ${i % 2 === 0 ? '#c0c0c0' : '#a0a0a0'}, #808080)`,
                    clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                  }}
                />
              ))}
            </div>
          </div>

          <motion.div
            className="absolute bottom-16"
            style={{ left: '-60px' }}
            animate={{
              x: ['0px', '450px'],
              rotate: ['0deg', '720deg'],
            }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          >
            <div className="w-14 h-20 bg-amber-700 rounded-full relative">
              <div className="absolute top-2 left-2 w-4 h-4 bg-black rounded-full" />
              <div className="absolute top-2 right-2 w-4 h-4 bg-black rounded-full" />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-2 bg-red-600 rounded-full" />
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">😵</div>
            </div>
          </motion.div>
        </div>

        <p className="text-gray-400 text-sm mt-4">
          被告家屬滾釘板喊冤...
        </p>
      </div>
    </div>
  );
};

export const AppealModal: React.FC = () => {
  const { showAppealModal, appealCaseId, setShowAppealModal, updateCaseStatus, addScore, setCurrentCase } = useStore();
  const [riskWarning, setRiskWarning] = useState(false);

  const handleRetrial = () => {
    if (appealCaseId) {
      updateCaseStatus(appealCaseId, 'review', true);
      setShowAppealModal(false);
      setCurrentCase(null);
    }
  };

  const handleMaintain = () => {
    if (appealCaseId) {
      updateCaseStatus(appealCaseId, 'closed');
      setRiskWarning(true);
      addScore(-10);
      setTimeout(() => {
        setShowAppealModal(false);
        setRiskWarning(false);
        setCurrentCase(null);
      }, 3000);
    }
  };

  return (
    <AnimatePresence>
      {showAppealModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 20 }}
            className="antique-card p-6 max-w-md w-full mx-4"
          >
            {riskWarning ? (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/50 flex items-center justify-center">
                  <AlertTriangle className="text-red-500" size={32} />
                </div>
                <h3 className="text-red-500 text-xl font-bold mb-2">
                  三年後翻案風險 +50%
                </h3>
                <p className="text-gray-400 text-sm">
                  冤案已成，他日翻案，大人您的仕途恐怕會受到牽連...
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-amber-500" size={20} />
                  </div>
                  <div>
                    <h3 className="text-amber-200 text-lg font-bold">
                      幕友大人，您是否同意發回重審？
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      被告家屬滾釘板喊冤，案情確有疑點。若堅持原判，恐有日後翻案之虞。
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleRetrial}
                    className="flex-1 antique-btn"
                  >
                    發回重審
                  </button>
                  <button
                    onClick={handleMaintain}
                    className="flex-1 antique-btn antique-btn-primary"
                  >
                    維持原判
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

interface ScoreBadgeProps {
  score: number;
  comment: string;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, comment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="antique-card p-4 mb-4"
    >
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
          score >= 80 ? 'bg-green-900/50' : score >= 60 ? 'bg-yellow-900/50' : 'bg-red-900/50'
        }`}>
          <span className={`text-2xl font-bold ${
            score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {score}
          </span>
        </div>
        <div>
          <p className="text-amber-200 font-bold text-lg">{comment}</p>
          <p className="text-gray-400 text-sm">考成分數：{score} 分</p>
        </div>
      </div>
    </motion.div>
  );
};

export const AchievementBadge: React.FC = () => {
  const { unlockedBadges } = useStore();
  const hasMasterBadge = unlockedBadges.includes('刑名师爷');

  if (!hasMasterBadge) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="antique-card p-4 mb-4 text-center"
    >
      <p className="text-amber-400 text-sm mb-2">🎉 解鎖成就</p>
      <div className="badge-metal w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-2">
        <span className="text-3xl">🦄</span>
      </div>
      <p className="text-amber-200 font-bold">刑名師爺</p>
      <p className="text-gray-500 text-xs">累計考成分數達到 100 分</p>
    </motion.div>
  );
};

export const JudgementPanel: React.FC = () => {
  const { 
    currentCase, 
    citedLaws, 
    judgementDraft, 
    setJudgementDraft,
    showSealAnimation,
    showRollingAnimation,
    setShowSealAnimation,
    setShowRollingAnimation,
    setShowAppealModal,
    addScore,
    updateCaseStatus,
    clearCitedLaws,
    userScore,
  } = useStore();

  const [validation, setValidation] = useState<ValidateResponse | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validate = useCallback(async () => {
    if (!currentCase || !judgementDraft.trim()) return;
    
    setIsValidating(true);
    try {
      const startTime = performance.now();
      const response = await fetch('/api/judgement/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judgementText: judgementDraft,
          caseId: currentCase.id,
          citedLaws: citedLaws.map(l => l.id),
        }),
      });
      const result = await response.json();
      setValidation(result);
      const endTime = performance.now();
      console.log(`判詞校驗響應時間: ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      const clientValidation = validateJudgementFormat(judgementDraft);
      setValidation(clientValidation);
    } finally {
      setIsValidating(false);
    }
  }, [currentCase, judgementDraft, citedLaws]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (judgementDraft.trim()) {
        validate();
      } else {
        setValidation(null);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [judgementDraft, validate]);

  const handleSubmit = async () => {
    if (!currentCase || !validation?.valid) return;

    const selectedWitnesses = currentCase.witnesses.filter(w => w.selected).map(w => w.id);
    const selectedEvidences = currentCase.evidences.filter(e => e.selected).map(e => e.id);
    const sentence = extractSentence(judgementDraft);

    try {
      setShowSealAnimation(true);
      
      setTimeout(async () => {
        const response = await fetch('/api/judgement/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId: currentCase.id,
            judgementText: judgementDraft,
            citedLaws: citedLaws.map(l => l.id),
            selectedWitnesses,
            selectedEvidences,
            sentence,
          }),
        });
        const result = await response.json();
        setSubmitResult(result);
        addScore(result.score);

        if (result.triggerAppeal) {
          setTimeout(() => {
            setShowSealAnimation(false);
            setShowRollingAnimation(true);
          }, 500);
        } else {
          setTimeout(() => {
            setShowSealAnimation(false);
            updateCaseStatus(currentCase.id, 'closed');
          }, 500);
        }
      }, 1000);
    } catch (error) {
      console.error('提交判決失敗:', error);
      setShowSealAnimation(false);
    }
  };

  const handleRollingComplete = () => {
    setShowRollingAnimation(false);
    setShowAppealModal(true, currentCase?.id);
  };

  const handleSealComplete = () => {
  };

  const handleReset = () => {
    setJudgementDraft('');
    setValidation(null);
    setSubmitResult(null);
    clearCitedLaws();
  };

  const fillTemplate = () => {
    if (!currentCase) return;
    const defendant = currentCase.caseType === 'homicide' ? '張三' : 
                      currentCase.caseType === 'land' ? '李大貴' : '張氏';
    const template = `${defendant}犯法難逃刑，
依律審判順民情。
證據確鑿難狡辯，
杖八十徒兩年刑。`;
    setJudgementDraft(template);
  };

  if (!currentCase) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <PenTool size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">請先選擇案卷</p>
          <p className="text-sm mt-2">方可書寫判詞</p>
        </div>
      </div>
    );
  }

  if (submitResult && !showSealAnimation && !showRollingAnimation && !useStore.getState().showAppealModal) {
    return (
      <div className="h-full overflow-y-auto p-2">
        <ScoreBadge score={submitResult.score} comment={submitResult.comment} />
        <AchievementBadge />
        
        <div className="antique-card p-4 mb-4">
          <h3 className="text-amber-400 text-sm mb-3">判詞原文</h3>
          <div className="judgement-panel p-4 kai-font">
            <div className="vertical-text h-48 text-lg leading-loose whitespace-pre-wrap">
              {judgementDraft}
            </div>
          </div>
        </div>

        {submitResult.riskPercent > 10 && (
          <div className="antique-card p-4 border-l-4 border-red-700">
            <p className="text-red-400 text-sm">
              ⚠️ 翻案風險：{submitResult.riskPercent}%
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={handleReset} className="flex-1 antique-btn">
            <RotateCcw size={14} className="inline mr-2" />
            繼續審案
          </button>
        </div>

        <div className="mt-4 text-center text-sm text-gray-500">
          累計考成分數：<span className="text-amber-400 font-bold">{userScore}</span> 分
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {showSealAnimation && <SealAnimation onComplete={handleSealComplete} />}
      </AnimatePresence>
      <AnimatePresence>
        {showRollingAnimation && <RollingAnimation onComplete={handleRollingComplete} />}
      </AnimatePresence>
      <AppealModal />

      <div className="h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-amber-900">
          <PenTool className="text-amber-500" size={20} />
          <h2 className="text-lg font-bold text-amber-200">判詞擬稿</h2>
          <div className="ml-auto text-xs text-gray-500">
            考成分數：<span className="text-amber-400">{userScore}</span>
          </div>
        </div>

        {citedLaws.length > 0 && (
          <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800 rounded">
            <p className="text-xs text-amber-400 mb-2">已援引律例：</p>
            <div className="flex flex-wrap gap-1">
              {citedLaws.map((law, idx) => (
                <span key={law.id} className="text-[10px] bg-amber-800/50 text-amber-300 px-2 py-1 rounded">
                  {idx + 1}. {law.title}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 mb-4">
          <div className="judgement-panel p-4 h-full">
            <textarea
              value={judgementDraft}
              onChange={(e) => setJudgementDraft(e.target.value)}
              placeholder="請輸入七言律詩格式判詞，每句七字，共四句...

例如：
張三毆人致重傷，
依律問擬不容寬。
證據確鑿難抵賴，
杖八十徒兩年間。"
              className="w-full h-full bg-transparent resize-none outline-none kai-font text-lg leading-loose placeholder:text-gray-400 placeholder:leading-normal"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            />
          </div>
        </div>

        {validation && (
          <div className={`mb-4 p-3 rounded border ${
            validation.valid 
              ? 'bg-green-900/20 border-green-700' 
              : 'bg-red-900/20 border-red-700'
          }`}>
            {validation.valid ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm">判詞格式正確</span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle size={16} />
                  <span className="text-sm">判詞有誤</span>
                </div>
                {validation.errors.map((err, idx) => (
                  <p key={idx} className="text-xs text-red-400 ml-6">• {err}</p>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2 text-yellow-400">
                  <AlertTriangle size={16} />
                  <span className="text-sm">注意事項</span>
                </div>
                {validation.warnings.map((warn, idx) => (
                  <p key={idx} className="text-xs text-yellow-400 ml-6">• {warn}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={fillTemplate}
            className="antique-btn text-xs"
          >
            <Stamp size={12} className="inline mr-1" />
            填入模板
          </button>
          <button
            onClick={handleReset}
            className="antique-btn text-xs"
          >
            <X size={12} className="inline mr-1" />
            清空
          </button>
          <button
            onClick={handleSubmit}
            disabled={!validation?.valid || isValidating}
            className={`flex-1 antique-btn antique-btn-primary ${
              !validation?.valid || isValidating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Stamp size={14} className="inline mr-2" />
            畫押
          </button>
        </div>
      </div>
    </>
  );
};
