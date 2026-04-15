import React from 'react';

export function Badge({ children, variant = 'default', className = '', onClick }) {
  const baseStyles = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors";
  
  const variants = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary/10 text-primary border border-primary/20",
    success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
   
    interactive: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground cursor-pointer border border-transparent",
    active: "bg-primary text-primary-foreground shadow-sm cursor-pointer border border-transparent",
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component 
      onClick={onClick} 
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </Component>
  );
}