import { useState, useCallback } from 'react';
import { TutorialStep } from '@/types';

export const tutorialSteps: TutorialStep[] = [
  {
    id: 0,
    title: '欢迎来到宋代泥塑作坊',
    description: '在这里，您将体验一尊神像从选泥到贴金的完整创作过程。让我们开始吧！',
    targetSelector: '.tutorial-step-0',
  },
  {
    id: 1,
    title: '第一步：选择神像姿态',
    description: '左侧面板展示了五种经典神像轮廓，请选择一个您喜欢的姿态开始创作。',
    targetSelector: '.tutorial-step-1',
  },
  {
    id: 2,
    title: '第二步：调整胎体形态',
    description: '通过三个滑块调整神像的头身比、肩宽和腰身，打造您心目中的完美比例。',
    targetSelector: '.tutorial-step-2',
  },
  {
    id: 3,
    title: '第三步：分层上彩与贴金',
    description: '完成塑形后，依次为神像上底色、绘制纹样、贴金箔，每一层都影响最终效果。',
    targetSelector: '.tutorial-step-3',
  },
  {
    id: 4,
    title: '第四步：欣赏与保存作品',
    description: '右侧预览区可360度旋转观赏您的作品。完成后点击保存，下载高清作品与创作说明。',
    targetSelector: '.tutorial-step-4',
  },
];

export const useTutorial = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const nextStep = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsVisible(false);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const skipTutorial = useCallback(() => {
    setIsVisible(false);
  }, []);

  const resetTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsVisible(true);
  }, []);

  return {
    currentStep,
    currentStepData: tutorialSteps[currentStep],
    isVisible,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === tutorialSteps.length - 1,
    totalSteps: tutorialSteps.length,
    nextStep,
    prevStep,
    skipTutorial,
    resetTutorial,
    setIsVisible,
  };
};
