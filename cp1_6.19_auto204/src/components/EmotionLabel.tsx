import React, { useEffect, useState, useCallback } from 'react';
import { useEmotionStore } from '../store/emotionStore';

const selectJoy = (state: { joy: number }) => state.joy;
const selectSadness = (state: { sadness: number }) => state.sadness;
const selectAnger = (state: { anger: number }) => state.anger;
const selectCalm = (state: { calm: number }) => state.calm;
const selectGetLabel = (state: { getCompositeLabel: () => string }) => state.getCompositeLabel;

const EmotionLabel: React.FC = () => {
  const joy = useEmotionStore(selectJoy);
  const sadness = useEmotionStore(selectSadness);
  const anger = useEmotionStore(selectAnger);
  const calm = useEmotionStore(selectCalm);
  const getCompositeLabel = useEmotionStore(selectGetLabel);

  const [label, setLabel] = useState(getCompositeLabel());

  const updateLabel = useCallback(() => {
    setLabel(getCompositeLabel());
  }, [getCompositeLabel]);

  useEffect(() => {
    const timer = setTimeout(updateLabel, 100);
    return () => clearTimeout(timer);
  }, [joy, sadness, anger, calm, updateLabel]);

  return (
    <div className="emotion-label-container">
      <div className="emotion-label">{label}</div>
    </div>
  );
};

export default EmotionLabel;
