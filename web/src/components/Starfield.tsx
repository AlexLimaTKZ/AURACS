
"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  speed: number;
}

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const stars: Star[] = [];
    const STAR_COUNT = 200;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStar = (): Star => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      z: Math.random() * 3,
      size: Math.random() * 1.5 + 0.3,
      opacity: Math.random() * 0.6 + 0.1,
      speed: Math.random() * 0.15 + 0.02,
    });

    const init = () => {
      resize();
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push(createStar());
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        // Subtle parallax drift
        star.y += star.speed * (1 + star.z * 0.5);
        star.x += star.speed * 0.05 * star.z;

        // Gentle twinkle
        const twinkle = Math.sin(Date.now() * 0.001 * star.speed * 10 + star.x) * 0.2;

        if (star.y > canvas.height) {
          star.y = -2;
          star.x = Math.random() * canvas.width;
        }
        if (star.x > canvas.width) {
          star.x = 0;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size * (1 + star.z * 0.3), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${Math.max(0, star.opacity + twinkle)})`;
        ctx.fill();

        // Glow for brighter stars
        if (star.size > 1) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(150, 200, 255, ${(star.opacity + twinkle) * 0.08})`;
          ctx.fill();
        }
      }

      animationId = requestAnimationFrame(draw);
    };

    init();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
}
