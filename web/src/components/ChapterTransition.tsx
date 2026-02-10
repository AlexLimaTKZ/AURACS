
"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ChapterTransitionProps {
  isActive: boolean;
  chapterTitle?: string;
  chapterSubtitle?: string;
  onComplete?: () => void;
}

export function ChapterTransition({
  isActive,
  chapterTitle = "Capítulo Completo",
  chapterSubtitle = "Preparando próximo salto...",
  onComplete,
}: ChapterTransitionProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onAnimationComplete={() => {
            // Auto-dismiss after animation
            setTimeout(() => onComplete?.(), 3000);
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          {/* Hyperspace lines */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  scaleX: 0, 
                  opacity: 0,
                  x: "50%",
                }}
                animate={{ 
                  scaleX: [0, 1, 20], 
                  opacity: [0, 0.6, 0],
                  x: ["50%", "50%", `${Math.random() > 0.5 ? 150 : -50}%`],
                }}
                transition={{
                  duration: 1.5,
                  delay: 0.5 + i * 0.05,
                  ease: "easeIn",
                }}
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                style={{
                  top: `${5 + Math.random() * 90}%`,
                  left: 0,
                  right: 0,
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>

          {/* Central flash */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 50], opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
            className="absolute w-4 h-4 rounded-full bg-white"
            style={{ boxShadow: "0 0 60px 30px rgba(6,182,212,0.5)" }}
          />

          {/* Chapter title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="z-10 text-center"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mb-6 max-w-[200px]"
            />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-cyan-200/80">
              {chapterTitle}
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-xs text-cyan-400/50 uppercase tracking-[0.25em] mt-3 font-mono"
            >
              {chapterSubtitle}
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent mx-auto mt-6 max-w-[200px]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
