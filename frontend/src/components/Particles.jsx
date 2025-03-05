import React, { useEffect, useRef } from 'react';

function Particles({ isAnimating, buttonPosition }) {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationFrameRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 2 + 1; // Much smaller particles
        this.initialSize = this.size;
        this.speedX = (Math.random() - 0.5) * 2; // Slower horizontal movement
        this.speedY = -Math.random() * 4 - 2; // Gentler upward movement
        this.opacity = 0.8;
        this.gravity = 0.05;
        this.life = 1; // Life factor for smooth transitions
      }

      update() {
        // Smooth movement
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += this.gravity;
        
        // Gradual size and opacity changes
        this.life -= 0.01;
        this.size = this.initialSize * (0.5 + this.life * 0.5);
        this.opacity = this.life * 0.8;
        
        // Gentle attraction to center
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const dx = centerX - this.x;
        const dy = centerY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Smoother attraction that increases as particles get closer
        const attractionStrength = 0.001 * Math.max(0, 1 - distance / 500);
        this.speedX += dx * attractionStrength;
        this.speedY += dy * attractionStrength;
        
        // Add slight wind effect
        this.speedX += Math.sin(this.y * 0.01) * 0.01;
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        
        // Subtle gradient for each particle
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    }

    const createParticles = () => {
      // Create fewer particles
      for (let i = 0; i < 30; i++) {
        particlesRef.current.push(
          new Particle(
            buttonPosition.x + (Math.random() - 0.5) * 10,
            buttonPosition.y
          )
        );
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particlesRef.current = particlesRef.current.filter(particle => particle.life > 0);
      
      // Draw all particles
      ctx.globalCompositeOperation = 'lighter';
      particlesRef.current.forEach(particle => {
        particle.update();
        particle.draw(ctx);
      });
      ctx.globalCompositeOperation = 'source-over';

      if (particlesRef.current.length > 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    if (isAnimating) {
      particlesRef.current = [];
      createParticles();
      animate();
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, buttonPosition]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{
        background: 'transparent',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        mixBlendMode: 'screen'
      }}
    />
  );
}

export default Particles; 