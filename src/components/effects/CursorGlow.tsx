'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  // Raw mouse coordinates (start off-screen)
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Fade in / out opacity with smooth spring
  const opacityRaw = useMotionValue(0);
  const opacity = useSpring(opacityRaw, { damping: 25, stiffness: 220 });

  // Scale motion value (tactile reaction on click)
  const scaleRaw = useMotionValue(1);
  const scale = useSpring(scaleRaw, { damping: 22, stiffness: 350 });

  // Responsive, fluid follower spring physics (keeps mouse exactly in center without lagging far behind)
  const springConfig = { damping: 28, stiffness: 420, mass: 0.12 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Single light diameter
  const LIGHT_SIZE = 440;

  useEffect(() => {
    // Only enable on devices that have a mouse / trackpad (ignore touch devices)
    const checkPointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsPointerDevice(checkPointer.matches);

    const handleMediaChange = (e: MediaQueryListEvent) => {
      setIsPointerDevice(e.matches);
    };

    checkPointer.addEventListener('change', handleMediaChange);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      opacityRaw.set(1);
    };

    const handleMouseLeave = () => {
      opacityRaw.set(0);
    };

    const handleMouseEnter = () => {
      opacityRaw.set(1);
    };

    const handleMouseDown = () => {
      scaleRaw.set(0.92);
    };

    const handleMouseUp = () => {
      scaleRaw.set(1);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      checkPointer.removeEventListener('change', handleMediaChange);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseX, mouseY, opacityRaw, scaleRaw]);

  if (!isPointerDevice) return null;

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 overflow-hidden select-none"
      style={{ opacity }}
    >
      {/* ── Single Smooth Brand Light Follower (Mouse cursor is EXACTLY in the center) ── */}
      <motion.div
        className="absolute top-0 left-0 pointer-events-none will-change-transform"
        style={{
          x: smoothX,
          y: smoothY,
        }}
      >
        <motion.div
          data-cursor-glow="true"
          style={{
            scale,
            width: LIGHT_SIZE,
            height: LIGHT_SIZE,
            marginLeft: -LIGHT_SIZE / 2,
            marginTop: -LIGHT_SIZE / 2,
          }}
          className="rounded-full pointer-events-none"
        >
          {/* Dark Mode: Vibrant, smooth, continuous radial blend of brand flame orange */}
          <div className="hidden dark:block w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,85,51,0.26)_0%,rgba(255,106,61,0.15)_25%,rgba(255,138,0,0.06)_50%,transparent_72%)] blur-[38px]" />

          {/* Light Mode: Soft, warm, elegant terracotta glow */}
          <div className="dark:hidden w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,85,51,0.13)_0%,rgba(255,110,46,0.07)_28%,rgba(255,138,0,0.03)_50%,transparent_70%)] blur-[30px]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
