import { useEffect, useRef, useState, useCallback } from 'react'
import Globe from 'globe.gl'
import './Globe.css'

function GlobeComponent({ isFollowMode }) {
  const globeEl = useRef()
  const [lastPressLocation, setLastPressLocation] = useState(null)
  const [arcs, setArcs] = useState([])
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const handleServerButtonPressRef = useRef(null)
  const pressQueueRef = useRef([])
  const isProcessingRef = useRef(false)
  const animationTimeoutRef = useRef(null)
  const cameraAnimationRef = useRef(null)

  // Function to toggle auto-rotation
  const toggleRotation = useCallback(() => {
    setIsAutoRotating(prev => !prev);
  }, []);

  // Function to smoothly move camera to a point
  const moveCamera = useCallback((lat, lng, altitude = 2.5, duration = 1000) => {
    if (!window.globeInstance) return;
    
    const globe = window.globeInstance;
    const startTime = Date.now();
    const startPos = globe.pointOfView();
    
    // Cancel any ongoing camera animation
    if (cameraAnimationRef.current) {
      cancelAnimationFrame(cameraAnimationRef.current);
    }

    const animate = () => {
      const progress = Math.min(1, (Date.now() - startTime) / duration);
      // Ease function (cubic-bezier)
      const ease = t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = ease(progress);

      globe.pointOfView({
        lat: startPos.lat + (lat - startPos.lat) * easedProgress,
        lng: startPos.lng + (lng - startPos.lng) * easedProgress,
        altitude: startPos.altitude + (altitude - startPos.altitude) * easedProgress
      });

      if (progress < 1) {
        cameraAnimationRef.current = requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  // Function to toggle follow mode
  const toggleFollowMode = useCallback(() => {
    if (isFollowMode) {
      // When follow mode is enabled, move to the current location
      const currentLocation = pressQueueRef.current.length > 0 
        ? pressQueueRef.current[0] 
        : lastPressLocation;
      
      if (currentLocation) {
        moveCamera(currentLocation.lat, currentLocation.lng);
      }
    }
  }, [isFollowMode, lastPressLocation, moveCamera]);

  // Handle follow mode state changes
  useEffect(() => {
    if (isFollowMode) {
      // When follow mode is enabled, move to the current location
      const currentLocation = pressQueueRef.current.length > 0 
        ? pressQueueRef.current[0] 
        : lastPressLocation;
      
      if (currentLocation) {
        moveCamera(currentLocation.lat, currentLocation.lng);
      }
    }
  }, [isFollowMode, lastPressLocation, moveCamera]);

  // Handle rotation state changes
  useEffect(() => {
    if (window.globeInstance) {
      const controls = window.globeInstance.controls();
      if (controls) {
        controls.autoRotate = isAutoRotating;
      }
    }
  }, [isAutoRotating]);

  // Expose toggle functions to parent
  useEffect(() => {
    window.toggleGlobeRotation = toggleRotation;
    window.toggleGlobeFollowMode = toggleFollowMode;
  }, [toggleRotation, toggleFollowMode]);

  // Function to fetch last button press from backend
  const fetchLastButtonPress = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/lastButtonPress');
      const data = await response.json();
      console.log('Last button press:', data);
      if (data) {
        const coords = extractCoordinates(data);
        if (coords && isValidCoordinate(coords.lat, coords.lng)) {
          const location = {
            lat: coords.lat,
            lng: coords.lng,
            name: data.country,
            timestamp: data.timestamp
          };
          setLastPressLocation(location);
        }
      }
    } catch (error) {
      console.error('Error fetching last button press:', error);
    }
  }, []);

  // Helper function to calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Helper function to calculate arc altitude based on distance
  const getArcAltitude = (startLat, startLng, endLat, endLng) => {
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    // Start with very low altitude (0.1) for short distances
    // Exponentially increase up to 0.8 for longer distances
    // Using sigmoid-like scaling for smooth transition
    const baseAltitude = 0.1;
    const maxAltitude = 0.8;
    const scaleFactor = 3000; // Adjust this to control how quickly altitude increases with distance
    
    return baseAltitude + (maxAltitude - baseAltitude) * (1 - Math.exp(-distance / scaleFactor));
  };

  // Helper function to validate coordinates
  const isValidCoordinate = (lat, lng) => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  };

  // Helper function to extract coordinates from server data
  const extractCoordinates = (data) => {
    if (data.location && data.location.coordinates) {
      // Server sends coordinates as [longitude, latitude]
      return {
        lat: data.location.coordinates[1],
        lng: data.location.coordinates[0]
      };
    }
    return null;
  };

  // Helper function to calculate arc animation duration based on distance
  const getAnimationDuration = (startLat, startLng, endLat, endLng) => {
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    // Base duration for short distances (in ms)
    const baseDuration = 1000;
    // Additional duration per 1000km of distance
    const durationPerThousandKm = 500;
    return baseDuration + (distance / 1000) * durationPerThousandKm;
  };

  const processNextInQueue = useCallback(async () => {
    console.log('Processing queue, length:', pressQueueRef.current.length);
    
    if (pressQueueRef.current.length === 0) {
      console.log('Queue empty, stopping processing');
      isProcessingRef.current = false;
      setArcs([]); // Clear any arcs
      return;
    }

    isProcessingRef.current = true;
    const nextLocation = pressQueueRef.current[0];
    console.log('Processing location:', nextLocation);

    setLastPressLocation(prevLocation => {
      // Handle first press differently
      if (!prevLocation || !isValidCoordinate(prevLocation.lat, prevLocation.lng)) {
        console.log('First press, setting initial location');
        setArcs([]); // Clear any arcs
        
        if (isFollowMode) {
          moveCamera(nextLocation.lat, nextLocation.lng);
        }

        setTimeout(() => {
          pressQueueRef.current = pressQueueRef.current.slice(1);
          if (pressQueueRef.current.length > 0) {
            processNextInQueue();
          } else {
            isProcessingRef.current = false;
          }
        }, 500);

        return nextLocation;
      }

      // Handle subsequent presses
      const altitude = getArcAltitude(
        prevLocation.lat,
        prevLocation.lng,
        nextLocation.lat,
        nextLocation.lng
      );

      const animDuration = getAnimationDuration(
        prevLocation.lat,
        prevLocation.lng,
        nextLocation.lat,
        nextLocation.lng
      );

      const newArc = {
        startLat: prevLocation.lat,
        startLng: prevLocation.lng,
        endLat: nextLocation.lat,
        endLng: nextLocation.lng,
        altitude,
        animationDuration: animDuration
      };

      if (isFollowMode) {
        // Calculate midpoint for camera position
        const midLat = (prevLocation.lat + nextLocation.lat) / 2;
        const midLng = (prevLocation.lng + nextLocation.lng) / 2;
        // Position camera slightly higher than the arc
        const cameraAltitude = altitude * 1.5 + 1;
        
        moveCamera(midLat, midLng, cameraAltitude, animDuration / 2);
        
        // Schedule camera movement to end point
        setTimeout(() => {
          moveCamera(nextLocation.lat, nextLocation.lng, 2.5, animDuration / 2);
        }, animDuration / 2);
      }

      console.log('Creating new arc:', newArc, 'animation duration:', animDuration);
      setArcs([newArc]);

      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      animationTimeoutRef.current = setTimeout(() => {
        console.log('Animation complete, removing from queue');
        setArcs([]);
        pressQueueRef.current = pressQueueRef.current.slice(1);
        
        if (pressQueueRef.current.length > 0) {
          processNextInQueue();
        } else {
          console.log('Queue processed completely');
          isProcessingRef.current = false;
        }
      }, animDuration + 100);

      return nextLocation;
    });
  }, [isFollowMode, moveCamera]);

  const handleNewPress = useCallback((data) => {
    const coords = extractCoordinates(data);
    if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
      console.error('Invalid coordinates received:', data);
      return;
    }

    const newLocation = {
      lat: coords.lat,
      lng: coords.lng,
      name: data.country,
      timestamp: data.timestamp // Use timestamp from server data
    };

    console.log('Adding new press to queue:', newLocation);
    pressQueueRef.current.push(newLocation);

    if (!isProcessingRef.current) {
      console.log('Starting queue processing');
      processNextInQueue();
    } else {
      console.log('Queue is already being processed, items in queue:', pressQueueRef.current.length);
    }
  }, [processNextInQueue]);

  useEffect(() => {
    let globe;
    let handleResize;
    
    setTimeout(() => {
      globe = Globe()(globeEl.current)
        .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundImageUrl(null)
        .width(window.innerWidth)
        .height(window.innerHeight)
        .backgroundColor('#000000')
        .atmosphereColor('#ffffff')
        .atmosphereAltitude(0.15)
        .pointColor(() => '#fff')
        .pointRadius(0.12)
        .pointAltitude(0)
        .pointsMerge(false)
        .onPointHover(point => {
          console.log('Point hovered:', point);
          const controls = window.globeInstance.controls();
          if (controls) {
            controls.autoRotate = !point && isAutoRotating; // Only auto-rotate if enabled and not hovering
          }
        })
        .arcColor(() => '#fff')
        .arcDashLength(1)
        .arcDashGap(1)
        .arcDashAnimateTime(d => d.animationDuration)
        .arcStroke(0.5)
        .arcAltitudeAutoScale(false)
        .arcAltitude(d => d.altitude || 0.5);

      // Handle window resize
      handleResize = () => {
        globe.width(window.innerWidth)
          .height(window.innerHeight);
      };
      window.addEventListener('resize', handleResize);

      // Set initial camera position and controls
      globe.camera().position.set(0, 0, 400);
      
      // Configure controls for smoother interaction
      const controls = globe.controls();
      controls.enableZoom = false;
      controls.enablePan = false;
      controls.autoRotate = isAutoRotating;
      controls.autoRotateSpeed = 0.7;
      controls.minPolarAngle = Math.PI / 2.5;
      controls.maxPolarAngle = Math.PI / 1.8;

      // Center the globe
      globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });

      // Expose the globe instance to window for external access
      window.globeInstance = globe;

      // Fetch last button press after globe is initialized
      fetchLastButtonPress();
    }, 100);

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      if (globe) {
        if (handleResize) {
          window.removeEventListener('resize', handleResize);
        }
        globe._destructor();
      }
    };
  }, [fetchLastButtonPress]); // Remove isAutoRotating from dependencies

  // Update arcs when new data comes in
  useEffect(() => {
    console.log("HERE")
    if (!window.globeInstance) return;
    console.log("HERE2")
    // Only update if we have valid coordinates
    if (lastPressLocation && isValidCoordinate(lastPressLocation.lat, lastPressLocation.lng)) {
      console.log('Updating globe with last press location:', lastPressLocation);
      window.globeInstance
        .pointsData(pressQueueRef.current.length === 0 ? [lastPressLocation] : []) // Only show point when queue is empty
        .pointAltitude(.15)
        .arcsData(arcs);
    } else {
      // If coordinates are invalid, clear the visualization
      window.globeInstance
        .pointsData([])
        .arcsData([]);
    }
  }, [arcs, lastPressLocation]);

  // Set up server button press listener once
  useEffect(() => {
    // Create the event listener function
    const listener = (event) => {
      handleNewPress(event.detail);
    };

    // Store the listener in the ref for cleanup
    handleServerButtonPressRef.current = listener;

    // Add the event listener
    window.addEventListener('serverButtonPress', listener);

    // Cleanup
    return () => {
      if (handleServerButtonPressRef.current) {
        window.removeEventListener('serverButtonPress', handleServerButtonPressRef.current);
      }
    };
  }, []); // Empty dependency array - only run once

  return (
    <div className="globe-container">
      <div ref={globeEl} />
    </div>
  );
}

export default GlobeComponent; 