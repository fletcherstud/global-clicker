import { useEffect, useRef, useState, useCallback } from 'react'
import Globe from 'globe.gl'
import './Globe.css'

function GlobeComponent() {
  const globeEl = useRef()
  const [lastPressLocation, setLastPressLocation] = useState(null)
  const [arcs, setArcs] = useState([])
  const handleServerButtonPressRef = useRef(null)
  const pressQueueRef = useRef([])
  const isProcessingRef = useRef(false)
  const animationTimeoutRef = useRef(null)

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
      // Point will be shown automatically by the useEffect when queue is empty
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
        
        // Remove first item and continue processing after a delay
        setTimeout(() => {
          pressQueueRef.current = pressQueueRef.current.slice(1);
          if (pressQueueRef.current.length > 0) {
            processNextInQueue();
          } else {
            isProcessingRef.current = false;
          }
        }, 500); // Short delay for first press

        return nextLocation;
      }

      // Handle subsequent presses
      const altitude = getArcAltitude(
        prevLocation.lat,
        prevLocation.lng,
        nextLocation.lat,
        nextLocation.lng
      );

      // Calculate animation duration based on distance
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

      console.log('Creating new arc:', newArc, 'animation duration:', animDuration);
      setArcs([newArc]);

      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      
      // Schedule next animation
      animationTimeoutRef.current = setTimeout(() => {
        console.log('Animation complete, removing from queue');
        setArcs([]); // Clear the arc immediately after animation
        pressQueueRef.current = pressQueueRef.current.slice(1);
        
        if (pressQueueRef.current.length > 0) {
          processNextInQueue();
        } else {
          console.log('Queue processed completely');
          isProcessingRef.current = false;
        }
      }, animDuration + 100); // Add small buffer for cleanup

      return nextLocation;
    });
  }, []);

  const handleNewPress = useCallback((data) => {
    const coords = extractCoordinates(data);
    if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
      console.error('Invalid coordinates received:', data);
      return;
    }

    const newLocation = {
      lat: coords.lat,
      lng: coords.lng,
      name: data.country
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
            controls.autoRotate = !point; // pause rotation when hovering over point
          }
        })
        .arcColor(() => '#fff')
        .arcDashLength(1)
        .arcDashGap(1)
        .arcDashAnimateTime(d => d.animationDuration) // Use dynamic animation duration
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
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.7;
      controls.minPolarAngle = Math.PI / 2.5;
      controls.maxPolarAngle = Math.PI / 1.8;

      // Center the globe
      globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });

      // Expose the globe instance to window for external access
      window.globeInstance = globe;
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
  }, []);

  // Update arcs when new data comes in
  useEffect(() => {
    if (!window.globeInstance) return;

    // Only update if we have valid coordinates
    if (lastPressLocation && isValidCoordinate(lastPressLocation.lat, lastPressLocation.lng)) {
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