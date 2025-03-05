import { useEffect, useRef, useState } from 'react'
import Globe from 'globe.gl'
import './Globe.css'

function GlobeComponent() {
  const globeEl = useRef()
  const [lastPressLocation, setLastPressLocation] = useState(null)
  const [arcs, setArcs] = useState([])

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
        .arcAltitude(0.2);

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

    // Update points and arcs on the globe
    window.globeInstance
      .pointsData(lastPressLocation ? [lastPressLocation] : [])
      .arcsData(arcs);
  }, [arcs, lastPressLocation]);

  // Handle new button press
  const handleNewPress = (data) => {
    const newLocation = {
      lat: data.latitude,
      lng: data.longitude,
      name: data.country
    };

    if (lastPressLocation) {
      // Create new arc
      const newArc = {
        startLat: lastPressLocation.lat,
        startLng: lastPressLocation.lng,
        endLat: newLocation.lat,
        endLng: newLocation.lng
      };

      // Update arcs state
      setArcs(prevArcs => {
        // Keep only the last 10 arcs to prevent performance issues
        const updatedArcs = [...prevArcs, newArc].slice(-10);
        return updatedArcs;
      });
    }

    // Update last press location
    setLastPressLocation(newLocation);
  };

  // Expose handleNewPress to parent component
  useEffect(() => {
    if (window) {
      window.handleNewPress = handleNewPress;
    }
  }, [lastPressLocation]);

  return (
    <div className="globe-container">
      <div ref={globeEl} />
    </div>
  );
}

export default GlobeComponent; 