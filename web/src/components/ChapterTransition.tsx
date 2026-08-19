"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ChapterTransitionProps {
  isActive: boolean;
  chapterTitle?: string;
  chapterSubtitle?: string;
  onComplete?: () => void;
}

const HYPERSPACE_LINES = Array.from({ length: 30 }, (_, index) => ({
  id: index,
  top: 5 + ((index * 37) % 90),
  destination: index % 2 === 0 ? 150 : -50,
  delay: 0.5 + index * 0.05,
}));

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
            setTimeout(() => onComplete?.(), 3000);
          }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl"
        >
          <div className="absolute inset-0 overflow-hidden">
            {HYPERSPACE_LINES.map((line) => (
              <motion.div
                key={line.id}
                initial={{ scaleX: 0, opacity: 0, x: "50%" }}
                animate={{
                  scaleX: [0, 1, 20],
                  opacity: [0, 0.6, 0],
                  x: ["50%", "50%", `${line.destination}%`],
                }}
                transition={{
                  duration: 1.5,
                  delay: line.delay,
                  ease: "easeIn",
                }}
                className="absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
                style={{
                  top: `${line.top}%`,
                  left: 0,
                  right: 0,
                  transformOrigin: "center",
                }}
              />
            ))}
          </div>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1, 50], opacity: [0, 1, 0] }}
            transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
            className="absolute h-4 w-4 rounded-full bg-white"
            style={{ boxShadow: "0 0 60px 30px rgba(6,182,212,0.5)" }}
          />

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
              className="mx-auto mb-6 h-px max-w-[200px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
            />
            <h2 className="bg-gradient-to-b from-white to-cyan-200/80 bg-clip-text text-3xl font-bold tracking-tighter text-transparent md:text-4xl">
              {chapterTitle}
            </h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-3 font-mono text-xs uppercase tracking-[0.25em] text-cyan-400/50"
            >
              {chapterSubtitle}
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mx-auto mt-6 h-px max-w-[200px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
