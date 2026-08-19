"use client";

import { motion, useAnimation } from "framer-motion";
import { useCallback, useImperativeHandle, forwardRef, ReactNode } from "react";

export interface ScreenShakeRef {
  shake: (intensity?: "light" | "medium" | "heavy") => void;
  pulse: () => void;
}

interface ScreenShakeProps {
  children: ReactNode;
}

export const ScreenShake = forwardRef<ScreenShakeRef, ScreenShakeProps>(
  ({ children }, ref) => {
    const controls = useAnimation();
    const pulseControls = useAnimation();

    const shake = useCallback(
      async (intensity: "light" | "medium" | "heavy" = "medium") => {
        const amplitudes = { light: 2, medium: 4, heavy: 8 };
        const amplitude = amplitudes[intensity];
        const duration = intensity === "heavy" ? 0.08 : 0.05;

        await controls.start({
          x: [0, -amplitude, amplitude, -amplitude * 0.6, amplitude * 0.6, -amplitude * 0.3, 0],
          y: [0, amplitude * 0.5, -amplitude * 0.5, amplitude * 0.3, -amplitude * 0.3, 0, 0],
          transition: { duration: duration * 7, ease: "easeOut" },
        });
      },
      [controls]
    );

    const pulse = useCallback(async () => {
      await pulseControls.start({
        opacity: [0, 1, 0],
        transition: { duration: 0.6, ease: "easeOut" },
      });
    }, [pulseControls]);

    useImperativeHandle(ref, () => ({ shake, pulse }), [shake, pulse]);

    return (
      <motion.div animate={controls} className="relative">
        <motion.div
          animate={pulseControls}
          initial={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-50 bg-red-500/10"
        />
        {children}
      </motion.div>
    );
  }
);

ScreenShake.displayName = "ScreenShake";
