
"use client";

import { motion, useAnimation } from "framer-motion";
import { useCallback, useImperativeHandle, forwardRef, ReactNode } from "react";

export interface ScreenShakeRef {
  shake: (intensity?: "light" | "medium" | "heavy") => void;
  pulse: (color?: string) => void;
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
        const amp = amplitudes[intensity];
        const duration = intensity === "heavy" ? 0.08 : 0.05;

        await controls.start({
          x: [0, -amp, amp, -amp * 0.6, amp * 0.6, -amp * 0.3, 0],
          y: [0, amp * 0.5, -amp * 0.5, amp * 0.3, -amp * 0.3, 0, 0],
          transition: { duration: duration * 7, ease: "easeOut" },
        });
      },
      [controls]
    );

    const pulse = useCallback(
      async (color: string = "rgba(239, 68, 68, 0.15)") => {
        await pulseControls.start({
          opacity: [0, 1, 0],
          transition: { duration: 0.6, ease: "easeOut" },
        });
      },
      [pulseControls]
    );

    useImperativeHandle(ref, () => ({ shake, pulse }), [shake, pulse]);

    return (
      <motion.div animate={controls} className="relative">
        {/* Flash overlay for pulse effects */}
        <motion.div
          animate={pulseControls}
          initial={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50 bg-red-500/10"
        />
        {children}
      </motion.div>
    );
  }
);

ScreenShake.displayName = "ScreenShake";
