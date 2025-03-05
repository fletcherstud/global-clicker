import React from 'react';

function GlowButton({ onClick, disabled }) {
  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 
        text-white text-lg font-medium tracking-wider
        rounded-full overflow-hidden
        transition-all duration-300 ease-in-out
        ${disabled ? 
          'bg-white/5 cursor-not-allowed' : 
          'bg-white/10 hover:bg-white/20 active:scale-95'
        }
        backdrop-blur-md
        border border-white/10
        shadow-[0_0_20px_rgba(255,255,255,0.1)]
        hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]
        disabled:hover:shadow-none
        group
      `}
    >
      <div className="relative z-10">
        {disabled ? 'Waiting for Turn...' : 'Press Me'}
      </div>
      
      {/* Subtle gradient background */}
      <div 
        className={`
          absolute inset-0 
          bg-gradient-to-r from-white/5 via-white/10 to-white/5
          transition-opacity duration-300
          ${disabled ? 'opacity-0' : 'opacity-100'}
        `}
      />
      
    </button>
  );
}

export default GlowButton; 