interface TutorialBubbleProps {
  step: number;
  onNext: () => void;
  onClose: () => void;
}

const tutorialSteps = [
  {
    title: '欢迎来到乐高3D建模工具！',
    content: '这是一个简单易用的3D建模应用，让我们用三步来学习如何使用它。',
  },
  {
    title: '第一步：拖拽积木',
    content: '从左侧积木库中选择积木类型和颜色，然后拖拽到中央的3D场景中。积木会自动吸附到网格上。',
  },
  {
    title: '第二步：编辑和查看',
    content: '点击选中积木，用方向键微调位置，用Delete键删除。右键拖拽可以旋转视角，滚轮可以缩放。',
  },
  {
    title: '完成！',
    content: '你可以开始创建了！尝试搭建一个小房子吧。完成后可以导出为STL文件用于3D打印。',
  },
];

export default function TutorialBubble({ step, onNext, onClose }: TutorialBubbleProps) {
  const currentStep = tutorialSteps[step];

  return (
    <div style={styles.overlay}>
      <div style={styles.bubble}>
        <button style={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <div style={styles.content}>
          <h3 style={styles.title}>{currentStep.title}</h3>
          <p style={styles.text}>{currentStep.content}</p>
        </div>

        <div style={styles.footer}>
          <div style={styles.dots}>
            {tutorialSteps.map((_, i) => (
              <span
                key={i}
                style={{
                  ...styles.dot,
                  backgroundColor: i === step ? '#6366F1' : '#475569',
                }}
              />
            ))}
          </div>

          <button style={styles.nextBtn} onClick={onNext}>
            {step < tutorialSteps.length - 1 ? '下一步' : '开始创建'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 1000,
  },
  bubble: {
    width: 320,
    backgroundColor: '#0F172A',
    border: '1px solid #6366F1',
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 8,
    right: 12,
    background: 'none',
    border: 'none',
    color: '#64748B',
    fontSize: 20,
    cursor: 'pointer',
    padding: 0,
    width: 24,
    height: 24,
  },
  content: {
    marginBottom: 16,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 600,
    margin: '0 0 8px 0',
  },
  text: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 1.5,
    margin: 0,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dots: {
    display: 'flex',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    transition: 'background-color 0.2s ease-out',
  },
  nextBtn: {
    padding: '8px 20px',
    backgroundColor: '#6366F1',
    color: 'white',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'background-color 0.2s ease-out',
  },
};
