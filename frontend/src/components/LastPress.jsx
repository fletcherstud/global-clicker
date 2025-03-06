import React from 'react';
import styles from './StatsTable.module.css';

function LastPress({ lastPress }) {
  if (!lastPress) return null;

  // Convert UTC timestamp to local time
  const localTime = new Date(lastPress.timestamp).toLocaleString();

  return (
    <div>
        <div className='text-white/90 text-lg'>Last Press: {lastPress.country}</div>
        <div className='text-white/70 text-sm'>{localTime}</div>
    </div>
  );
}

export default LastPress; 