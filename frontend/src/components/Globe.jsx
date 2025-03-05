import { useEffect, useRef } from 'react'
import Globe from 'globe.gl'
import './Globe.css'

function GlobeComponent() {
  const globeEl = useRef()

  useEffect(() => {
    let globe;
    let handleResize;
    
    // Initialize after a small delay to ensure DOM is ready
    setTimeout(() => {
      globe = Globe()(globeEl.current)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
        .backgroundImageUrl(null)
        .width(window.innerWidth)
        .height(window.innerHeight)
        .backgroundColor('#000000')
        .atmosphereColor('white')
        .atmosphereAltitude(0.15)
        .pointColor(() => '#fff')
        .pointRadius(0.12)
        .pointAltitude(0)
        .pointsMerge(true)
        .pointsData([
          { lat: 37.7749, lng: -122.4194 },
          { lat: 40.7128, lng: -74.0060 },
          { lat: 51.5074, lng: -0.1278 },
          { lat: 35.6762, lng: 139.6503 }
        ])
        .arcColor(() => '#fff')
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(1500)
        .arcStroke(0.5)
        .arcsData([
          { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.0060 },
          { startLat: 40.7128, startLng: -74.0060, endLat: 51.5074, endLng: -0.1278 },
          { startLat: 51.5074, startLng: -0.1278, endLat: 35.6762, endLng: 139.6503 }
        ])
        .arcAltitude(0.2)
        .globeRadius(50);

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
      controls.minPolarAngle = Math.PI / 2;
      controls.maxPolarAngle = Math.PI / 2;

      // Center the globe
      globe.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
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

  return (
    <div className="globe-container">
      <div ref={globeEl} />
    </div>
  )
}

export default GlobeComponent 