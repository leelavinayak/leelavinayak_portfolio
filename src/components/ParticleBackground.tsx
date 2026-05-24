import { useEffect, useRef, useState } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

export default function ParticleBackground({ isLightMode }: { isLightMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const particleCount = Math.min(60, Math.floor((dimensions.width * dimensions.height) / 25000));
    const particles: Particle[] = [];

    const baseColors = isLightMode
      ? ["rgba(59, 130, 246, 0.15)", "rgba(168, 85, 247, 0.15)", "rgba(236, 72, 153, 0.12)"] // Blue, Purple, Pink
      : ["rgba(99, 102, 241, 0.35)", "rgba(168, 85, 247, 0.35)", "rgba(6, 182, 212, 0.3)"]; // Indigo, Purple, Cyan

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: Math.random() * 2.5 + 1.2,
        color: baseColors[Math.floor(Math.random() * baseColors.length)],
      });
    }

    let animationFrameId: number;
    let mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const animate = () => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Particle update and rendering
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;

        // Boundaries checks
        if (p.x < 0) p.x = dimensions.width;
        if (p.x > dimensions.width) p.x = 0;
        if (p.y < 0) p.y = dimensions.height;
        if (p.y > dimensions.height) p.y = 0;

        // Interactive mouse force
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const force = (130 - dist) / 130;
            p.x -= dx * force * 0.02;
            p.y -= dy * force * 0.02;
          }
        }

        // Draw particle
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Draw links between nearby particles
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            const alpha = (110 - dist) / 110 * (isLightMode ? 0.08 : 0.16);
            ctx.strokeStyle = isLightMode 
              ? `rgba(99, 102, 241, ${alpha})` 
              : `rgba(168, 85, 247, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (canvas) {
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationFrameId);
    };
  }, [dimensions, isLightMode]);

  return (
    <div id="particle-container" ref={containerRef} className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      <canvas ref={canvasRef} className="block w-full h-full opacity-60" />
    </div>
  );
}
