import React from 'react';
import styles from './StatsTable.module.css';

function StatsTable({ stats }) {
  // Calculate total clicks
  const totalClicks = Object.values(stats).reduce((sum, country) => sum + country, 0);
  
  return (
    <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 shadow-2xl border border-white/10">
      <div className="flex flex-col gap-3">
        {/* Header Section - More compact */}
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-baseline gap-3">
            <span className={`text-2xl font-light ${styles.statsText}`}>
              {totalClicks.toLocaleString()}
            </span>
            <span className={`text-sm font-light tracking-wider text-white/70 ${styles.statsText}`}>
            {" "} Global Clicks
            </span>
          </div>
        </div>

        {/* Stats Grid - More compact */}
        <div className="grid gap-2 max-h-[30vh] overflow-y-auto pr-2">
          {Object.entries(stats)
            .sort(([, a], [, b]) => b - a)
            .map(([country, clicks]) => (
              <div 
                key={country}
                className="flex justify-between items-center group"
              >
                <span className={`text-sm font-light text-white/70 group-hover:text-white/90 transition-colors ${styles.statsText}`}>
                  {country} {" "}
                </span>
                <span className={`text-sm font-medium text-white/90 ${styles.statsText}`}>
                  {clicks.toLocaleString()}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default StatsTable; 