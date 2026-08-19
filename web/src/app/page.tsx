"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RotateCcw, Settings, Trophy } from "lucide-react";
import { AchievementPanel, AchievementPopup, ACHIEVEMENTS } from "@/components/Achievements";
import { Aura } from "@/components/Aura";
import { Hud } from "@/components/Hud";
import { ScreenShake } from "@/components/ScreenShake";
import { Starfield } from "@/components/Starfield";
import { Terminal } from "@/components/Terminal";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function Home() {
  const game = useGameEngine();
  const [showResetMenu, setShowResetMenu] = useState(false);

  if (game.showSplash) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white">
        <Starfield />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex flex-col items-center gap-7 text-center"
        >
          <Aura state="speaking" />
          <div>
            <h1 className="bg-gradient-to-b from-white via-white/90 to-white/30 bg-clip-text text-4xl font-bold tracking-tighter text-transparent md:text-5xl">
              AURACS
            </h1>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-400/60 md:text-xs">
              Crônicas da Nebulosa
            </p>
          </div>
          <div className="w-52">
            <div className="h-0.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.3, ease: "easeInOut" }}
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500"
              />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
              {game.isResuming ? "Carregando progresso..." : "Inicializando sistemas..."}
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <ScreenShake>
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#080808] to-black p-4 text-white md:p-6">
        <Starfield />
        <div className="pointer-events-none absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05]" />
        <div className="pointer-events-none absolute top-[-20%] left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-cyan-500/[0.03] blur-[120px]" />

        <AnimatePresence>
          {game.alertFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-none fixed inset-0 z-50 ${
                game.alertFlash === "red"
                  ? "bg-red-500/10"
                  : game.alertFlash === "amber"
                    ? "bg-amber-500/10"
                    : "bg-cyan-500/10"
              }`}
            />
          )}
        </AnimatePresence>

        <AchievementPopup
          achievement={game.popupAchievement}
          onClose={() => game.setPopupAchievement(null)}
        />
        <AchievementPanel
          achievements={ACHIEVEMENTS}
          unlockedIds={game.unlockedAchievements}
          isOpen={game.showAchievementPanel}
          onClose={() => game.setShowAchievementPanel(false)}
        />

        <AnimatePresence>
          {showResetMenu && (
            <>
              <motion.button
                aria-label="Fechar opções de reinício"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetMenu(false)}
                className="fixed inset-0 z-[150] bg-black/65 backdrop-blur-sm"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-title"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                className="fixed top-1/2 left-1/2 z-[160] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/95 p-6 shadow-2xl backdrop-blur-2xl"
              >
                <h2 id="reset-title" className="text-sm font-semibold text-white/90">
                  Opções de reinício
                </h2>
                <p className="mt-1 mb-5 text-[11px] text-white/40">
                  O backend descarta a sessão anterior antes de iniciar a nova.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setShowResetMenu(false);
                      await game.handleResetChapter();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-left transition hover:border-amber-500/30 hover:bg-amber-500/[0.05]"
                  >
                    <RotateCcw className="h-4 w-4 text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold text-white/85">Reiniciar capítulo</p>
                      <p className="mt-0.5 text-[10px] text-white/35">Mantém as conquistas desbloqueadas.</p>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      setShowResetMenu(false);
                      await game.handleResetAll();
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-left transition hover:border-red-500/30 hover:bg-red-500/[0.05]"
                  >
                    <RotateCcw className="h-4 w-4 text-red-400" />
                    <div>
                      <p className="text-xs font-semibold text-white/85">Reiniciar tudo</p>
                      <p className="mt-0.5 text-[10px] text-white/35">Apaga todo o progresso local.</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="z-10 flex w-full max-w-5xl flex-col items-center gap-4 md:gap-5">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-4xl items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="hidden sm:block">
                <Aura state={game.auraState} />
              </div>
              <div>
                <h1 className="bg-gradient-to-b from-white to-white/50 bg-clip-text text-xl font-bold tracking-tighter text-transparent md:text-2xl">
                  AURACS
                </h1>
                <p className="font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-400/45">
                  {game.currentStep.id} · {game.currentStep.requiredCode ? "desafio ativo" : "narrativa"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => game.setShowAchievementPanel(true)}
                aria-label="Abrir conquistas"
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-amber-400/70 transition hover:bg-white/[0.06] hover:text-amber-400"
              >
                <Trophy className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowResetMenu(true)}
                aria-label="Abrir opções de reinício"
                className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white/70"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </motion.header>

          <Hud
            energy={game.energy}
            integrity={game.integrity}
            inventory={game.inventory}
            chapterId={game.currentChapterId}
          />

          <Terminal
            logs={game.logs}
            onCommand={game.handleCommand}
            onClear={game.handleClear}
            isTyping={game.isTyping}
            currentHint={game.currentStep.requiredCode}
          />
        </div>
      </main>
    </ScreenShake>
  );
}
