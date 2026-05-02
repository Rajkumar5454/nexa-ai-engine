import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse tracking
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Generate points (Fibonacci sphere)
    const points = [];
    const numPoints = 400; // Dense dots like Antigravity
    const radius = 250; // Fixed radius for the sphere that follows cursor

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      
      points.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        baseRadius: Math.random() * 1.5 + 1
      });
    }

    let rotationX = 0;
    let rotationY = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smoothly move the center to the mouse position
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      const centerX = mouseX;
      const centerY = mouseY;

      // Slowly rotate the sphere itself
      rotationX += 0.002;
      rotationY += 0.003;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      points.forEach(p => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        const focalLength = 800;
        const scale = focalLength / (focalLength + z2);
        
        const xProjected = centerX + x1 * scale;
        const yProjected = centerY + y2 * scale;
        
        // Draw dots (NO lines, just dots like Antigravity)
        if (z2 > -focalLength) {
          // Violet color: rgb(139, 92, 246)
          const alpha = Math.min(1, Math.max(0.1, (z2 + radius) / (radius * 2)));
          ctx.beginPath();
          ctx.arc(xProjected, yProjected, p.baseRadius * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-50 pointer-events-none"
    />
  );
};

export default ParticleBackground;
