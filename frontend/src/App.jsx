import { useState, useCallback, useEffect } from 'react'
import GlobeComponent from './components/Globe'
import StatsTable from './components/StatsTable'
import GlowButton from './components/GlowButton'
import Particles from './components/Particles'
import { socketService } from './services/socketService'
import './App.css'

function App() {
  const [stats, setStats] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Connect to WebSocket server
    socketService.connect();
    
    // Set up stats listener
    socketService.onStatsUpdate(setStats);

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleButtonPress = useCallback(() => {
    if (!isAnimating) {
      // In a real app, you would get the actual country from geolocation
      // For now, using US as example
      socketService.emitButtonPress({
        country: 'United States',
        latitude: 37.7749,
        longitude: -122.4194
      });
    }
  }, [isAnimating]);

  const handleAnimationStart = useCallback((position) => {
    setParticleOrigin(position);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  }, []);

  return (
    <div className="app">
      <GlobeComponent />
      <div className="stats-overlay">
        <StatsTable stats={stats} />
      </div>
      <div className="button-container">
        <GlowButton 
          onClick={handleButtonPress}
          onAnimationStart={handleAnimationStart}
        />
      </div>
      {isAnimating && (
        <Particles 
          isAnimating={isAnimating}
          buttonPosition={particleOrigin}
        />
      )}
    </div>
  )
}

export default App
