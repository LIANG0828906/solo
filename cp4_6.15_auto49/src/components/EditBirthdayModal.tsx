import { memo, useState, useCallback, useEffect } from 'react';
import { X, Edit3 } from 'lucide-react';
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
              className="input-field"
              placeholder="请输入亲友姓名"
            />
            {touched.name && errors.name && (
              <p className="error-text">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">生日日期</label>
            <input
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              onBlur={() => setTouched((prev) => ({ ...prev, birthday: true }))}
              className="input-field"
            />
            {touched.birthday && errors.birthday && (
              <p className="error-text">{errors.birthday}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              兴趣标签（至少选择一个）
            </label>
            <div className="flex flex-wrap gap-2">
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
              <p className="error-text">{errors.interests}</p>
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
