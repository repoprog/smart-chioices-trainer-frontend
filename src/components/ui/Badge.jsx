import React from 'react';

export function Badge({ children, variant = 'default', className = '', onClick }) {
  const baseStyles = "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-medium transition-colors";
  
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
   
    interactive: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer border border-transparent",
    active: "bg-primary text-primary-foreground shadow-sm cursor-pointer border border-transparent",

    
    table: "bg-purple-500/10 text-purple-600 border border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    tree: "bg-cyan-500/10 text-cyan-600 border border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/20",
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </Component>
  );
}