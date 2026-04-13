import React, { forwardRef } from "react";

export const Button = forwardRef(({ 
  className = "", 
  variant = "default", 
  size = "default", 
  children, 
  ...props 
}, ref) => {
  
  const baseStyles = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

 
  const variants = {
    default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline: "border border-border bg-card hover:bg-muted hover:text-foreground text-muted-foreground",
    secondary: "bg-muted text-foreground hover:bg-muted/80",
    ghost: "hover:bg-muted hover:text-foreground text-muted-foreground",
    dangerGhost: "text-destructive/80 hover:bg-destructive/10 hover:text-destructive",
    
    purple: "bg-purple-500 text-white shadow-sm hover:bg-purple-600",
    amber: "bg-amber-500 text-white shadow-sm hover:bg-amber-600",
    amberOutline: "border border-amber-500/50 text-amber-700 dark:text-amber-500 bg-transparent hover:bg-amber-500/10 shadow-sm",
    
    defaultPurple: "bg-primary text-primary-foreground shadow-sm hover:bg-purple-500 hover:text-white",
    defaultAmber: "bg-primary text-primary-foreground shadow-sm hover:bg-amber-500 hover:text-white",
    
  
    tag: "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-transparent",
    tagActive: "bg-primary text-primary-foreground shadow-sm border border-transparent",
  };


  const sizes = {
    default: "h-9 px-4 py-2 text-sm rounded-lg",
    sm: "h-8 px-3 text-xs rounded-lg",
    lg: "h-10 px-8 text-base rounded-lg",
    icon: "h-9 w-9 rounded-lg", 
    iconSm: "h-7 w-7 text-lg rounded-lg",
    
   
    tagSize: "px-3 py-1 text-sm rounded-full", 
  };

  const combinedClasses = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;

  return (
    <button ref={ref} className={combinedClasses} {...props}>
      {children}
    </button>
  );
});

Button.displayName = "Button";