import { useState, useCallback, useEffect } from 'react'
import GlobeComponent from './components/Globe'
import StatsTable from './components/StatsTable'
import GlowButton from './components/GlowButton'
import Particles from './components/Particles'
import { socketService } from './services/socketService'
import './App.css'

// Helper function to generate random coordinates
const getRandomCoordinates = () => {
  // Latitude: -90 to 90
  const lat = Math.random() * 180 - 90;
  // Longitude: -180 to 180
  const lng = Math.random() * 360 - 180;
  
  // Simple country mapping based on coordinates
  // This is a very basic approximation - in a real app you'd use a proper geocoding service
  let country = 'Unknown';
  if (lat > 20 && lat < 50 && lng > -130 && lng < -60) country = 'United States';
  else if (lat > 35 && lat < 70 && lng > -10 && lng < 40) country = 'Europe';
  else if (lat > 20 && lat < 40 && lng > 100 && lng < 150) country = 'Asia';
  else if (lat > -40 && lat < -10 && lng > 110 && lng < 155) country = 'Australia';
  else if (lat > -60 && lat < 15 && lng > -80 && lng < -30) country = 'South America';
  else if (lat > 0 && lat < 40 && lng > -20 && lng < 50) country = 'Africa';

  return {
    country,
    latitude: lat,
    longitude: lng
  };
};

function App() {
  const [stats, setStats] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Connect to WebSocket server
    socketService.connect();
    
    // Set up stats listener
    socketService.onStatsUpdate(setStats);

    // Set up button press listener
    socketService.onButtonPress((data) => {
      // Dispatch custom event for the Globe component
      window.dispatchEvent(new CustomEvent('serverButtonPress', {
        detail: data
      }));
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleButtonPress = useCallback(() => {
    if (!isAnimating) {
      // Generate random coordinates
      const pressData = getRandomCoordinates();

      // Emit to server
      socketService.emitButtonPress(pressData);
    }
  }, [isAnimating]);

  const handleAnimationStart = useCallback((position) => {
    setParticleOrigin(position);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  }, []);

  const handleRotationToggle = useCallback(() => {
    if (window.toggleGlobeRotation) {
      window.toggleGlobeRotation();
      setIsAutoRotating(prev => !prev);
    }
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
        <button
          onClick={handleRotationToggle}
          className="mt-2 text-white/70 text-sm hover:text-white transition-colors duration-300"
        >
          {isAutoRotating ? 'pause rotation' : 'resume rotation'}
        </button>
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
