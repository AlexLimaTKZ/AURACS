
"use client";

import { motion } from "framer-motion";

interface AuraProps {
  state?: "idle" | "speaking" | "thinking" | "error";
}

export function Aura({ state = "idle" }: AuraProps) {
  const getColors = () => {
    switch (state) {
      case "error":
        return { primary: "#ef4444", secondary: "#dc2626", glow: "rgba(239,68,68,0.3)" };
      case "thinking":
        return { primary: "#f59e0b", secondary: "#d97706", glow: "rgba(245,158,11,0.3)" };
      case "speaking":
        return { primary: "#10b981", secondary: "#059669", glow: "rgba(16,185,129,0.4)" };
      default:
        return { primary: "#06b6d4", secondary: "#0891b2", glow: "rgba(6,182,212,0.2)" };
    }
  };

  const { primary, secondary, glow } = getColors();

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      {/* Ambient glow */}
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.5, 1] : [1, 1.2, 1],
          opacity: state === "error" ? [0.3, 0.6, 0.3] : [0.15, 0.3, 0.15],
        }}
        transition={{
          duration: state === "speaking" ? 1 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-24 h-24 rounded-full blur-2xl"
        style={{ background: glow }}
      />

      {/* Core orb */}
      <motion.div
        animate={{
          scale: state === "speaking" ? [1, 1.15, 0.95, 1] : [1, 1.03, 1],
          opacity: [0.9, 1, 0.9],
        }}
        transition={{
          duration: state === "speaking" ? 0.6 : 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-8 h-8 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${primary}, ${secondary})`,
          boxShadow: `0 0 20px ${glow}, 0 0 40px ${glow}`,
          animation: state === "error" ? "glitch 0.3s infinite" : undefined,
        }}
      />

      {/* Inner ring */}
      <motion.div
        animate={{
          rotate: 360,
          scale: state === "speaking" ? [1, 1.08, 1] : [1, 1.02, 1],
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute w-16 h-16 rounded-full"
        style={{
          border: `1px solid transparent`,
          borderTopColor: `${primary}80`,
          borderRightColor: `${primary}20`,
        }}
      />

      {/* Middle ring */}
      <motion.div
        animate={{
          rotate: -360,
          scale: state === "speaking" ? [1, 1.05, 1] : [1, 1.01, 1],
        }}
        transition={{
          rotate: { duration: 12, repeat: Infinity, ease: "linear" },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute w-20 h-20 rounded-full"
        style={{
          border: `1px solid transparent`,
          borderBottomColor: `${secondary}60`,
          borderLeftColor: `${secondary}15`,
        }}
      />

      {/* Outer ring */}
      <motion.div
        animate={{
          rotate: 360,
          opacity: state === "error" ? [0.1, 0.5, 0.1] : [0.05, 0.15, 0.05],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: "linear" },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
        className="absolute w-24 h-24 rounded-full"
        style={{
          border: `1px solid transparent`,
          borderTopColor: `${primary}30`,
        }}
      />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -8, 0],
            x: [0, Math.sin(i * 1.2) * 4, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2.5 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.5,
          }}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: primary,
            left: `${30 + Math.cos(i * 1.05) * 35}%`,
            top: `${30 + Math.sin(i * 1.05) * 35}%`,
            boxShadow: `0 0 4px ${primary}`,
          }}
        />
      ))}

      {/* Error scanline effect */}
      {state === "error" && (
        <motion.div
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 0.15, repeat: Infinity }}
          className="absolute inset-0 rounded-full overflow-hidden"
        >
          <div
            className="w-full h-[2px] bg-red-500/50"
            style={{ animation: "scanline 0.5s linear infinite" }}
          />
        </motion.div>
      )}
    </div>
  );
}
