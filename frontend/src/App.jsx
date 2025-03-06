import { useState, useCallback, useEffect } from 'react'
import GlobeComponent from './components/Globe'
import StatsTable from './components/StatsTable'
import GlowButton from './components/GlowButton'
import Particles from './components/Particles'
import ConnectedUsers from './components/ConnectedUsers'
import LastPress from './components/LastPress'
import { socketService } from './services/socketService'
import './App.css'

// Development flag from environment variables
const USE_DUMMY_DATA = import.meta.env.VITE_USE_DUMMY_DATA === 'true';

// Helper function to generate random coordinates
const getRandomCoordinates = () => {
  // Latitude: -90 to 90
  const lat = Math.random() * 180 - 90;
  // Longitude: -180 to 180
  const lng = Math.random() * 360 - 180;
  
  // Simple country mapping based on coordinates
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

// Helper function to get country from coordinates
const getCountryFromCoordinates = (lat, lng) => {
  // This is a very basic approximation - in a real app you'd use a proper geocoding service
  let country = 'Unknown';
  if (lat > 20 && lat < 50 && lng > -130 && lng < -60) country = 'United States';
  else if (lat > 35 && lat < 70 && lng > -10 && lng < 40) country = 'Europe';
  else if (lat > 20 && lat < 40 && lng > 100 && lng < 150) country = 'Asia';
  else if (lat > -40 && lat < -10 && lng > 110 && lng < 155) country = 'Australia';
  else if (lat > -60 && lat < 15 && lng > -80 && lng < -30) country = 'South America';
  else if (lat > 0 && lat < 40 && lng > -20 && lng < 50) country = 'Africa';
  return country;
};

function App() {
  const [stats, setStats] = useState({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isFollowMode, setIsFollowMode] = useState(false);
  const [particleOrigin, setParticleOrigin] = useState({ x: 0, y: 0 });
  const [canPress, setCanPress] = useState(socketService.canPressButton());
  const [connectedUsers, setConnectedUsers] = useState(1);
  const [lastPress, setLastPress] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  // Function to request user location
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return null;
    }

    setIsRequestingLocation(true);
    setLocationError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            country: getCountryFromCoordinates(position.coords.latitude, position.coords.longitude)
          };
          console.log('Real location data:', location);
          setUserLocation(location);
          setIsRequestingLocation(false);
          resolve(location);
        },
        (error) => {
          const errorMessage = error.message || 'Unable to retrieve your location';
          setLocationError(errorMessage);
          setIsRequestingLocation(false);
          reject(error);
        }
      );
    });
  }, []);

  // Fetch initial last press
  useEffect(() => {
    const fetchLastPress = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/lastButtonPress');
        const data = await response.json();
        if (data && !data.error) {
          setLastPress({
            country: data.country,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        console.error('Error fetching last press:', error);
      }
    };

    fetchLastPress();
  }, []);

  useEffect(() => {
    // Connect to WebSocket server
    socketService.connect();
    
    // Set up stats listener
    socketService.onStatsUpdate(setStats);

    // Set up connected users listener with validation
    socketService.onConnectedUsersUpdate((count) => {
      console.log('Setting connected users to:', count);
      // Ensure we only set valid numbers and never go below 1
      if (typeof count === 'number' && count >= 0) {
        setConnectedUsers(Math.max(1, count));
      }
    });

    // Set up button press listener
    socketService.onButtonPress((data) => {
      // Update can press state
      setCanPress(socketService.canPressButton());
      
      // Update last press information
      setLastPress({
        country: data.country,
        timestamp: data.pressedAt
      });

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

  const handleButtonPress = useCallback(async () => {
    if (!isAnimating && canPress) {
      try {
        // In development mode, get and log real location but use dummy data for the press
        if (USE_DUMMY_DATA) {
          // Get real location for logging
          const realLocation = userLocation || await requestLocation();
          if (realLocation) {
            console.log('Client location data:', realLocation);
          }
          
          // Use dummy data for the actual press
          const dummyLocation = getRandomCoordinates();
          console.log('Using dummy location for press:', dummyLocation);
          socketService.emitButtonPress(dummyLocation);
        } else {
          // In production, use real location
          const location = userLocation || await requestLocation();
          if (!location) {
            console.error('Failed to get location');
            return;
          }
          socketService.emitButtonPress(location);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }
  }, [isAnimating, canPress, userLocation, requestLocation]);

  const handleAnimationStart = useCallback((position) => {
    setParticleOrigin(position);
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
    }, 2000);
  }, []);

  const handleGlobeModeToggle = useCallback(() => {
    if (window.toggleGlobeRotation && window.toggleGlobeFollowMode) {
      // Cycle through states: Auto-rotate -> Paused -> Follow -> Auto-rotate
      if (isAutoRotating) {
        // Switch from Auto-rotate to Paused
        window.toggleGlobeRotation();
        setIsAutoRotating(false);
      } else if (!isAutoRotating && !isFollowMode) {
        // Switch from Paused to Follow
        // First disable auto-rotation if it's somehow still on
        if (isAutoRotating) {
          window.toggleGlobeRotation();
          setIsAutoRotating(false);
        }
        // Enable follow mode
        setIsFollowMode(true);
        window.toggleGlobeFollowMode();
      } else {
        // Switch from Follow back to Auto-rotate
        setIsFollowMode(false);
        window.toggleGlobeFollowMode();
        window.toggleGlobeRotation();
        setIsAutoRotating(true);
      }
    }
  }, [isAutoRotating, isFollowMode]);

  const getGlobeModeText = () => {
    if (isAutoRotating) return 'rotating';
    if (isFollowMode) return 'following';
    return 'paused';
  };

  return (
    <div className="app">
      <div className="connected-users-container">
        <ConnectedUsers count={connectedUsers} />
      </div>
      <div className="last-press-container">
        <LastPress lastPress={lastPress} />
      </div>
      <div className="globe-container">
        <GlobeComponent isFollowMode={isFollowMode} />
      </div>
      <div className="stats-overlay">
        <StatsTable stats={stats} />
      </div>
      <div className="button-container">
        <GlowButton 
          onClick={handleButtonPress}
          onAnimationStart={handleAnimationStart}
          disabled={!canPress || isAnimating || isRequestingLocation}
          className="glow-button"
        >
          {isRequestingLocation ? 'Requesting Location...' : 'Press Me'}
        </GlowButton>
        <div className="controls-group">
          <button
            onClick={handleGlobeModeToggle}
            className="globe-mode-button"
          >
            globe: {getGlobeModeText()}
          </button>
          {locationError && (
            <div className="status-message error">
              {locationError.includes('denied') 
                ? 'Please enable location access to continue'
                : locationError}
            </div>
          )}
          {USE_DUMMY_DATA && (
            <div className="status-message warning">
              Using dummy location data
            </div>
          )}
        </div>
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
