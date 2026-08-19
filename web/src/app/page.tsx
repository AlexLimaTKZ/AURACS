"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gamepad2,
  RotateCcw,
  Settings,
  TerminalSquare,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { AchievementPanel, AchievementPopup, ACHIEVEMENTS } from "@/components/Achievements";
import { Aura } from "@/components/Aura";
import { GameWorld } from "@/components/GameWorld";
import { Hud } from "@/components/Hud";
import { ScreenShake } from "@/components/ScreenShake";
import { Starfield } from "@/components/Starfield";
import { Terminal } from "@/components/Terminal";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function Home() {
  const game = useGameEngine();
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  const lastTransmission = useMemo(() => {
    const relevant = [...game.logs]
      .reverse()
      .find((log) => log.type === "info" || log.type === "system" || log.type === "warning");
    return relevant?.content ?? "AURA aguardando telemetria da Nebulosa.";
  }, [game.logs]);

  const powerRestored = !["step-1", "step-1-b", "step-2"].includes(game.currentStep.id);

  useEffect(() => {
    if (!terminalOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTerminalOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [terminalOpen]);

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
              {game.isResuming ? "Carregando save da Nebulosa..." : "Inicializando deck jogável..."}
            </p>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <ScreenShake>
      <main className="relative min-h-screen overflow-hidden bg-[#02050a] text-white">
        <Starfield />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(8,145,178,0.10),transparent_42%)]" />

        <AnimatePresence>
          {game.alertFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-none fixed inset-0 z-[140] ${
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

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-3 py-3 md:px-6 md:py-5">
          <header className="mb-3 flex items-center justify-between gap-3 md:mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-300/15 bg-cyan-950/30 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
                <Gamepad2 className="h-5 w-5 text-cyan-300/80" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white md:text-xl">AURACS</h1>
                  <span className="rounded border border-cyan-300/15 bg-cyan-400/5 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-200/60">
                    Browser Game
                  </span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                  Nebulosa · Deck 01 · {game.currentStep.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTerminalOpen(true)}
                aria-label="Abrir terminal"
                className="hidden items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-950/25 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-cyan-100/65 transition hover:border-cyan-300/30 hover:bg-cyan-950/45 md:flex"
              >
                <TerminalSquare className="h-3.5 w-3.5" />
                Terminal
              </button>
              <button
                onClick={() => game.setShowAchievementPanel(true)}
                aria-label="Abrir conquistas"
                className="rounded-lg border border-white/[0.07] bg-black/30 p-2 text-amber-400/70 transition hover:bg-white/[0.05] hover:text-amber-300"
              >
                <Trophy className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowResetMenu(true)}
                aria-label="Abrir opções de reinício"
                className="rounded-lg border border-white/[0.07] bg-black/30 p-2 text-white/40 transition hover:bg-white/[0.05] hover:text-white/70"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="relative flex-1">
            <div className="relative mx-auto aspect-video w-full max-w-[1280px]">
              <GameWorld
                energy={game.energy}
                stepId={game.currentStep.id}
                terminalOpen={terminalOpen}
                onTerminalInteract={() => setTerminalOpen(true)}
              />

              <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-start justify-between gap-3 md:top-4 md:left-4 md:right-4">
                <div className="pointer-events-auto max-w-[620px] flex-1">
                  <Hud
                    energy={game.energy}
                    integrity={game.integrity}
                    inventory={game.inventory}
                    chapterId={game.currentChapterId}
                  />
                </div>

                <div
                  className={`hidden items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] backdrop-blur md:flex ${
                    powerRestored
                      ? "border-emerald-300/20 bg-emerald-950/45 text-emerald-200/75"
                      : "border-red-300/20 bg-red-950/45 text-red-200/75"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {powerRestored ? "Auxiliar online" : "Energia crítica"}
                </div>
              </div>

              <div className="pointer-events-none absolute bottom-3 left-3 max-w-[min(78vw,520px)] md:bottom-5 md:left-5">
                <div className="rounded-xl border border-cyan-300/10 bg-[#020814]/78 p-3 shadow-2xl backdrop-blur-xl md:p-4">
                  <div className="flex items-start gap-3">
                    <div className="hidden shrink-0 sm:block">
                      <Aura state={game.auraState} />
                    </div>
                    <div className="min-w-0">
                      <p className="mb-1 font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-300/45">
                        AURA // transmissão
                      </p>
                      <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-200/72 md:text-xs">
                        {lastTransmission}
                      </p>
                      <div className="mt-2 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.13em] text-white/30">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                        {game.currentStep.requiredCode
                          ? "Objetivo: encontre o terminal e execute o código"
                          : "Objetivo narrativo em andamento"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25 md:mt-4">
            <span>Vertical Slice · Capítulo 1</span>
            <span className="hidden sm:inline">Código → Sistema → Mundo → Consequência</span>
          </div>
        </div>

        <AnimatePresence>
          {terminalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[180] flex items-center justify-center bg-[#010409]/82 p-3 backdrop-blur-md md:p-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.22 }}
                className="w-full max-w-5xl"
              >
                <div className="mb-2 flex items-center justify-between rounded-t-xl border border-b-0 border-cyan-300/10 bg-[#06101b]/96 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <TerminalSquare className="h-4 w-4 text-cyan-300/70" />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/70">
                        Terminal físico · Deck 01
                      </p>
                      <p className="mt-0.5 text-[9px] text-white/30">
                        Seu código altera sistemas da nave em tempo real.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTerminalOpen(false)}
                    aria-label="Fechar terminal"
                    className="rounded-lg border border-white/[0.07] bg-white/[0.03] p-2 text-white/45 transition hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <Terminal
                  logs={game.logs}
                  onCommand={game.handleCommand}
                  onClear={game.handleClear}
                  isTyping={game.isTyping}
                  currentHint={game.currentStep.requiredCode}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showResetMenu && (
            <>
              <motion.button
                aria-label="Fechar opções de reinício"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetMenu(false)}
                className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reset-title"
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                className="fixed top-1/2 left-1/2 z-[210] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/95 p-6 shadow-2xl backdrop-blur-2xl"
              >
                <h2 id="reset-title" className="text-sm font-semibold text-white/90">
                  Opções de reinício
                </h2>
                <p className="mt-1 mb-5 text-[11px] text-white/40">
                  Reiniciar também sincroniza o estado visual da sala 2D.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      setShowResetMenu(false);
                      setTerminalOpen(false);
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
                      setTerminalOpen(false);
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
      </main>
    </ScreenShake>
  );
}
