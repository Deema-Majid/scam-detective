import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'scam' | 'legit' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface-2 text-fg border border-border hover:bg-surface',
  ghost: 'bg-transparent text-fg-muted hover:text-fg hover:bg-surface-2',
  scam: 'bg-scam text-scam-fg hover:brightness-110',
  legit: 'bg-legit text-legit-fg hover:brightness-110',
  danger: 'bg-transparent text-scam border border-scam/50 hover:bg-scam/10',
};

const sizes: Record<Size, string> = {
  sm: 'text-sm px-3 py-2 rounded-xl',
  md: 'text-base px-4 py-2.5 rounded-2xl',
  lg: 'text-lg px-6 py-3 rounded-2xl font-semibold',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-medium transition-[filter,background-color,color] duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
