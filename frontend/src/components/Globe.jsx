import { useEffect, useRef, useState, useCallback } from 'react'
import Globe from 'globe.gl'
import './Globe.css'

function GlobeComponent() {
  const globeEl = useRef()
  const [lastPressLocation, setLastPressLocation] = useState(null)
  const [arcs, setArcs] = useState([])
  const handleServerButtonPressRef = useRef(null)

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

  // Handle new button press from any client
  const handleNewPress = useCallback((data) => {
    // Extract coordinates from server data
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

    setLastPressLocation(prevLocation => {
      if (prevLocation && isValidCoordinate(prevLocation.lat, prevLocation.lng)) {
        // Calculate arc altitude based on distance
        const altitude = getArcAltitude(
          prevLocation.lat, 
          prevLocation.lng, 
          newLocation.lat, 
          newLocation.lng
        );

        // Create new arc
        const newArc = {
          startLat: prevLocation.lat,
          startLng: prevLocation.lng,
          endLat: newLocation.lat,
          endLng: newLocation.lng,
          altitude
        };

        // Update arcs state to only keep the last two arcs
        setArcs(prevArcs => {
          // Keep only the last arc and add the new one
          const updatedArcs = [...prevArcs.slice(-1), newArc];
          return updatedArcs;
        });
      }
      return newLocation;
    });
  }, []);

  useEffect(() => {
    let globe;
    let handleResize;
    
    // Initialize after a small delay to ensure DOM is ready
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
        .pointsMerge(true)
        .arcColor(() => '#fff')
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(1500)
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

    // Cleanup
    return () => {
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
        .pointsData([lastPressLocation])
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