import React, { useEffect, useState } from 'react';
import styles from './StatsTable.module.css';

function ConnectedUsers({ count }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Only render if component is mounted and count is valid
  if (!mounted || typeof count !== 'number') return null;

  // Ensure count is never less than 1
  const displayCount = Math.max(1, count);

  // Render in a portal to avoid Globe component interference
  return (
    <div className="fixed top-6 left-6 z-[2000] pointer-events-none">
    <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2 shadow-2xl border border-white/10">
      <div className="flex items-center gap-2">
        {/* Pulsing dot */}
        <div className="relative w-2 h-2">
          <div className="absolute w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
          <div className="absolute w-2 h-2 rounded-full bg-green-400 animate-ping opacity-75" />
        </div>
        <span className={`text-sm font-light text-white/90 ${styles.statsText}`}>
          {displayCount} online
        </span>
      </div>
    </div>
  </div>
  )
}

export default ConnectedUsers; 