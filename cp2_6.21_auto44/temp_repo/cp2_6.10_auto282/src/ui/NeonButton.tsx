import { ButtonHTMLAttributes, forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { COLORS } from '@/utils/colors';

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const NeonButton = forwardRef<HTMLButtonElement, NeonButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const variants = {
      primary: {
        border: `border-2 border-transparent bg-gradient-to-r from-[${COLORS.neonPurple}] to-[${COLORS.neonCyan}] bg-clip-padding`,
        shadow: `shadow-[0_0_20px_rgba(179,0,255,0.5),0_0_40px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(179,0,255,0.7),0_0_60px_rgba(0,229,255,0.5)]`,
      },
      secondary: {
        border: `border-2 border-[${COLORS.neonCyan}]`,
        shadow: `shadow-[0_0_15px_rgba(0,229,255,0.4)] hover:shadow-[0_0_25px_rgba(0,229,255,0.6)]`,
      },
      danger: {
        border: `border-2 border-[${COLORS.beamFlashing}]`,
        shadow: `shadow-[0_0_15px_rgba(255,51,102,0.4)] hover:shadow-[0_0_25px_rgba(255,51,102,0.6)]`,
      },
    };

    const v = variants[variant];

    return (
      <button
        ref={ref}
        className={twMerge(
          'relative px-6 py-3 font-bold text-white uppercase tracking-wider',
          'transition-all duration-300 ease-out',
          'bg-black/60 backdrop-blur-sm',
          'hover:scale-105 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          v.border,
          v.shadow,
          className
        )}
        style={{
          clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
        }}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${COLORS.neonPurple}20 0%, ${COLORS.neonCyan}20 100%)`,
          }}
        />
      </button>
    );
  }
);

NeonButton.displayName = 'NeonButton';
