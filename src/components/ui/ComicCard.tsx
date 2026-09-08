import React from 'react';

interface ComicCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
}

export function ComicCard({ children, className = '', interactive = false }: ComicCardProps) {
  return (
    <div className={`bg-surface border-2 border-border-heavy rounded-xl p-6 shadow-comic ${interactive ? 'comic-interactive cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}
