"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gamepad2,
  Home as HomeIcon,
  RotateCcw,
  Settings,
  TerminalSquare,
  Trophy,
  X,
  Zap,
  PowerOff,
  Swords,
} from "lucide-react";
import { AchievementPanel, AchievementPopup, ACHIEVEMENTS } from "@/components/Achievements";
import { Aura } from "@/components/Aura";
import { ChapterVictoryModal } from "@/components/ChapterVictoryModal";
import { ChaptersModal } from "@/components/ChaptersModal";
import { GameOverModal } from "@/components/GameOverModal";
import { GameWorld } from "@/components/GameWorld";
import { KatanaCinematicModal } from "@/components/KatanaCinematicModal";
import { Hud } from "@/components/Hud";
import { MainMenu } from "@/components/MainMenu";
import { ScreenShake } from "@/components/ScreenShake";
import { Starfield } from "@/components/Starfield";
import { Terminal } from "@/components/Terminal";
import { useGameEngine } from "@/hooks/useGameEngine";

export default function Home() {
  const game = useGameEngine();
  const [viewMode, setViewMode] = useState<"menu" | "game" | "exit">("menu");
  const [showResetMenu, setShowResetMenu] = useState(false);
  const [showChaptersModal, setShowChaptersModal] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [victoryDismissed, setVictoryDismissed] = useState(false);

  const lastTransmission = useMemo(() => {
    const relevant = [...game.logs]
      .reverse()
      .find((log) => log.type === "info" || log.type === "system" || log.type === "warning");
    return relevant?.content ?? "AURA aguardando telemetria da Nebulosa.";
  }, [game.logs]);

  const powerRestored = !["step-1", "step-1-b", "step-2"].includes(game.currentStep.id);
  const hasSavedProgress = game.currentStepId !== "step-1" || game.unlockedAchievements.length > 0 || game.inventory.length > 0;
  const isCombatDeck = game.currentChapterId === "chapter-2";

  useEffect(() => {
    if (!terminalOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTerminalOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [terminalOpen]);

  // 1. TELA DE SAÍDA / LOGOUT SCI-FI
  if (viewMode === "exit") {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black text-white select-none">
        <Starfield />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(239,68,68,0.06)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="z-10 flex max-w-md flex-col items-center gap-6 p-6 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/30 bg-red-950/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <PowerOff className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Sessão Encerrada
            </h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-red-300/70">
              Link Neural AURACS // Desconectado
            </p>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">
            A nave espacial Nebulosa entrou em modo de hibernação. Seu progresso foi salvo com segurança. Você pode fechar esta aba do navegador.
          </p>
          <button
            type="button"
            onClick={() => setViewMode("menu")}
            className="flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-950/50 px-6 py-3 font-mono text-xs font-semibold tracking-wider text-cyan-200 shadow-[0_0_30px_rgba(34,211,238,0.15)] transition hover:border-cyan-300 hover:bg-cyan-900/60 hover:text-white"
          >
            <HomeIcon className="h-4 w-4" />
            Voltar ao Menu Principal
          </button>
        </motion.div>
      </main>
    );
  }

  // 2. TELA DO MENU PRINCIPAL
  if (viewMode === "menu") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-[#02050a] text-white">
        <Starfield />
        <MainMenu
          hasSave={hasSavedProgress}
          savedStepId={game.currentStepId}
          savedEnergy={game.energy}
          unlockedAchievementsCount={game.unlockedAchievements.length}
          totalAchievementsCount={ACHIEVEMENTS.length}
          onNewGame={() => {
            game.startNewGame();
            setViewMode("game");
          }}
          onContinue={() => {
            game.resumeSavedGame();
            setViewMode("game");
          }}
          onOpenChapters={() => setShowChaptersModal(true)}
          onOpenAchievements={() => game.setShowAchievementPanel(true)}
          onResetSave={async () => {
            await game.handleResetAll();
          }}
          onExit={() => setViewMode("exit")}
        />

        {/* Modal de Seleção de Capítulos */}
        <ChaptersModal
          isOpen={showChaptersModal}
          unlockedChapters={game.unlockedChapters}
          currentChapterId={game.currentChapterId}
          hasKatana={game.inventory.some((i) => i.toLowerCase().includes("katana"))}
          onClose={() => setShowChaptersModal(false)}
          onSelectChapter={(chapterId) => {
            game.selectChapter(chapterId);
            setViewMode("game");
          }}
        />

        <AchievementPanel
          achievements={ACHIEVEMENTS}
          unlockedIds={game.unlockedAchievements}
          isOpen={game.showAchievementPanel}
          onClose={() => game.setShowAchievementPanel(false)}
        />
      </main>
    );
  }

  // 3. TELA DE JOGABILIDADE (GAMEPLAY)
  return (
    <ScreenShake>
      <main className="relative min-h-screen overflow-hidden bg-[#02050a] text-white">
        <Starfield />
        <div className={`pointer-events-none absolute inset-0 transition duration-700 ${
          isCombatDeck
            ? "bg-[radial-gradient(circle_at_50%_20%,rgba(239,68,68,0.12),transparent_48%)]"
            : "bg-[radial-gradient(circle_at_50%_20%,rgba(8,145,178,0.10),transparent_42%)]"
        }`} />

        <AnimatePresence>
          {game.alertFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-none fixed inset-0 z-[140] ${
                game.alertFlash === "red"
                  ? "bg-red-500/20"
                  : game.alertFlash === "amber"
                    ? "bg-amber-500/15"
                    : "bg-cyan-500/15"
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
          {/* Cabeçalho do Jogo com Botão de Voltar ao Menu */}
          <header className="mb-3 flex items-center justify-between gap-3 md:mb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl border shadow-[0_0_35px_rgba(34,211,238,0.08)] ${
                isCombatDeck ? "border-red-500/30 bg-red-950/40 text-red-300" : "border-cyan-300/15 bg-cyan-950/30 text-cyan-300/80"
              }`}>
                {isCombatDeck ? <Swords className="h-5 w-5" /> : <Gamepad2 className="h-5 w-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight text-white md:text-xl">AURACS</h1>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.18em] ${
                    isCombatDeck
                      ? "border-red-500/30 bg-red-950/50 text-red-200"
                      : "border-cyan-300/15 bg-cyan-400/5 text-cyan-200/60"
                  }`}>
                    {isCombatDeck ? "Deck 02 · Quarentena" : "Deck 01 · Core"}
                  </span>
                </div>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
                  {game.currentStep.id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão Menu Principal */}
              <button
                type="button"
                onClick={() => setViewMode("menu")}
                aria-label="Voltar ao Menu Principal"
                className="flex items-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-950/30 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-cyan-200/80 transition hover:border-cyan-400/40 hover:bg-cyan-900/40 hover:text-cyan-100"
              >
                <HomeIcon className="h-3.5 w-3.5" />
                <span>Menu</span>
              </button>

              {/* Botão Terminal */}
              <button
                type="button"
                onClick={() => setTerminalOpen(true)}
                aria-label="Abrir terminal"
                className="hidden items-center gap-2 rounded-lg border border-cyan-300/15 bg-cyan-950/25 px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-cyan-100/65 transition hover:border-cyan-300/30 hover:bg-cyan-950/45 md:flex"
              >
                <TerminalSquare className="h-3.5 w-3.5" />
                Terminal
              </button>

              {/* Conquistas */}
              <button
                type="button"
                onClick={() => game.setShowAchievementPanel(true)}
                aria-label="Abrir conquistas"
                className="rounded-lg border border-white/[0.07] bg-black/30 p-2 text-amber-400/70 transition hover:bg-white/[0.05] hover:text-amber-300"
              >
                <Trophy className="h-4 w-4" />
              </button>

              {/* Reinício Rápido */}
              <button
                type="button"
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
                chapterId={game.currentChapterId}
                inventory={game.inventory}
                terminalOpen={terminalOpen}
                onTerminalInteract={() => setTerminalOpen(true)}
                onOpenChest={game.openChest}
              />

              <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-start justify-between gap-3 md:top-4 md:left-4 md:right-4">
                <div className="pointer-events-auto max-w-[660px] flex-1">
                  <Hud
                    energy={game.energy}
                    integrity={game.integrity}
                    inventory={game.inventory}
                    chapterId={game.currentChapterId}
                    lives={game.lives}
                  />
                </div>

                <div
                  className={`hidden items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.16em] backdrop-blur md:flex ${
                    isCombatDeck
                      ? "border-red-400/30 bg-red-950/60 text-red-200"
                      : powerRestored
                        ? "border-emerald-300/20 bg-emerald-950/45 text-emerald-200/75"
                        : "border-red-300/20 bg-red-950/45 text-red-200/75"
                  }`}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {isCombatDeck ? "Alerta de Combate" : powerRestored ? "Auxiliar online" : "Energia crítica"}
                </div>
              </div>

              {/* Caixa de Diálogo AURA Transmissão */}
              <div className="pointer-events-none absolute bottom-3 left-3 max-w-[min(82vw,480px)] md:bottom-4 md:left-4">
                <div className="rounded-2xl border border-cyan-400/25 bg-[#020814]/92 p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-2xl md:p-4">
                  <div className="flex items-start gap-3">
                    <div className="hidden shrink-0 sm:block">
                      <Aura state={game.auraState} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-cyan-300/60">
                          AURA // Transmissão de Bordo
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[7px] text-cyan-400/50">
                          <span className="h-1 w-1 rounded-full bg-cyan-400 animate-ping" />
                          ONLINE
                        </span>
                      </div>
                      <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-100/90 md:text-xs">
                        {lastTransmission}
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-2.5 py-1.5 font-mono text-[8px] uppercase tracking-[0.13em] text-cyan-200/70">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                        <span className="truncate">
                          {game.currentStep.requiredCode
                            ? `Objetivo: Execute ${game.currentStep.requiredCode}`
                            : "Objetivo: Acompanhe as orientações da AURA"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25 md:mt-4">
            <span>{isCombatDeck ? "Deck 02: Quarentena · Combate com Katana" : "Deck 01: Core · Sintaxe C#"}</span>
            <span className="hidden sm:inline">Código → Sistema → Mundo → Consequência</span>
          </div>
        </div>

        {/* Modal do Terminal de Código */}
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
                        {isCombatDeck ? "Terminal de Combate // Katana Link" : "Terminal Físico · Deck 01"}
                      </p>
                      <p className="mt-0.5 text-[9px] text-white/30">
                        {isCombatDeck ? "Digite os comandos dos monstros para desferir cortes de plasma." : "Seu código altera sistemas da nave em tempo real."}
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

        {/* Modal de Reinício Rápido no Jogo */}
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
                className="fixed top-1/2 left-1/2 z-[210] w-[min(92vw,380px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/[0.08] bg-[#0c0c0c]/95 p-6 shadow-2xl backdrop-blur-2xl text-left"
              >
                <h2 id="reset-title" className="text-sm font-semibold text-white/90">
                  Opções de reinício
                </h2>
                <p className="mt-1 mb-5 text-[11px] text-white/40">
                  Reiniciar também sincroniza o estado visual da sala 2D.
                </p>
                <div className="space-y-3">
                  <button
                    type="button"
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
                    type="button"
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

        {/* Modal de Vitória do Capítulo 1 */}
        <AnimatePresence>
          {game.currentStep.id === "step-end" && !victoryDismissed && (
            <ChapterVictoryModal
              energy={game.energy}
              integrity={game.integrity}
              unlockedAchievementsCount={game.unlockedAchievements.length}
              totalAchievementsCount={ACHIEVEMENTS.length}
              hasKatana={game.inventory.some((i) => i.toLowerCase().includes("katana"))}
              onAdvanceToChapter2={() => {
                const ok = game.advanceToChapter2();
                if (ok) {
                  setVictoryDismissed(true);
                }
              }}
              onReplay={() => {
                game.startNewGame();
                setVictoryDismissed(false);
              }}
              onGoToMenu={() => {
                setViewMode("menu");
                setVictoryDismissed(false);
              }}
              onClose={() => setVictoryDismissed(true)}
            />
          )}
        </AnimatePresence>

        {/* Modal Cinemático da Katana (Estilo Zelda Master Sword) */}
        <AnimatePresence>
          {game.showKatanaCinematic && (
            <KatanaCinematicModal
              onClose={() => {
                game.setShowKatanaCinematic(false);
              }}
            />
          )}
        </AnimatePresence>

        {/* Modal de Game Over (Derrota no Combate do Capítulo 2) */}
        <AnimatePresence>
          {game.isGameOver && (
            <GameOverModal
              onRestart={() => {
                game.restartAfterGameOver();
              }}
              onGoToMenu={() => {
                game.restartAfterGameOver();
                setViewMode("menu");
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </ScreenShake>
  );
}
