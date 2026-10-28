'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function CursorGlow() {
  const [isPointerDevice, setIsPointerDevice] = useState(false);

  // Raw mouse coordinates (start off-screen)
  const mouseX = useMotionValue(-1000);
  const mouseY = useMotionValue(-1000);

  // Fade in / out opacity motion value with smooth spring
  const opacityRaw = useMotionValue(0);
  const opacity = useSpring(opacityRaw, { damping: 25, stiffness: 220 });

  // Scale motion value (reacts to clicks)
  const scaleRaw = useMotionValue(1);
  const scale = useSpring(scaleRaw, { damping: 20, stiffness: 300 });

  // Smooth trailing spring physics for the wide ambient aura (lazy & fluid)
  const springConfigAura = { damping: 28, stiffness: 200, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfigAura);
  const smoothY = useSpring(mouseY, springConfigAura);

  // Snappier spring physics for the inner glow core (tracks cursor closely)
  const springConfigCore = { damping: 22, stiffness: 380, mass: 0.2 };
  const coreX = useSpring(mouseX, springConfigCore);
  const coreY = useSpring(mouseY, springConfigCore);

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
      scaleRaw.set(0.9);
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
      {/* ── Layer 1: Ambient Trailing Brand Aura (Wide, soft, buttery trail) ── */}
      <motion.div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none will-change-transform"
        style={{
          x: smoothX,
          y: smoothY,
          scale,
          width: 520,
          height: 520,
        }}
      >
        {/* Dark Mode Ambient Glow */}
        <div className="hidden dark:block w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,85,51,0.24)_0%,rgba(255,106,61,0.14)_35%,rgba(255,138,0,0.05)_60%,transparent_75%)] blur-[45px]" />
        
        {/* Light Mode Ambient Glow */}
        <div className="dark:hidden w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,85,51,0.12)_0%,rgba(255,110,46,0.07)_35%,rgba(255,138,0,0.03)_60%,transparent_75%)] blur-[35px]" />
      </motion.div>

      {/* ── Layer 2: Tight Responsive Brand Core (Follows cursor closely with rich warm color) ── */}
      <motion.div
        className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none will-change-transform"
        style={{
          x: coreX,
          y: coreY,
          scale,
          width: 240,
          height: 240,
        }}
      >
        {/* Dark Mode Core */}
        <div className="hidden dark:block w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,85,51,0.35)_0%,rgba(255,138,0,0.18)_45%,transparent_70%)] blur-[22px]" />

        {/* Light Mode Core */}
        <div className="dark:hidden w-full h-full rounded-full bg-[radial-gradient(circle,rgba(255,85,51,0.18)_0%,rgba(255,138,0,0.08)_50%,transparent_70%)] blur-[18px]" />
      </motion.div>
    </motion.div>
  );
}
