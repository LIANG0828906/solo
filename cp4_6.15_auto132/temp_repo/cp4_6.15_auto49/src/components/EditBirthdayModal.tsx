/**
 * EditBirthdayModal - 编辑生日记录弹窗表单组件
 *
 * 职责：
 *   - 提供编辑已有生日记录的表单界面（姓名、生日日期、兴趣标签）
 *   - 支持删除当前生日记录（带确认提示）
 *   - 执行表单实时校验与提交前全量校验
 *   - 校验通过后调用 store 的 updatePerson 方法更新数据（姓名变更时同步更新头像色）
 *   - 控制弹窗的打开与关闭（点击遮罩或关闭按钮）
 *
 * 调用关系：
 *   - 被调用方：通常由 BirthdayCard 的编辑按钮触发 store.openEditModal(person) 后展示
 *   - 入参：person: Person - 待编辑的生日记录数据
 *   - 依赖：useBirthdayStore（zustand）获取 closeEditModal / updatePerson / deletePerson
 *   - 依赖：validationUtils 中的 validateForm / validateName / validateBirthday / validateInterests / hasErrors
 *   - 依赖：INTEREST_TAGS 常量提供兴趣标签选项
 *   - 依赖：hashStringToColor 工具函数根据姓名生成头像颜色
 *   - 依赖：lucide-react 图标库（X, Edit3, AlertCircle）
 *
 * 数据流：
 *   输入（props.person）→ 初始化本地状态（name, birthday, interests）
 *     ↓ 用户交互（onChange / onBlur / 点击标签）
 *   本地状态（name, birthday, interests, touched, errors）
 *     ↓ useEffect 监听 touched 字段变化 → validateField() 实时校验
 *     ↓ onSubmit → validateForm() 全量校验 → hasErrors() 判断
 *   校验通过 → 检测姓名是否变更 → 必要时重新计算 avatarColor
 *     ↓ useBirthdayStore.updatePerson(id, updates) 或 deletePerson(id)
 *     ↓ store 内部：更新 people 数组 → saveToStorage()
 *   完成 → closeEditModal() 关闭弹窗
 */
import { memo, useState, useCallback, useEffect } from 'react';
import { X, Edit3, AlertCircle } from 'lucide-react';
import { INTEREST_TAGS } from '@/types';
import { validateForm, hasErrors, validateName, validateBirthday, validateInterests } from '@/utils/validationUtils';
import type { FormErrors, Person } from '@/types';
import { useBirthdayStore } from '@/store/useBirthdayStore';
import { hashStringToColor } from '@/utils/colorUtils';

interface EditBirthdayModalProps {
  person: Person;
}

export const EditBirthdayModal = memo(function EditBirthdayModal({
  person,
}: EditBirthdayModalProps) {
  const { closeEditModal, updatePerson, deletePerson } = useBirthdayStore();
  const [name, setName] = useState(person.name);
  const [birthday, setBirthday] = useState(person.birthday);
  const [interests, setInterests] = useState<string[]>(person.interests);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ name: boolean; birthday: boolean; interests: boolean }>({
    name: false,
    birthday: false,
    interests: false,
  });

  const validateField = useCallback(
    (field: 'name' | 'birthday' | 'interests') => {
      let error: string | undefined;
      if (field === 'name') {
        error = validateName(name);
      } else if (field === 'birthday') {
        error = validateBirthday(birthday);
      } else if (field === 'interests') {
        error = validateInterests(interests);
      }
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [name, birthday, interests]
  );

  useEffect(() => {
    if (touched.name) validateField('name');
    if (touched.birthday) validateField('birthday');
    if (touched.interests) validateField('interests');
  }, [name, birthday, interests, touched, validateField]);

  const handleInterestToggle = (interest: string) => {
    setInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      }
      return [...prev, interest];
    });
    if (!touched.interests) {
      setTouched((prev) => ({ ...prev, interests: true }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ name: true, birthday: true, interests: true });
    
    const formErrors = validateForm(name, birthday, interests);
    if (hasErrors(formErrors)) {
      setErrors(formErrors);
      return;
    }

    const updates: Partial<Person> = {
      name: name.trim(),
      birthday,
      interests,
    };

    if (name.trim() !== person.name) {
      updates.avatarColor = hashStringToColor(name.trim());
    }

    updatePerson(person.id, updates);
    closeEditModal();
  };

  const handleDelete = () => {
    if (window.confirm(`确定要删除 ${person.name} 的生日记录吗？`)) {
      deletePerson(person.id);
      closeEditModal();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeEditModal();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content glass-card p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Edit3 className="text-[#D4AF37]" size={28} />
            <h2 className="text-2xl font-bold font-display">编辑生日记录</h2>
          </div>
          <button
            onClick={closeEditModal}
            className="p-2 rounded-lg bg-white/10 hover:bg-red-500 transition-all duration-200 hover:scale-105"
            title="关闭"
            aria-label="关闭弹窗"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">姓名</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
              className={`input-field ${touched.name && errors.name ? 'input-field-error' : ''}`}
              placeholder="请输入亲友姓名"
            />
            {touched.name && errors.name && (
              <p className="error-text">
                <AlertCircle size={16} />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">生日日期</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, birthday: true }))}
              className={`input-field ${touched.birthday && errors.birthday ? 'input-field-error' : ''}`}
            />
            {touched.birthday && errors.birthday && (
              <p className="error-text">
                <AlertCircle size={16} />
                {errors.birthday}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              兴趣标签（至少选择一个）
            </label>
            <div className={`flex flex-wrap gap-2 ${touched.interests && errors.interests ? 'interest-tag-group-error' : ''}`}>
              {INTEREST_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleInterestToggle(tag)}
                  className={`interest-tag ${
                    interests.includes(tag) ? 'selected' : ''
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {touched.interests && errors.interests && (
              <p className="error-text">
                <AlertCircle size={16} />
                {errors.interests}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger flex-1"
            >
              删除
            </button>
            <button type="button" onClick={closeEditModal} className="btn-secondary flex-1">
              取消
            </button>
            <button type="submit" className="btn-gold flex-1">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
