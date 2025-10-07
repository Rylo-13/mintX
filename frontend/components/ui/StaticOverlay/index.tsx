"use client";

import { useEffect, useRef } from "react";

function StaticOverlayInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to full window for visibility
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    const FPS_LIMIT = 30;
    const frameInterval = 1000 / FPS_LIMIT;
    let lastTime = 0;
    let animationId: number;

    // Generate static noise
    const generateStatic = () => {
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      // Process every pixel but with better performance
      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255;
        const alpha = Math.random() * 0.1;

        data[i] = noise; // Red
        data[i + 1] = noise; // Green
        data[i + 2] = noise; // Blue
        data[i + 3] = alpha * 255; // Alpha
      }

      ctx.putImageData(imageData, 0, 0);
    };

    // Frame rate limited animation
    const animate = (currentTime: number) => {
      if (currentTime - lastTime >= frameInterval) {
        generateStatic();
        lastTime = currentTime;
      }
      animationId = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{
        opacity: 0.7,
        mixBlendMode: "normal",
      }}
    />
  );
}

import dynamic from "next/dynamic";

const StaticOverlay = dynamic(() => Promise.resolve(StaticOverlayInner), {
  ssr: false,
});

export default StaticOverlay;
