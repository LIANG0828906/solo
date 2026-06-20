export const ANIMATION_TIMINGS = {
  BUNDLE_TIE: 1500,
  STITCH_TIE: 1600,
  FOLD_TIE: 800,
  DYE_MIST: 1000,
  VAT_WAVE: 2000,
  FABRIC_LIFT: 2000,
  DRAIN: 3000,
  DRYING_SWING: 3000,
} as const;

export const CSS_KEYFRAMES = `
  @keyframes wave {
    0%, 100% {
      transform: translateX(0) translateY(0);
    }
    25% {
      transform: translateX(-5px) translateY(3px);
    }
    50% {
      transform: translateX(0) translateY(-3px);
    }
    75% {
      transform: translateX(5px) translateY(2px);
    }
  }

  @keyframes ropeWrap {
    0% {
      stroke-dashoffset: 300;
      transform: rotate(0deg);
    }
    100% {
      stroke-dashoffset: 0;
      transform: rotate(540deg);
    }
  }

  @keyframes stitchMove {
    0%, 100% {
      transform: translateX(0) translateY(0);
    }
    25% {
      transform: translateX(20px) translateY(-10px);
    }
    50% {
      transform: translateX(40px) translateY(0);
    }
    75% {
      transform: translateX(20px) translateY(10px);
    }
  }

  @keyframes foldFabric {
    0% {
      transform: scaleX(1) rotateY(0deg);
    }
    50% {
      transform: scaleX(0.5) rotateY(90deg);
    }
    100% {
      transform: scaleX(1) rotateY(0deg);
    }
  }

  @keyframes mistFloat {
    0% {
      opacity: 0;
      transform: translateY(0) scale(0.5);
    }
    30% {
      opacity: 0.8;
    }
    100% {
      opacity: 0;
      transform: translateY(-80px) scale(1.5);
    }
  }

  @keyframes fabricSwing {
    0%, 100% {
      transform: rotate(-10deg);
    }
    50% {
      transform: rotate(10deg);
    }
  }

  @keyframes drip {
    0% {
      opacity: 1;
      transform: translateY(0);
    }
    100% {
      opacity: 0;
      transform: translateY(30px);
    }
  }

  @keyframes sealStamp {
    0% {
      transform: scale(2) rotate(-15deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(5deg);
      opacity: 1;
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
`;

export const ANIMATION_CLASSES = {
  wave: 'animate-wave',
  ropeWrap: 'animate-rope-wrap',
  stitchMove: 'animate-stitch-move',
  foldFabric: 'animate-fold-fabric',
  mistFloat: 'animate-mist-float',
  fabricSwing: 'animate-fabric-swing',
  drip: 'animate-drip',
  sealStamp: 'animate-seal-stamp',
} as const;
