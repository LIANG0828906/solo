import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { User as UserIcon, Phone, ArrowRight, Check } from 'lucide-react';
import { useAuthStore } from '../store';
import { getAvatarOptions } from '../models';
import { useToast } from '@/components/Toast';
import { validateUsername, validateContact } from '@/utils/validators';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(getAvatarOptions()[0]);
  const [contact, setContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nameErr, setNameErr] = useState('');
  const [contactErr, setContactErr] = useState('');
  const { register, currentUser, loading, error, clearError } = useAuthStore();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const avatars = getAvatarOptions();

  const validateForm = () => {
    const nc = validateUsername(name);
    setNameErr(nc.valid ? '' : nc.message);
    const cc = validateContact(contact);
    setContactErr(cc.valid ? '' : cc.message);
    return nc.valid && cc.valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const user = await register({ name: name.trim(), avatar, contact: contact.trim() });
      showToast(`注册成功！欢迎您，${user.name}！`, 'success');
      navigate('/', { replace: true });
    } catch (e: any) {
      showToast(e.message || '注册失败', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 py-10">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-7">
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-2xl mb-4 shadow-card"
            style={{ backgroundColor: '#2C3E50' }}
          >
            🎉
          </div>
          <h1 className="text-2xl font-bold text-secondary">加入 SwapBazaar</h1>
          <p className="text-sm text-secondary/60 mt-2">
            创建账号，开启您的闲置交换之旅
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 sm:p-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">选择头像</label>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {avatars.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  className={`aspect-square rounded-xl text-2xl sm:text-3xl flex items-center justify-center transition-all ${
                    avatar === a
                      ? 'bg-primary/10 border-2 scale-105'
                      : 'bg-bg border-2 border-transparent hover:border-primary/30'
                  }`}
                  style={{ borderColor: avatar === a ? '#E67E22' : undefined }}
                >
                  {a}
                  {avatar === a && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">
              用户名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/40" />
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (nameErr) setNameErr('');
                }}
                placeholder="3-12位字母数字下划线"
                maxLength={12}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-bg focus:bg-white transition-all text-sm ${
                  nameErr ? 'border-red-300 focus:border-red-400' : 'border-secondary/10 focus:border-primary/50'
                }`}
              />
            </div>
            {nameErr ? (
              <p className="text-xs text-red-500 mt-1.5">{nameErr}</p>
            ) : (
              <p className="text-xs text-secondary/40 mt-1.5">支持字母、数字、下划线，3-12个字符</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-secondary mb-2 block">联系方式（可选）</label>
            <div className="relative">
              <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/40" />
              <input
                type="text"
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  if (contactErr) setContactErr('');
                }}
                placeholder="手机号或邮箱地址"
                className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-bg focus:bg-white transition-all text-sm ${
                  contactErr ? 'border-red-300 focus:border-red-400' : 'border-secondary/10 focus:border-primary/50'
                }`}
              />
            </div>
            {contactErr ? (
              <p className="text-xs text-red-500 mt-1.5">{contactErr}</p>
            ) : (
              <p className="text-xs text-secondary/40 mt-1.5">便于卖家/买家联系您，不会公开显示</p>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</div>
          )}

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full py-3.5 rounded-xl text-white font-semibold hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
            style={{ backgroundColor: '#E67E22' }}
          >
            {submitting || loading ? '注册中...' : '创建账号'}
            {!(submitting || loading) && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-secondary/60">
          已有账号？{' '}
          <Link to="/login" className="font-semibold hover:underline" style={{ color: '#E67E22' }}>
            去登录 →
          </Link>
        </div>
      </div>
    </div>
  );
}
