import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface Props extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles: Record<string, string> = {
  primary: 'text-[#1A237E]',
  secondary: 'text-white border border-white/20 hover:border-white/40',
  ghost: 'text-white/80 hover:text-white hover:bg-white/10',
  danger: 'text-white',
};

const variantBg: Record<string, string> = {
  primary: 'linear-gradient(135deg,#FFD54F 0%,#FFC107 100%)',
  secondary: 'rgba(255,255,255,0.06)',
  ghost: 'transparent',
  danger: 'linear-gradient(135deg,#E53935 0%,#C62828 100%)',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'primary', size = 'md', loading, icon, className, disabled, children, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      disabled={disabled || loading}
      whileHover={disabled || loading ? undefined : { y: -1, boxShadow: '0 6px 14px rgba(0,0,0,0.3)' }}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
        'focus:ring-offset-[#1A237E] disabled:opacity-50 disabled:cursor-not-allowed',
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      style={{
        background: variantBg[variant],
        boxShadow: variant === 'primary' ? '0 2px 8px rgba(255,213,79,0.25)' : undefined,
        focusRing: '2px solid #FFD54F',
      }}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </motion.button>
  );
});
