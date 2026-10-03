"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* Confetti + animated checkmark, same as the Design 1 booking panel. */

export function Confetti() {
  const [pieces, setPieces] = useState<
    { id: number; x: number; color: string; delay: number; size: number; ratio: number; rotation: number; drift: number; duration: number }[]
  >([]);

  useEffect(() => {
    const colors = ["#5DBE47", "#FF4D4D", "#FFD100", "#33A1FD", "#A855F7", "#F472B6", "#34D399", "#FBBF24"];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- random layout must be client-only to avoid hydration mismatch
    setPieces(
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        color: colors[i % colors.length],
        delay: Math.random() * 0.5,
        size: Math.random() * 8 + 4,
        ratio: Math.random() > 0.5 ? 1 : 0.5,
        rotation: Math.random() * 360,
        drift: (Math.random() - 0.5) * 120,
        duration: 2.5 + Math.random(),
      })),
    );
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: 900,
            x: p.drift,
            opacity: [1, 1, 0],
            rotate: p.rotation + 720,
            scale: [1, 1, 0.5],
          }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          className="absolute rounded-sm"
          style={{ left: `${p.x}%`, top: 0, width: p.size, height: p.size * p.ratio, backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

export function AnimatedCheckmark() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
      className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6"
    >
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
        <motion.circle
          cx="26" cy="26" r="24" stroke="#10b981" strokeWidth="3" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
        />
        <motion.path
          d="M15 27L22 34L37 19" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.7 }}
        />
      </svg>
    </motion.div>
  );
}

/** CSS-only fade-up (works without JS / before hydration). */
export function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`et-fade-up ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
