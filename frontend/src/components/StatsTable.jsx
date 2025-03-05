import React from 'react';
import styles from './StatsTable.module.css';

function StatsTable({ stats }) {
  // Calculate total clicks
  const totalClicks = Object.values(stats).reduce((sum, country) => sum + country, 0);
  
  return (
    <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 shadow-lg border border-white/20">
      <div className="flex flex-col gap-3 mb-4">
        <h2 className={`text-lg font-medium ${styles.statsText}`}>Global Button Presses</h2>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-semibold ${styles.statsText}`}>
            {totalClicks.toLocaleString()}
          </span>
          <span className={`text-sm ${styles.statsText}`}>Total Clicks</span>
        </div>
      </div>
      
      <div className="overflow-x-auto max-h-[60vh]">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`py-2 px-3 text-left border-b border-white/20 font-medium text-sm ${styles.statsText}`}>Country</th>
              <th className={`py-2 px-3 text-left border-b border-white/20 font-medium text-sm ${styles.statsText}`}>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats)
              .sort(([, a], [, b]) => b - a)
              .map(([country, clicks]) => (
                <tr key={country} className="hover:bg-white/10 transition-colors">
                  <td className={`py-2 px-3 text-sm ${styles.statsText}`}>{country}</td>
                  <td className={`py-2 px-3 text-sm ${styles.statsText}`}>{clicks.toLocaleString()}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StatsTable; 