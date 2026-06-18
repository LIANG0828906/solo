import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaCog,
  FaPlay,
  FaRandom,
  FaSync,
  FaCrown,
  FaMedal,
  FaCircle,
  FaInfoCircle,
  FaTimes,
  FaExchangeAlt,
  FaArrowRight,
} from 'react-icons/fa';
import { algorithms, SortStep, SortGenerator, getAlgorithmById } from './algorithms';
import Visualizer from './visualizer';

type Grade = 'A' | 'B' | 'C' | 'D';

interface ResultData {
  algorithmName: string;
  totalTime: number;
  comparisons: number;
  swaps: number;
  grade: Grade;
}

const GRADE_ICONS: Record<Grade, React.ReactNode> = {
  A: <FaCrown style={{ color: '#FFD700' }} />,
  B: <FaMedal style={{ color: '#C0C0C0' }} />,
  C: <FaCircle style={{ color: '#CD7F32' }} />,
  D: <FaInfoCircle style={{ color: '#95A5A6' }} />,
};

const GRADE_COLORS: Record<Grade, string> = {
  A: '#FFD700',
  B: '#C0C0C0',
  C: '#CD7F32',
  D: '#95A5A6',
};

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateRandomArray(length: number, min: number, max: number, seed: number): number[] {
  const rand = seededRandom(seed);
  return Array.from({ length }, () => Math.floor(rand() * (max - min + 1)) + min);
}

function calculateGrade(totalSteps: number, arrayLength: number): Grade {
  const n = arrayLength;
  const bestCase = n - 1;
  const avgCase = (n * (n - 1)) / 4;
  const worstCase = (n * (n - 1)) / 2;

  if (totalSteps <= bestCase * 2) return 'A';
  if (totalSteps <= avgCase * 1.2) return 'B';
  if (totalSteps <= worstCase * 0.8) return 'C';
  return 'D';
}

function countTotalSteps(generatorFn: (arr: number[]) => SortGenerator, arr: number[]): number {
  const gen = generatorFn(arr);
  let count = 0;
  while (!gen.next().done) {
    count++;
  }
  return count;
}

