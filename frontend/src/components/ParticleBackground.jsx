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

    const points = [];
    const numPoints = 180;
    
    // Determine radius based on screen size
    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.40; 

    for (let i = 0; i < numPoints; i++) {
      const phi = Math.acos(-1 + (2 * i) / numPoints);
      const theta = Math.sqrt(numPoints * Math.PI) * phi;
      
      points.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        baseRadius: Math.random() * 2 + 1.5
      });
    }

    // Pre-calculate connections
    const connections = [];
    const connectDistance = radius * 0.45; // Tune this to get network-like shapes
    for (let i = 0; i < numPoints; i++) {
      for (let j = i + 1; j < numPoints; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist < connectDistance) {
          connections.push([i, j]);
        }
      }
    }

    let rotationX = 0;
    let rotationY = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Mouse interactive or auto-rotate
      rotationX += 0.001;
      rotationY += 0.002;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Project all points
      const projected = points.map(p => {
        // Rotate Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        
        // Rotate X
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        const focalLength = 1000;
        const scale = focalLength / (focalLength + z2);
        
        return {
          x: centerX + x1 * scale,
          y: centerY + y2 * scale,
          z: z2,
          scale: scale,
          baseRadius: p.baseRadius
        };
      });

      // Draw lines
      ctx.lineWidth = 0.6;
      connections.forEach(([i, j]) => {
        const p1 = projected[i];
        const p2 = projected[j];
        
        // Only draw if both are somewhat in front
        if (p1.z > -800 && p2.z > -800) {
          const avgZ = (p1.z + p2.z) / 2;
          // Violet color: rgb(139, 92, 246)
          const alpha = Math.min(1, Math.max(0.05, (avgZ + radius) / (radius * 2.5)));
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = `rgba(139, 92, 246, ${alpha * 0.35})`;
          ctx.stroke();
        }
      });

      // Draw points
      projected.forEach((p) => {
        if (p.z > -800) {
          const alpha = Math.min(1, Math.max(0.2, (p.z + radius) / (radius * 2)));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.baseRadius * p.scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(167, 139, 250, ${alpha * 0.9})`; // lighter violet for dots
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 z-[1] pointer-events-none opacity-80"
    />
  );
};

export default ParticleBackground;
