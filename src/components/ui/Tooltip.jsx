import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

// CORE UI: Reusable tooltip/popover component with outside-click detection.
export function Tooltip({
  trigger,
  title,
  subtitle,
  children,
  position = 'bottom-right',
  width = 'w-[360px]'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipRef = useRef(null);

  // CORE MECHANIC: Close tooltip when clicking outside of its DOM element
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-3',
    'bottom-left': 'top-full left-0 mt-3',
    'top-right': 'bottom-full right-0 mb-3',
    'top-left': 'bottom-full left-0 mb-3',
  };

  return (
    <div className="relative inline-flex items-center" ref={tooltipRef}>
      {/* Trigger element (e.g. a button with a '?' mark) */}
      <div 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }} 
        className="cursor-pointer"
      >
        {trigger}
      </div>

      {/* Tooltip Content */}
      {isOpen && (
        <div
          className={`absolute ${positionClasses[position]} ${width} bg-card border border-border p-5 rounded-xl shadow-xl z-50 text-sm leading-relaxed text-left cursor-default font-normal text-foreground animate-in fade-in zoom-in-95 duration-200`}
        >
          <button
            className="absolute top-3 right-3 bg-transparent border-none text-muted-foreground w-7 h-7 flex items-center justify-center cursor-pointer rounded-md transition-colors hover:text-foreground hover:bg-muted leading-none text-lg"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          >
            <X className="w-4 h-4" />
          </button>

          {(title || subtitle) && (
            <h3 className="text-base font-bold text-foreground mb-4 pr-6 leading-tight">
              {title}
              {subtitle && (
                <>
                  <br />
                  <span className="text-primary text-sm font-semibold">{subtitle}</span>
                </>
              )}
            </h3>
          )}

          <div className="text-muted-foreground">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}