import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import StepPanel from './components/StepPanel';
import CoinResult from './components/CoinResult';
import { PATTERNS, STEPS, CoinPattern, CoinData, CastingRecord } from './types';

const App = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false, false]);
  const [selectedPattern, setSelectedPattern] = useState<CoinPattern | null>(null);
  const [coinData, setCoinData] = useState<CoinData[]>([]);
  const [castingRecord, setCastingRecord] = useState<CastingRecord | null>(null);
  const [finalImageData, setFinalImageData] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  
  const polishStartTimeRef = useRef<number>(0);
  const polishEndTimeRef = useRef<number>(0);

  const handleStepComplete = useCallback((stepIndex: number, data?: unknown) => {
    const newCompleted = [...completedSteps];
    newCompleted[stepIndex] = true;
    setCompletedSteps(newCompleted);

    if (stepIndex === 0 && data) {
      setSelectedPattern(data as CoinPattern);
    }

    if (stepIndex === 3) {
      polishEndTimeRef.current = Date.now();
    }

    if (stepIndex === 4 && data) {
      setCoinData(data as CoinData[]);
      const patternInfo = PATTERNS.find(p => p.id === selectedPattern)!;
      const polishDuration = (polishEndTimeRef.current - polishStartTimeRef.current) / 1000;
      
      const record: CastingRecord = {
        pattern: selectedPattern!,
        patternName: patternInfo.name,
        polishDuration,
        coinCount: 5,
        timestamp: Date.now()
      };
      setCastingRecord(record);
      setIsComplete(true);
    }

    if (stepIndex < 4) {
      setTimeout(() => {
        setActiveStep(stepIndex + 1);
        if (stepIndex + 1 === 3) {
          polishStartTimeRef.current = Date.now();
        }
      }, 500);
    }
  }, [completedSteps, selectedPattern]);

  const handleRestart = () => {
    setActiveStep(0);
    setCompletedSteps([false, false, false, false, false]);
    setSelectedPattern(null);
    setCoinData([]);
    setCastingRecord(null);
    setFinalImageData('');
    setIsComplete(false);
  };

  const handleImageGenerated = (dataUrl: string) => {
    setFinalImageData(dataUrl);
  };

  const getPatternName = () => {
    const pattern = PATTERNS.find(p => p.id === selectedPattern);
    return pattern ? pattern.name : '';
  };

  const generateCastingText = () => {
    if (!castingRecord) return '';
    return `你选用${castingRecord.patternName}纹样，铜液灌注后冷却成型，打磨了${castingRecord.polishDuration.toFixed(1)}秒，穿绳${castingRecord.coinCount}枚。每一枚铜钱都承载着匠人的心血，铜绿斑驳间见证着岁月的流转。`;
  };

  const generateCoinData = () => {
    return Array.from({ length: 5 }, () => ({
      id: uuidv4(),
      pattern: selectedPattern!,
      wearLevel: 0.1 + Math.random() * 0.3,
      patinaLevel: 0.2 + Math.random() * 0.4,
      rotation: Math.random() * 10 - 5
    }));
  };

  return (
    <div className="app-container">
      <div className="oil-lamp-glow" />
      <div className="oil-lamp">
        <div className="flame" />
        <div className="lamp-base" />
      </div>

      <div className="progress-container">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`progress-segment ${completedSteps[index] ? 'completed' : ''} ${activeStep === index ? 'current' : ''}`}
          />
        ))}
      </div>

      <div className="progress-labels">
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`progress-label ${activeStep >= index ? 'active' : ''}`}
          >
            {step.name}
          </div>
        ))}
      </div>

      <div className="workbench">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="step-transition"
          >
            <h2 className="step-title">{STEPS[activeStep].title}</h2>
            <StepPanel
              activeStep={activeStep}
              onStepComplete={handleStepComplete}
              completedSteps={completedSteps}
              selectedPattern={selectedPattern}
              generateCoinData={generateCoinData}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {isComplete && (
        <CoinResult
          coinData={coinData}
          patternName={getPatternName()}
          castingText={generateCastingText()}
          onImageGenerated={handleImageGenerated}
          onRestart={handleRestart}
          finalImageData={finalImageData}
        />
      )}

      {!isComplete && activeStep < 4 && (
        <div className="button-group">
          <button
            className="btn-coin"
            disabled={!completedSteps[activeStep]}
            onClick={() => handleStepComplete(activeStep)}
          >
            下一步
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
