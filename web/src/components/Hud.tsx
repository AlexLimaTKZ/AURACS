
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Shield, Package } from "lucide-react";

interface HudProps {
  energy: number;
  integrity: number;
  inventory: string[];
  chapterId: string;
}

export function Hud({ energy, integrity, inventory, chapterId }: HudProps) {
  const getEnergyColor = () => {
    if (energy <= 25) return "bg-red-500 shadow-red-500/50";
    if (energy <= 50) return "bg-amber-500 shadow-amber-500/50";
    return "bg-emerald-500 shadow-emerald-500/50";
  };

  const getIntegrityColor = () => {
    if (integrity <= 25) return "bg-red-500 shadow-red-500/50";
    if (integrity <= 50) return "bg-amber-500 shadow-amber-500/50";
    return "bg-cyan-500 shadow-cyan-500/50";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-4xl mx-auto flex flex-wrap items-center gap-3 md:gap-6 px-3 md:px-5 py-2.5 md:py-3 rounded-lg bg-white/[0.03] backdrop-blur-xl border border-white/[0.06]"
    >
      {/* Energy */}
      <div className="flex items-center gap-2.5 flex-1">
        <Zap className={cn("w-3.5 h-3.5", energy <= 25 ? "text-red-400" : "text-emerald-400")} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-mono">Energia</span>
            <span className={cn(
              "text-[11px] font-mono font-semibold",
              energy <= 25 ? "text-red-400" : "text-emerald-400"
            )}>
              {energy}%
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full shadow-sm", getEnergyColor())}
              initial={{ width: 0 }}
              animate={{ width: `${energy}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/[0.08]" />

      {/* Integrity */}
      <div className="flex items-center gap-2.5 flex-1">
        <Shield className={cn("w-3.5 h-3.5", integrity <= 25 ? "text-red-400" : "text-cyan-400")} />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-mono">Integridade</span>
            <span className={cn(
              "text-[11px] font-mono font-semibold",
              integrity <= 25 ? "text-red-400" : "text-cyan-400"
            )}>
              {integrity}%
            </span>
          </div>
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full shadow-sm", getIntegrityColor())}
              initial={{ width: 0 }}
              animate={{ width: `${integrity}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/[0.08]" />

      {/* Inventory */}
      <div className="flex items-center gap-2">
        <Package className="w-3.5 h-3.5 text-violet-400/60" />
        <span className="text-[10px] text-white/40 uppercase tracking-[0.15em] font-mono">
          {inventory.length} itens
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-white/[0.08]" />

      {/* Chapter */}
      <div className="text-[10px] text-white/30 uppercase tracking-[0.15em] font-mono">
        {chapterId.replace("chapter-", "Cap. ")}
      </div>
    </motion.div>
  );
}
