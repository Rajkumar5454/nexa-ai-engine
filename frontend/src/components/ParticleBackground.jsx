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

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const numDots = 600;
    // The Golden Angle in radians (Phyllotaxis spiral)
    const goldenAngle = 2.39996323; 
    
    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Smoothly track mouse (the center of the galaxy follows the cursor)
      currentX += (mouseX - currentX) * 0.08;
      currentY += (mouseY - currentY) * 0.08;

      time += 0.001; // slow rotation

      // Scale based on screen size
      const c = Math.min(canvas.width, canvas.height) * 0.025;

      for (let i = 1; i <= numDots; i++) {
        // Distance from center (adding 100 to create the empty hole in the middle)
        const r = c * Math.sqrt(i) + 120;
        
        // Angle (adding time makes the whole spiral rotate)
        const theta = i * goldenAngle + time;

        // Position relative to center
        const x = r * Math.cos(theta);
        const y = r * Math.sin(theta);

        // Absolute position
        const px = currentX + x;
        const py = currentY + y;

        // Draw each particle as a short line (dash) pointing outwards
        const dashLength = 3 + (i / numDots) * 5;
        
        // The angle of the dash is exactly the angle from the center (theta)
        const endX = px + Math.cos(theta) * dashLength;
        const endY = py + Math.sin(theta) * dashLength;

        // Calculate opacity based on distance (fade out at edges)
        const normalizedDist = i / numDots;
        let alpha = 1;
        if (normalizedDist < 0.05) alpha = normalizedDist / 0.05; // Fade in near center
        if (normalizedDist > 0.7) alpha = 1 - (normalizedDist - 0.7) / 0.3; // Fade out at edge

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(endX, endY);
        
        // Stroke styling (thick, rounded dashes)
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        
        // Violet color matches Nexa UI
        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.85})`;
        ctx.stroke();
      }

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
      className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-60"
    />
  );
};

export default ParticleBackground;
