"use client";

import { useGameStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useAudio } from "./AudioProvider";

export function GlitchOverlay() {
  const integrity = useGameStore((state) => state.integrity);
  const [isGlitching, setIsGlitching] = useState(false);
  const { playSfx } = useAudio();

  useEffect(() => {
    if (integrity < 50) {
      // Random glitch intervals when integrity is low
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          triggerGlitch();
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [integrity]);

  const triggerGlitch = () => {
    setIsGlitching(true);
    playSfx("glitch");
    setTimeout(() => setIsGlitching(false), 200);
  };

  return (
    <AnimatePresence>
      {isGlitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 pointer-events-none mix-blend-overlay bg-red-500/20"
        >
          <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 animate-pulse" />
          <div className="w-full h-full flex flex-col justify-between">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="w-full h-2 bg-white/20 transform translate-x-[-10px]"
                style={{
                  clipPath: `inset(${Math.random() * 100}% 0 ${Math.random() * 100}% 0)`,
                  transform: `translateX(${Math.random() * 20 - 10}px)`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
