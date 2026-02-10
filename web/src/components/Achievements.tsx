
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trophy } from "lucide-react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

// All possible achievements
export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_command",
    title: "Primeiro Contato",
    description: "Execute seu primeiro comando C#",
    icon: "🚀",
  },
  {
    id: "variable_master",
    title: "Mestre das Variáveis",
    description: "Declare sua primeira variável",
    icon: "📦",
  },
  {
    id: "console_writer",
    title: "Comunicador",
    description: "Use Console.WriteLine pela primeira vez",
    icon: "📡",
  },
  {
    id: "decision_maker",
    title: "Decisor",
    description: "Complete sua primeira condicional if/else",
    icon: "🔀",
  },
  {
    id: "chapter_1_complete",
    title: "Sobrevivente",
    description: "Complete o Capítulo 1",
    icon: "⭐",
  },
  {
    id: "no_errors",
    title: "Código Perfeito",
    description: "Complete 3 tarefas sem nenhum erro",
    icon: "💎",
  },
  {
    id: "hacker",
    title: "Hacker Ético",
    description: "Tente acessar algo bloqueado pelo sandbox",
    icon: "🔒",
  },
  {
    id: "helper",
    title: "Manual do Piloto",
    description: "Use o comando 'help'",
    icon: "📖",
  },
];

// Popup notification when achievement unlocks
interface AchievementPopupProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -30, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onAnimationComplete={() => setTimeout(onClose, 3000)}
          className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 backdrop-blur-2xl shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)]"
        >
          <span className="text-2xl">{achievement.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-[10px] text-amber-400/80 uppercase tracking-[0.2em] font-mono">
                Conquista Desbloqueada
              </span>
            </div>
            <p className="text-sm font-semibold text-white mt-0.5">
              {achievement.title}
            </p>
            <p className="text-[11px] text-white/50 mt-0.5">
              {achievement.description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement panel (sidebar or overlay)
interface AchievementPanelProps {
  achievements: Achievement[];
  unlockedIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementPanel({ achievements, unlockedIds, isOpen, onClose }: AchievementPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-80 bg-[#0c0c0c]/95 backdrop-blur-2xl border-l border-white/[0.08] z-[160] p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/80">
                  Conquistas
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-white/30 hover:text-white/60 transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-white/30 font-mono mb-4">
              {unlockedIds.length}/{achievements.length} desbloqueadas
            </p>

            <div className="space-y-3">
              {achievements.map((ach) => {
                const unlocked = unlockedIds.includes(ach.id);
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      unlocked
                        ? "bg-amber-500/[0.06] border-amber-500/20"
                        : "bg-white/[0.02] border-white/[0.06] opacity-40"
                    }`}
                  >
                    <span className={`text-xl ${unlocked ? "" : "grayscale"}`}>
                      {ach.icon}
                    </span>
                    <div>
                      <p className={`text-xs font-semibold ${unlocked ? "text-white" : "text-white/50"}`}>
                        {ach.title}
                      </p>
                      <p className="text-[10px] text-white/40">
                        {ach.description}
                      </p>
                    </div>
                    {unlocked && (
                      <span className="ml-auto text-amber-400 text-xs">✓</span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
