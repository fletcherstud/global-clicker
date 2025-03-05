import React from 'react';

function GlowButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="px-8 py-4 bg-white/10 backdrop-blur-sm 
                 border border-white/20 rounded-full text-white font-medium text-lg
                 hover:bg-white/20 transition-all duration-300 ease-in-out
                 shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]
                 active:transform active:scale-95"
    >
      Press Me
    </button>
  );
}

export default GlowButton; 