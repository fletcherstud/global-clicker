import React from 'react';

function GlowButton({ onClick, disabled, children, className = '' }) {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative
        transition-all duration-300 ease-in-out
        ${disabled ? 
          'opacity-50 cursor-not-allowed' : 
          'hover:scale-105 active:scale-95'
        }
        ${className}
      `}
    >
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Glow effect */}
      <div 
        className={`
          absolute inset-0 
          bg-gradient-to-r from-white/5 via-white/10 to-white/5
          transition-opacity duration-300
          rounded-inherit
          ${disabled ? 'opacity-0' : 'opacity-100'}
        `}
      />
      
      {/* Hover glow */}
      <div 
        className={`
          absolute inset-[-2px]
          bg-gradient-to-r from-white/0 via-white/10 to-white/0
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
          rounded-inherit
          ${disabled ? 'hidden' : ''}
        `}
      />
    </button>
  );
}

export default GlowButton; 