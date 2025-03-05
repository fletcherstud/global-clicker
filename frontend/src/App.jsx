import { useState, useCallback } from 'react'
import GlobeComponent from './components/Globe'
import StatsTable from './components/StatsTable'
import GlowButton from './components/GlowButton'
import './App.css'

function App() {
  const [stats, setStats] = useState({
    'United States': 1234,
    'United Kingdom': 856,
    'Japan': 654,
    'Germany': 432,
    'France': 321,
    'Canada': 298,
    'Australia': 245,
    'Brazil': 198
  });

  const handleButtonPress = useCallback(() => {
    // For now, just increment US count
    // Later this will be based on user's actual location
    setStats(prevStats => ({
      ...prevStats,
      'United States': prevStats['United States'] + 1
    }));
  }, []);

  return (
    <div className="app">
      <GlobeComponent />
      <div className="stats-overlay">
        <StatsTable stats={stats} />
      </div>
      <div className="button-container">
        <GlowButton onClick={handleButtonPress} />
      </div>
    </div>
  )
}

export default App
