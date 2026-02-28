'use client';

import type { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  size?: 'sm' | 'md';
};

export function Button({ variant = 'ghost', size = 'md', className = '', ...props }: Props) {
  const base = [
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium',
    'transition-all duration-150 ease-out',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm',
  ].join(' ');

  const variants: Record<string, string> = {
    primary: [
      'bg-accent text-[#111] border border-accent',
      'hover:bg-accentHover hover:border-accentHover hover:shadow-[0_0_16px_rgba(212,145,94,0.25)]',
      'active:scale-[0.97]',
    ].join(' '),
    ghost: [
      'bg-bgTertiary/50 text-textPrimary border border-border',
      'hover:bg-bgTertiary hover:border-[#444]',
      'active:scale-[0.97]',
    ].join(' '),
    subtle: [
      'bg-transparent text-textSecondary border border-transparent',
      'hover:text-textPrimary hover:bg-bgTertiary/40',
      'active:scale-[0.97]',
    ].join(' '),
    danger: [
      'bg-error/10 text-[#e07070] border border-error/30',
      'hover:bg-error/20 hover:border-error/50',
      'active:scale-[0.97]',
    ].join(' '),
  };

  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