const SortVisualizer: React.FC = () => {
  const [array, setArray] = useState<number[]>([]);
  const [arrayLength, setArrayLength] = useState(20);
  const [seed, setSeed] = useState(Date.now());
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [selectedAlgorithm1, setSelectedAlgorithm1] = useState('bubble');
  const [selectedAlgorithm2, setSelectedAlgorithm2] = useState('quick');
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [results, setResults] = useState<ResultData[]>([]);
  const [splitRatio, setSplitRatio] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [step1, setStep1] = useState<SortStep | null>(null);
  const [step2, setStep2] = useState<SortStep | null>(null);
  const [currentStep1, setCurrentStep1] = useState(0);
  const [currentStep2, setCurrentStep2] = useState(0);
  const [totalSteps1, setTotalSteps1] = useState(0);
  const [totalSteps2, setTotalSteps2] = useState(0);

  const gen1Ref = useRef<SortGenerator | null>(null);
  const gen2Ref = useRef<SortGenerator | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const initialStep: SortStep = useMemo(
    () => ({
      array: array,
      comparing: [],
      swapping: [],
      sorted: [],
      comparisons: 0,
      swaps: 0,
    }),
    [array]
  );

  const stepInterval = useMemo(() => {
    if (animationSpeed === 0.5) return 400;
    if (animationSpeed === 2) return 100;
    return 200;
  }, [animationSpeed]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const newArray = generateRandomArray(arrayLength, 1, 100, seed);
    setArray(newArray);
    setIsRunning(false);
    setShowResult(false);
    setResults([]);
    setCurrentStep1(0);
    setCurrentStep2(0);
    const initStep: SortStep = {
      array: newArray,
      comparing: [],
      swapping: [],
      sorted: [],
      comparisons: 0,
      swaps: 0,
    };
    setStep1(initStep);
    setStep2(initStep);
  }, [arrayLength, seed]);

  useEffect(() => {
    const alg1 = getAlgorithmById(selectedAlgorithm1);
    const alg2 = getAlgorithmById(selectedAlgorithm2);
    if (alg1 && array.length > 0) {
      setTotalSteps1(countTotalSteps(alg1.fn, array));
      setStep1({ ...initialStep });
      setCurrentStep1(0);
    }
    if (alg2 && array.length > 0) {
      setTotalSteps2(countTotalSteps(alg2.fn, array));
      setStep2({ ...initialStep });
      setCurrentStep2(0);
    }
  }, [array, selectedAlgorithm1, selectedAlgorithm2, initialStep]);

  const handleGenerate = useCallback(() => {
    setSeed(Date.now());
  }, []);

  const handleRandomSeed = () => {
    setSeed(Date.now());
  };

  const startSorting = useCallback(() => {
    if (isRunning) return;

    const alg1 = getAlgorithmById(selectedAlgorithm1);
    if (!alg1) return;

    setIsRunning(true);
    setShowResult(false);
    setResults([]);
    startTimeRef.current = performance.now();

    gen1Ref.current = alg1.fn(array);
    setCurrentStep1(0);
    setStep1({ ...initialStep });

    if (isCompareMode) {
      const alg2 = getAlgorithmById(selectedAlgorithm2);
      if (alg2) {
        gen2Ref.current = alg2.fn(array);
        setCurrentStep2(0);
        setStep2({ ...initialStep });
      }
    }

    lastStepTimeRef.current = performance.now();
  }, [isRunning, selectedAlgorithm1, selectedAlgorithm2, array, isCompareMode, initialStep]);

  const stopSorting = useCallback(() => {
    setIsRunning(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const resetSorting = useCallback(() => {
    stopSorting();
    setCurrentStep1(0);
    setCurrentStep2(0);
    setStep1({ ...initialStep });
    setStep2({ ...initialStep });
    setShowResult(false);
    setResults([]);
  }, [stopSorting, initialStep]);

  useEffect(() => {
    if (!isRunning) return;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastStepTimeRef.current;

      if (elapsed >= stepInterval) {
        lastStepTimeRef.current = timestamp;

        let done1 = false;
        let done2 = false;

        if (gen1Ref.current) {
          const result = gen1Ref.current.next();
          if (result.done) {
            done1 = true;
          } else {
            setStep1(result.value);
            setCurrentStep1((prev) => prev + 1);
          }
        }

        if (isCompareMode && gen2Ref.current) {
          const result = gen2Ref.current.next();
          if (result.done) {
            done2 = true;
          } else {
            setStep2(result.value);
            setCurrentStep2((prev) => prev + 1);
          }
        }

        if (isCompareMode ? done1 && done2 : done1) {
          setIsRunning(false);
          const totalTime = performance.now() - startTimeRef.current;

          const newResults: ResultData[] = [];
          const alg1 = getAlgorithmById(selectedAlgorithm1);
          if (alg1 && step1) {
            newResults.push({
              algorithmName: alg1.name,
              totalTime: Math.round(totalTime),
              comparisons: step1.comparisons,
              swaps: step1.swaps,
              grade: calculateGrade(totalSteps1, array.length),
            });
          }
          if (isCompareMode) {
            const alg2 = getAlgorithmById(selectedAlgorithm2);
            if (alg2 && step2) {
              newResults.push({
                algorithmName: alg2.name,
                totalTime: Math.round(totalTime),
                comparisons: step2.comparisons,
                swaps: step2.swaps,
                grade: calculateGrade(totalSteps2, array.length),
              });
            }
          }
          setResults(newResults);
          setShowResult(true);
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRunning, stepInterval, isCompareMode, selectedAlgorithm1, selectedAlgorithm2, step1, step2, totalSteps1, totalSteps2, array.length]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitRatio(Math.min(Math.max(ratio, 20), 80));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      <div
        style={{
          backgroundColor: '#2A2A3E',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaRandom style={{ color: '#3498DB' }} />
          <span style={{ fontSize: '14px' }}>数组长度：{arrayLength}</span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleGenerate}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3498DB',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2980B9')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3498DB')}
          >
            <FaSync /> 重新生成
          </button>
          <button
            onClick={handleRandomSeed}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2ECC71',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27AE60')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ECC71')}
          >
            <FaRandom /> 随机种子
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}>
          <button
            onClick={() => setIsCompareMode(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: !isCompareMode ? '#F39C12' : '#3A3A5E',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
          >
            单算法
          </button>
          <button
            onClick={() => setIsCompareMode(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: isCompareMode ? '#F39C12' : '#3A3A5E',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.2s',
            }}
          >
            <FaExchangeAlt /> 对比模式
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isRunning ? (
            <button
              onClick={startSorting}
              style={{
                padding: '10px 24px',
                backgroundColor: '#2ECC71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#27AE60')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2ECC71')}
            >
              <FaPlay /> {isCompareMode ? '对比执行' : '执行'}
            </button>
          ) : (
            <button
              onClick={stopSorting}
              style={{
                padding: '10px 24px',
                backgroundColor: '#E74C3C',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C0392B')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E74C3C')}
            >
              停止
            </button>
          )}
          <button
            onClick={resetSorting}
            style={{
              padding: '10px 16px',
              backgroundColor: '#3A3A5E',
              color: '#E0E0E0',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A6E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A5E')}
          >
            重置
          </button>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#2A2A3E',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#888' }}>算法1：</label>
          <select
            value={selectedAlgorithm1}
            onChange={(e) => setSelectedAlgorithm1(e.target.value)}
            disabled={isRunning}
            style={{
              padding: '8px 12px',
              backgroundColor: '#1E1E2E',
              color: '#E0E0E0',
              border: '1px solid #3A3A5E',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {algorithms.map((alg) => (
              <option key={alg.id} value={alg.id}>
                {alg.name}
              </option>
            ))}
          </select>
        </div>

        {isCompareMode && (
          <>
            <FaArrowRight style={{ color: '#666' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', color: '#888' }}>算法2：</label>
              <select
                value={selectedAlgorithm2}
                onChange={(e) => setSelectedAlgorithm2(e.target.value)}
                disabled={isRunning}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#1E1E2E',
                  color: '#E0E0E0',
                  border: '1px solid #3A3A5E',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                {algorithms.map((alg) => (
                  <option key={alg.id} value={alg.id}>
                    {alg.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '0',
          height: isMobile ? 'auto' : '500px',
          width: '100%',
        }}
      >
        <div
          style={{
            flex: isCompareMode ? `${splitRatio}%` : '1',
            minWidth: 0,
            height: isMobile ? '400px' : '100%',
          }}
        >
          {step1 && (
            <Visualizer
              step={step1}
              totalSteps={totalSteps1}
              currentStep={currentStep1}
              algorithmName={isCompareMode ? algorithms.find((a) => a.id === selectedAlgorithm1)?.name : undefined}
              height={isMobile ? 400 : 500}
            />
          )}
        </div>

        {isCompareMode && !isMobile && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              width: '4px',
              cursor: 'col-resize',
              backgroundColor: isDragging ? '#3498DB' : '#3A3A5E',
              transition: 'background-color 0.2s',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '2px',
                height: '30px',
                backgroundColor: '#555',
                borderRadius: '1px',
              }}
            />
          </div>
        )}

        {isCompareMode && (
          <div
            style={{
              flex: `${100 - splitRatio}%`,
              minWidth: 0,
              height: isMobile ? '400px' : '100%',
            }}
          >
            {step2 && (
              <Visualizer
                step={step2}
                totalSteps={totalSteps2}
                currentStep={currentStep2}
                algorithmName={algorithms.find((a) => a.id === selectedAlgorithm2)?.name}
                height={isMobile ? 400 : 500}
              />
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 200,
              }}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: isMobile ? '100%' : '360px',
                height: '100%',
                backgroundColor: '#2A2A3E',
                zIndex: 201,
                padding: '24px',
                boxSizing: 'border-box',
                overflowY: 'auto',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontSize: '18px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaCog style={{ color: '#3498DB' }} /> 设置
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#E0E0E0',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>
                  动画速度：{animationSpeed}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.5"
                  value={animationSpeed}
                  onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                  style={{ width: '100%', accentColor: '#3498DB' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <span>0.5x</span>
                  <span>1x</span>
                  <span>2x</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>
                  数组长度：{arrayLength}
                </label>
                <input
                  type="range"
                  min="10"
                  max="50"
                  step="1"
                  value={arrayLength}
                  onChange={(e) => setArrayLength(parseInt(e.target.value))}
                  disabled={isRunning}
                  style={{ width: '100%', accentColor: '#3498DB' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  <span>10</span>
                  <span>50</span>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#888' }}>
                  随机种子：{seed}
                </label>
                <button
                  onClick={handleRandomSeed}
                  disabled={isRunning}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#3A3A5E',
                    color: '#E0E0E0',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4A4A6E')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3A3A5E')}
                >
                  <FaRandom /> 生成新种子
                </button>
              </div>

              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#1E1E2E',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#666',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: '0 0 8px 0', color: '#888', fontWeight: 600 }}>图例说明：</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#3498DB', borderRadius: '2px' }} />
                  <span>默认（蓝到红渐变）</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#F39C12', borderRadius: '2px' }} />
                  <span>正在比较</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#2ECC71', borderRadius: '2px' }} />
                  <span>正在交换</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '16px', height: '16px', backgroundColor: '#95A5A6', borderRadius: '2px' }} />
                  <span>已排序</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResult(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.4)',
                zIndex: 150,
              }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, duration: 0.4 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#2A2A3E',
                borderRadius: '16px 16px 0 0',
                padding: '24px',
                zIndex: 151,
                maxWidth: '800px',
                margin: '0 auto',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <h2 style={{ fontSize: '20px', margin: 0 }}>排序完成！</h2>
                <button
                  onClick={() => setShowResult(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#E0E0E0',
                    fontSize: '18px',
                    cursor: 'pointer',
                    padding: '4px',
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                {results.map((result, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      backgroundColor: '#1E1E2E',
                      borderRadius: '12px',
                      padding: '20px',
                      border: `2px solid ${GRADE_COLORS[result.grade]}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '16px',
                      }}
                    >
                      <span style={{ fontSize: '16px', fontWeight: 600 }}>{result.algorithmName}</span>
                      <div style={{ fontSize: '28px' }}>{GRADE_ICONS[result.grade]}</div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>性能评级</div>
                      <div
                        style={{
                          fontSize: '32px',
                          fontWeight: 700,
                          color: GRADE_COLORS[result.grade],
                        }}
                      >
                        {result.grade}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#888' }}>总耗时</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{result.totalTime}ms</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#888' }}>比较次数</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{result.comparisons}</div>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>交换次数</div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>{result.swaps}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SortVisualizer;
