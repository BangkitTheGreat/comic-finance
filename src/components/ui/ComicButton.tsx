import React from 'react';

interface ComicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  icon?: string;
}

export function ComicButton({ children, className = '', variant = 'primary', icon, ...props }: ComicButtonProps) {
  const baseStyles = "font-label-md px-4 py-2 rounded-lg border-2 border-border-heavy flex items-center justify-center gap-2 comic-interactive shadow-comic-sm";
  
  const variants = {
    primary: "bg-primary text-on-primary",
    secondary: "bg-secondary-container text-on-secondary-container",
    outline: "bg-surface text-ink",
    danger: "bg-danger text-white"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
}
