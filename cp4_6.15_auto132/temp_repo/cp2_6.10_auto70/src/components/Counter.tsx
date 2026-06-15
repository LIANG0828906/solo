import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { usePawnStore } from '../store/pawnStore';
import { getItemIcon } from './ItemIcons';
import { generateRandomGuest, generateRandomItem } from '../utils/mockData';
import { calculateValuation } from '../utils/valuation';
import type { PawnItem, ValuationResult, Material, Era, Condition, Liquidity } from '../types';

const materialLabels: Record<Material, string> = {
  gold: '金',
  silver: '银',
  jade: '玉',
  porcelain: '瓷',
  wood: '木'
};

const eraLabels: Record<Era, string> = {
  song: '宋',
  ming: '明',
  qing: '清'
};

const conditionLabels: Record<Condition, string> = {
  excellent: '上品',
  good: '中品',
  poor: '下品'
};

const liquidityLabels: Record<Liquidity, string> = {
  high: '好',
  medium: '中',
  low: '差'
};

const guestTypeLabels: Record<string, string> = {
  scholar: '穷书生',
  noble: '八旗子弟',
  peddler: '走街货郎'
};

const Counter: React.FC = () => {
  const { 
    currentItem, 
    currentStep, 
    balance,
    setCurrentItem, 
    setCurrentStep, 
    addPawn 
  } = usePawnStore();
  
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const [showTicket, setShowTicket] = useState(false);
  const [magnifierPos, setMagnifierPos] = useState({ x: 50, y: 50 });
  const [isMagnifying, setIsMagnifying] = useState(false);
  const [abacusBeads, setAbacusBeads] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!currentItem) {
      generateNewGuest();
    }
  }, []);

  const playClickSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800 + Math.random() * 400;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, []);

  const generateNewGuest = () => {
    const guest = generateRandomGuest();
    const item = generateRandomItem();
    const now = new Date();
    const expireDate = new Date(now);
    expireDate.setMonth(expireDate.getMonth() + 6);

    const newItem: PawnItem = {
      id: uuidv4(),
      guestName: guest.name,
      guestType: guest.type,
      ...item,
      pawnDate: now.toISOString(),
      expireDate: expireDate.toISOString(),
      status: 'active',
      monthlyInterest: 0.02,
      pawnTermMonths: 6
    };

    setCurrentItem(newItem);
    setValuationResult(null);
    setShowTicket(false);
    setAbacusBeads([0, 0, 0, 0, 0, 0, 0]);
  };

  const handleWeigh = () => {
    if (currentStep !== 'idle') return;
    setCurrentStep('weighing');
    
    setTimeout(() => {
      playClickSound();
      setCurrentStep('examining');
    }, 1500);
  };

  const handleExamine = () => {
    if (currentStep !== 'examining') return;
    setIsMagnifying(true);
    
    setTimeout(() => {
      setIsMagnifying(false);
      setCurrentStep('calculating');
    }, 2000);
  };

  const handleCalculate = () => {
    if (currentStep !== 'calculating' || !currentItem) return;
    
    let beadIndex = 0;
    const interval = setInterval(() => {
      if (beadIndex < abacusBeads.length) {
        setAbacusBeads(prev => {
          const newBeads = [...prev];
          newBeads[beadIndex] = 1;
          return newBeads;
        });
        playClickSound();
        beadIndex++;
      } else {
        clearInterval(interval);
        
        const valuation = calculateValuation({
          material: currentItem.material,
          era: currentItem.era,
          condition: currentItem.condition,
          liquidity: currentItem.liquidity,
          weight: currentItem.weight
        });
        
        setValuationResult(valuation);
        setCurrentStep('complete');
      }
    }, 300);
  };

  const handleAgree = () => {
    if (!currentItem || !valuationResult) return;
    
    const finalItem: PawnItem = {
      ...currentItem,
      pawnAmount: valuationResult.pawnAmount,
      originalValue: valuationResult.baseValue
    };
    
    addPawn(finalItem);
    setShowTicket(true);
    
    setTimeout(() => {
      setShowTicket(false);
      generateNewGuest();
    }, 3000);
  };

  const handleReject = () => {
    generateNewGuest();
  };

  const handleMagnifierMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMagnifying) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMagnifierPos({ x, y });
  };

  if (!currentItem) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-[#f5e6c8] text-xl">等待客人上门...</p>
      </div>
    );
  }

  const ItemIcon = getItemIcon(currentItem.itemType);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative bg-[#2a1f18] overflow-hidden">
        <div 
          className="absolute top-8 right-16 w-16 h-20 lamp-glow"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,200,100,0.8) 0%, rgba(255,150,50,0.4) 40%, transparent 70%)',
            borderRadius: '50% 50% 20% 20%'
          }}
        >
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-12 bg-gradient-to-b from-[#d4af37] to-[#8b6914] rounded-t-lg" />
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#fff5e0] rounded-full opacity-80 animate-pulse" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1/2">
          <div 
            className="w-full h-full"
            style={{
              background: `repeating-linear-gradient(90deg, #6b4226 0px, #5a3a20 2px, #6b4226 4px, #7a4a2e 6px, #6b4226 8px)`,
              borderTop: '4px solid #4a2a10'
            }}
          >
            <div className="absolute top-4 left-8 w-32 h-48 bg-[#f5e6c8] rounded shadow-lg transform -rotate-3 border border-[#8b5e3c]">
              <div className="p-2 text-xs text-[#2a1f18]">
                <div className="text-center font-bold mb-1">流水账</div>
                <div className="border-t border-[#8b5e3c] my-1" />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>端砚</span>
                    <span>八两</span>
                  </div>
                  <div className="flex justify-between">
                    <span>玉簪</span>
                    <span>五两</span>
                  </div>
                  <div className="flex justify-between text-[#c04040]">
                    <span>结余</span>
                    <span>{balance}文</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/4 transform -translate-x-1/2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-24 h-32 bg-[#f5e6c8] rounded-t-lg relative mb-2">
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-[#d4a574] border-2 border-[#8b5e3c]" />
              <div className="absolute top-14 left-1/2 transform -translate-x-1/2 text-xs font-bold text-[#2a1f18]">
                {guestTypeLabels[currentItem.guestType]}
              </div>
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 text-xs text-[#2a1f18]">
                {currentItem.guestName}
              </div>
            </div>
            <div className="bg-[#f5e6c8] px-3 py-1 rounded shadow relative">
              <span className="text-sm text-[#2a1f18]">掌柜的，您给瞧瞧这件</span>
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-[#f5e6c8]" />
            </div>
          </motion.div>
        </div>

        <div 
          className="absolute bottom-1/3 right-1/4 transform translate-x-1/2"
          onMouseMove={handleMagnifierMove}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: isMagnifying ? 1.5 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="w-32 h-32 bg-[#f5e6c8] rounded-lg flex items-center justify-center shadow-xl border-2 border-[#8b5e3c]">
              <ItemIcon size={100} />
            </div>
            
            {isMagnifying && (
              <motion.div
                className="absolute w-16 h-16 rounded-full border-4 border-[#8b5e3c] pointer-events-none overflow-hidden"
                style={{
                  left: `${magnifierPos.x - 32}px`,
                  top: `${magnifierPos.y - 32}px`,
                  boxShadow: '0 0 20px rgba(0,0,0,0.5)'
                }}
              >
                <div 
                  className="w-full h-full"
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)`,
                    transform: `scale(1.5) translate(-${magnifierPos.x * 0.3}%, -${magnifierPos.y * 0.3}%)`
                  }}
                />
              </motion.div>
            )}

            {currentItem.flaws.map((flaw, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isMagnifying ? 1 : 0, scale: isMagnifying ? 1 : 0.8 }}
                className="absolute text-xs text-[#c04040] bg-[#f5e6c8] px-2 py-1 rounded shadow"
                style={{ top: `${20 + idx * 20}px`, right: '-80px' }}
              >
                {flaw}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="h-48 bg-[#8b5e3c] border-t-4 border-[#6b4226] p-4 flex">
        <div className="flex space-x-6 items-center justify-center w-1/3">
          <motion.button
            className="coin-button flex items-center justify-center"
            onClick={handleWeigh}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentStep !== 'idle'}
          >
            <span className="text-xs text-[#2a1f18] font-bold z-10">戥</span>
          </motion.button>

          <motion.button
            className="coin-button flex items-center justify-center"
            onClick={handleExamine}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentStep !== 'examining'}
          >
            <span className="text-xs text-[#2a1f18] font-bold z-10">镜</span>
          </motion.button>

          <motion.button
            className="coin-button flex items-center justify-center"
            onClick={handleCalculate}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            disabled={currentStep !== 'calculating'}
          >
            <span className="text-xs text-[#2a1f18] font-bold z-10">算</span>
          </motion.button>
        </div>

        {currentStep === 'weighing' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="relative"
              >
                <div className="w-32 h-1 bg-[#8b6914] rounded" />
                <div className="absolute -left-4 top-2 w-8 h-6 bg-[#d4af37] rounded-b-lg border border-[#8b6914]" />
                <div className="absolute -right-2 top-2 w-6 h-10 bg-[#f5e6c8] rounded border border-[#8b5e3c] flex items-end justify-center pb-1">
                  <span className="text-xs text-[#2a1f18] font-bold">{currentItem.weight}两</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {currentStep === 'calculating' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex items-center justify-center"
          >
            <div className="bg-[#8b5e3c] p-2 rounded border-2 border-[#6b4226]">
              <div className="flex space-x-1">
                {abacusBeads.map((bead, idx) => (
                  <motion.div
                    key={idx}
                    className="w-6 h-12 bg-[#f5e6c8] rounded-sm relative"
                  >
                    <div className="absolute top-1 left-0 right-0 h-0.5 bg-[#6b4226]" />
                    <motion.div
                      className="absolute left-1 right-1 h-5 bg-[#8b6914] rounded-full"
                      animate={{ y: bead === 1 ? -4 : 12 }}
                      transition={{ duration: 0.2 }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {currentStep === 'complete' && valuationResult && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 flex items-center justify-center space-x-4"
          >
            <div className="text-[#f5e6c8] text-center">
              <div className="text-sm opacity-80">当本</div>
              <div className="text-3xl font-bold text-[#d4af37]">{valuationResult.pawnAmount}文</div>
              <div className="text-xs opacity-60">估值 {valuationResult.baseValue}文</div>
            </div>
            <div className="space-y-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAgree}
                className="block w-20 py-2 bg-[#c04040] text-[#f5e6c8] rounded font-bold text-sm"
              >
                同意收当
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReject}
                className="block w-20 py-2 bg-[#6b4226] text-[#f5e6c8] rounded font-bold text-sm"
              >
                婉言谢绝
              </motion.button>
            </div>
          </motion.div>
        )}

        <div className="w-1/3 bg-[#f5e6c8] rounded p-3 border border-[#8b5e3c]">
          <div className="text-sm font-bold text-[#2a1f18] mb-1">{currentItem.itemName}</div>
          <div className="grid grid-cols-2 gap-1 text-xs text-[#2a1f18]">
            <div>材质：<span className="text-[#c04040]">{materialLabels[currentItem.material]}</span></div>
            <div>年代：<span className="text-[#c04040]">{eraLabels[currentItem.era]}</span></div>
            <div>品相：<span className="text-[#c04040]">{conditionLabels[currentItem.condition]}</span></div>
            <div>流通：<span className="text-[#c04040]">{liquidityLabels[currentItem.liquidity]}</span></div>
          </div>
          <div className="mt-2 text-xs text-[#6b4226]">
            {currentItem.description}
          </div>
          {valuationResult && (
            <div className="mt-2 pt-2 border-t border-[#8b5e3c]">
              <div className="flex justify-between text-sm">
                <span>当本</span>
                <span className="font-bold text-[#c04040]">{valuationResult.pawnAmount}文</span>
              </div>
              <div className="flex justify-between text-xs opacity-70">
                <span>月利</span>
                <span>2分</span>
              </div>
              <div className="flex justify-between text-xs opacity-70">
                <span>当期</span>
                <span>半年</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTicket && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          >
            <div className="w-80 bg-[#f5e6c8] p-6 rounded shadow-2xl relative border-4 border-[#8b5e3c]">
              <div className="text-center mb-4">
                <div className="text-2xl font-brush text-[#2a1f18] font-bold">恒升当</div>
                <div className="text-xs text-[#6b4226]">当票</div>
              </div>
              <div className="border-t-2 border-dashed border-[#8b5e3c] my-3" />
              <div className="space-y-2 text-sm text-[#2a1f18]">
                <div className="flex justify-between">
                  <span>客人：</span>
                  <span>{currentItem?.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span>当物：</span>
                  <span>{currentItem?.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span>当本：</span>
                  <span className="font-bold text-[#c04040]">{valuationResult?.pawnAmount}文</span>
                </div>
                <div className="flex justify-between">
                  <span>月利：</span>
                  <span>2分</span>
                </div>
                <div className="flex justify-between">
                  <span>当期：</span>
                  <span>半年</span>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 w-16 h-16 opacity-60">
                <div className="w-full h-full border-4 border-[#c04040] rounded-full flex items-center justify-center transform rotate-12">
                  <span className="text-[#c04040] font-brush text-lg font-bold">恒升</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Counter;
