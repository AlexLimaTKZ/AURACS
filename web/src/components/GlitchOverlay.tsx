"use client";

import { useGameStore } from "@/lib/store";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useAudio } from "./AudioProvider";

const GLITCH_LINES = Array.from({ length: 10 }, (_, index) => ({
  id: index,
  topInset: (index * 23) % 78,
  bottomInset: (index * 17) % 18,
  translateX: ((index * 11) % 21) - 10,
}));

export function GlitchOverlay() {
  const integrity = useGameStore((state) => state.integrity);
  const [isGlitching, setIsGlitching] = useState(false);
  const { playSfx } = useAudio();

  const triggerGlitch = useCallback(() => {
    setIsGlitching(true);
    playSfx("glitch");
    const timeout = setTimeout(() => setIsGlitching(false), 200);
    return () => clearTimeout(timeout);
  }, [playSfx]);

  useEffect(() => {
    if (integrity >= 50) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        triggerGlitch();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [integrity, triggerGlitch]);

  return (
    <AnimatePresence>
      {isGlitching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-50 bg-red-500/20 mix-blend-overlay"
        >
          <div className="absolute inset-0 animate-pulse bg-[url('/noise.png')] opacity-20" />
          <div className="flex h-full w-full flex-col justify-between">
            {GLITCH_LINES.map((line) => (
              <div
                key={line.id}
                className="h-2 w-full bg-white/20"
                style={{
                  clipPath: `inset(${line.topInset}% 0 ${line.bottomInset}% 0)`,
                  transform: `translateX(${line.translateX}px)`,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
