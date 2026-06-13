import { useState, MouseEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, LogIn, Loader2 } from "lucide-react";

interface FormErrors {
  nickname?: string;
  password?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set());

  const createRipple = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement("span");
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.className = "ripple-effect";
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const triggerShake = (field: string) => {
    setShakingFields((prev) => new Set(prev).add(field));
    setTimeout(() => {
      setShakingFields((prev) => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }, 400);
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!nickname.trim()) {
      newErrors.nickname = "请输入昵称";
      triggerShake("nickname");
    }
    if (!password) {
      newErrors.password = "请输入密码";
      triggerShake("password");
    } else if (password.length < 6) {
      newErrors.password = "密码至少6位";
      triggerShake("password");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/");
    }, 1500);
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "linear-gradient(135deg,#0f3460,#533483)" }}
      >
        <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl p-8 space-y-6">
          <div className="flex justify-center">
            <div className="skeleton w-16 h-16 rounded-full" />
          </div>
          <div className="skeleton h-8 w-3/4 mx-auto rounded-lg" />
          <div className="space-y-4">
            <div className="skeleton h-12 w-full rounded-lg" />
            <div className="skeleton h-12 w-full rounded-lg" />
          </div>
          <div className="skeleton h-12 w-full rounded-lg" />
          <div className="skeleton h-4 w-1/2 mx-auto rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg,#0f3460,#533483)" }}
    >
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-2xl p-6 sm:p-8">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#0f3460,#533483)" }}
          >
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500 mt-2">登录您的账号</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div
            className={`input-focus-underline rounded-lg ${
              errors.nickname ? "shake-animation" : ""
            } ${shakingFields.has("nickname") ? "shake-animation" : ""}`}
          >
            <div
              className={`flex items-center border-2 rounded