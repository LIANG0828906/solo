import { useEffect } from 'react';
import { useDayBriefStore } from '../store';
import type { TemplateType } from '../types';
import { X, FileText, Settings } from 'lucide-react';
import styles from '../styles/SettingsModal.module.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TemplateOption {
  type: TemplateType;
  name: string;
  description: string;
  icon: typeof FileText | typeof Settings;
  iconClass: string;
}

const templateOptions: TemplateOption[] = [
  {
    type: 'simple',
    name: '简约版',
    description: '仅展示任务列表，简洁高效',
    icon: FileText,
    iconClass: styles.templateIconSimple,
  },
  {
    type: 'detailed',
    name: '详细版',
    description: '完整展示工时统计、任务分组及备注',
    icon: FileText,
    iconClass: styles.templateIconDetailed,
  },
  {
    type: 'custom',
    name: '自定义版',
    description: '自由调整段落顺序与标题文案',
    icon: Settings,
    iconClass: styles.templateIconCustom,
  },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const templateType = useDayBriefStore((s) => s.templateType);
  const setTemplateType = useDayBriefStore((s) => s.setTemplateType);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCardClick = (type: TemplateType) => {
    setTemplateType(type);
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>日报模板设置</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p className={styles.sectionLabel}>选择一种日报模板风格：</p>
          <div className={styles.templateGrid}>
            {templateOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = templateType === option.type;
              return (
                <div
                  key={option.type}
                  className={`${styles.templateCard} ${isSelected ? styles.templateCardSelected : ''}`}
                  onClick={() => handleCardClick(option.type)}
                >
                  <div className={`${styles.templateIcon} ${option.iconClass}`}>
                    <IconComponent size={20} />
                  </div>
                  <div className={styles.templateName}>{option.name}</div>
                  <div className={styles.templateDesc}>{option.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
