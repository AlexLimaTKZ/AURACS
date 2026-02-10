
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Terminal, Log } from "@/components/Terminal";
import { Aura } from "@/components/Aura";
import { Hud } from "@/components/Hud";
import { Starfield } from "@/components/Starfield";
import { ScreenShake, ScreenShakeRef } from "@/components/ScreenShake";
import { ChapterTransition } from "@/components/ChapterTransition";
import { AchievementPopup, AchievementPanel, ACHIEVEMENTS, Achievement } from "@/components/Achievements";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/store";
import { CHAPTER_1, ChapterStep, getAuraErrorHint } from "@/lib/chapters";
import { Trophy, RotateCcw, Settings } from "lucide-react";

const getTimestamp = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const createLog = (content: string, type: Log["type"] = "info"): Log => ({
  id: crypto.randomUUID(),
  type,
  content,
  timestamp: getTimestamp(),
});

export default function Home() {
  const store = useGameStore();
  const {
    energy, integrity, inventory, currentChapterId,
    currentStepId, unlockedAchievements, consecutiveSuccesses,
    updateEnergy, setStep, unlockAchievement: storeUnlockAchievement,
    setConsecutiveSuccesses, resetAll, resetChapter, _hasHydrated,
  } = store;

  const [currentStep, setCurrentStep] = useState<ChapterStep>(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
  const sessionIdRef = useRef(crypto.randomUUID());
  const [showSplash, setShowSplash] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const processedStepRef = useRef<string | null>(null);
  const shakeRef = useRef<ScreenShakeRef>(null);

  // Chapter transition state
  const [showChapterTransition, setShowChapterTransition] = useState(false);
  const [transitionTitle, setTransitionTitle] = useState("");
  const [transitionSubtitle, setTransitionSubtitle] = useState("");

  // Alert flash state
  const [alertFlash, setAlertFlash] = useState<string | null>(null);

  // Achievement popup
  const [popupAchievement, setPopupAchievement] = useState<Achievement | null>(null);
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);

  // Reset menu
  const [showResetMenu, setShowResetMenu] = useState(false);

  const [logs, setLogs] = useState<Log[]>([]);
  const [auraState, setAuraState] = useState<"idle" | "speaking" | "thinking" | "error">("idle");
  const [isTyping, setIsTyping] = useState(false);

  const addLog = useCallback((content: string, type: Log["type"] = "info") => {
    setLogs((prev) => [...prev, createLog(content, type)]);
  }, []);

  // Unlock achievement (using store + popup)
  const unlockAchievement = useCallback((id: string) => {
    if (unlockedAchievements.includes(id)) return;
    storeUnlockAchievement(id);
    const achievement = ACHIEVEMENTS.find((a) => a.id === id);
    if (achievement) setPopupAchievement(achievement);
  }, [unlockedAchievements, storeUnlockAchievement]);

  // Trigger screen effects
  const triggerAlert = useCallback((color: string = "red") => {
    setAlertFlash(color);
    setTimeout(() => setAlertFlash(null), 600);
    shakeRef.current?.shake("medium");
  }, []);

  const triggerError = useCallback(() => {
    shakeRef.current?.shake("light");
    shakeRef.current?.pulse();
  }, []);

  // Typewriter effect
  const typewriterAura = useCallback((message: string, callback?: () => void) => {
    setAuraState("speaking");
    const fullText = `[AURA]: ${message}`;
    const logId = crypto.randomUUID();
    const timestamp = getTimestamp();
    setLogs((prev) => [...prev, { id: logId, type: "system", content: "", timestamp }]);

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setLogs((prev) =>
        prev.map((log) =>
          log.id === logId ? { ...log, content: fullText.slice(0, i) } : log
        )
      );
      if (i >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          setAuraState("idle");
          callback?.();
        }, 500);
      }
    }, 25);
  }, []);

  // Process a narrative step
  const processStep = useCallback((step: ChapterStep) => {
    if (processedStepRef.current === step.id) return;
    processedStepRef.current = step.id;

    setCurrentStep(step);
    setStep(step.id); // Persist to store

    step.narrative.forEach((line, index) => {
      setTimeout(() => {
        const isCode = line.includes("=") && line.includes(";") && !line.startsWith("Sua Tarefa");
        addLog(line, isCode ? "code" : "info");
      }, index * 800 + 300);
    });

    if (step.choices) {
      setTimeout(() => {
        addLog("═══ Escolha seu caminho ═══", "warning");
        step.choices!.forEach((choice) => {
          addLog(`  → ${choice.label}`, "warning");
        });
        addLog("Use o código: int escolha = 1; ou int escolha = 2;", "info");
      }, step.narrative.length * 800 + 300);
    }

    if (step.auraMessage) {
      setTimeout(() => {
        typewriterAura(step.auraMessage!, () => {
          if (!step.requiredCode && !step.choices && step.nextStepId) {
            setTimeout(() => {
              const nextStep = CHAPTER_1.steps[step.nextStepId!];
              if (nextStep) processStep(nextStep);
            }, 2000);
          }
        });
      }, step.narrative.length * 800 + 800);
    } else if (!step.requiredCode && !step.choices && step.nextStepId) {
      setTimeout(() => {
        const nextStep = CHAPTER_1.steps[step.nextStepId!];
        if (nextStep) processStep(nextStep);
      }, step.narrative.length * 800 + 1500);
    }
  }, [addLog, typewriterAura, setStep]);

  // Wait for hydration, then decide: new game or resume
  useEffect(() => {
    if (!_hasHydrated) return;

    const savedStepId = currentStepId;
    const savedStep = CHAPTER_1.steps[savedStepId];

    // Check if there's real progress (not at the beginning)
    const hasProgress = savedStepId !== "step-1" && savedStep;

    if (hasProgress) {
      setIsResuming(true);
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
      setGameStarted(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [_hasHydrated, currentStepId]);

  // Start game
  useEffect(() => {
    if (!gameStarted || !_hasHydrated) return;

    if (isResuming) {
      const savedStep = CHAPTER_1.steps[currentStepId];
      addLog("RETOMANDO SISTEMAS DA NAVE...", "system");
      addLog(`ENERGIA ATUAL: ${energy}%`, "system");
      addLog(`PROGRESSO CARREGADO: ${currentStepId}`, "system");

      const timer = setTimeout(() => {
        processedStepRef.current = null;
        processStep(savedStep);
      }, 1500);
      return () => clearTimeout(timer);
    } else {
      // Fresh game
      addLog("INICIANDO SISTEMAS DA NAVE...", "system");
      addLog("ENERGIA ATUAL: 100%", "system");

      const timer = setTimeout(() => {
        processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
      }, 1500);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  const handleClear = () => {
    setLogs([createLog("Terminal limpo.", "system")]);
  };

  // Branching resolver
  const resolveBranch = (cmd: string, step: ChapterStep): string | null => {
    if (!step.choices) return null;
    const match = cmd.match(/=\s*(\d+)/);
    if (!match) return null;
    const choiceNum = parseInt(match[1]);
    if (choiceNum === 1 && step.choices[0]) return step.choices[0].nextStepId;
    if (choiceNum === 2 && step.choices[1]) return step.choices[1].nextStepId;
    return null;
  };

  // Reset handlers
  const handleResetAll = () => {
    resetAll();
    sessionIdRef.current = crypto.randomUUID();
    setLogs([]);
    processedStepRef.current = null;
    setShowResetMenu(false);
    setCurrentStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    setAuraState("idle");

    addLog("════════════════════════════", "system");
    addLog("⟳ REINICIALIZAÇÃO COMPLETA", "system");
    addLog("  Todos os dados foram apagados.", "system");
    addLog("════════════════════════════", "system");

    // Also reset API session
    fetch("http://localhost:5000/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    }).catch(() => {});

    setTimeout(() => {
      processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    }, 2000);
  };

  const handleResetChapter = () => {
    resetChapter();
    sessionIdRef.current = crypto.randomUUID();
    setLogs([]);
    processedStepRef.current = null;
    setShowResetMenu(false);
    setCurrentStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    setAuraState("idle");

    addLog("════════════════════════════", "system");
    addLog("⟳ CAPÍTULO REINICIADO", "system");
    addLog("  Energia restaurada. Conquistas mantidas.", "system");
    addLog("════════════════════════════", "system");

    fetch("http://localhost:5000/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionIdRef.current }),
    }).catch(() => {});

    setTimeout(() => {
      processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    }, 2000);
  };

  const handleCommand = async (cmd: string) => {
    if (cmd === "__HELP__") {
      addLog("> help", "info");
      addLog("═══ Comandos Disponíveis ═══", "system");
      addLog("  help       — Mostra esta lista de comandos", "system");
      addLog("  clear      — Limpa o terminal", "system");
      addLog("  hint       — Mostra uma dica sobre a tarefa atual", "system");
      addLog("  conquistas — Abre o painel de conquistas", "system");
      addLog("  (código C#) — Executa o código digitado", "system");
      addLog("══════════════════════════", "system");
      unlockAchievement("helper");
      return;
    }

    if (cmd === "__HINT__") {
      addLog("> hint", "info");
      if (currentStep.requiredCode) {
        typewriterAura(`Dica: O que eu preciso é algo como \`${currentStep.requiredCode}\`. Tente digitar o código mostrado acima.`);
      } else {
        typewriterAura("Nenhuma tarefa de código pendente no momento. Aguarde as instruções.");
      }
      return;
    }

    if (cmd.toLowerCase() === "conquistas" || cmd.toLowerCase() === "achievements") {
      setShowAchievementPanel(true);
      return;
    }

    addLog(`> ${cmd}`, "info");
    setAuraState("thinking");
    setIsTyping(true);
    unlockAchievement("first_command");

    try {
      const response = await fetch("http://localhost:5000/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cmd,
          sessionId: sessionIdRef.current,
          context: { energy },
        }),
      });

      const data = await response.json();
      setIsTyping(false);
      setAuraState("idle");

      if (data.success) {
        data.logs.forEach((log: string) => addLog(log, "system"));

        if (currentStep.requiredCode || currentStep.choices) {
          const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();
          const normalizedCmd = normalize(cmd);
          let matched = false;

          if (currentStep.requiredCode) {
            const normalizedRequired = normalize(currentStep.requiredCode);
            matched = normalizedCmd.includes(normalizedRequired);
          }

          if (matched) {
            addLog("✓ Comando verificado com sucesso.", "success");
            const newSuccesses = consecutiveSuccesses + 1;
            setConsecutiveSuccesses(newSuccesses);
            if (newSuccesses >= 3) unlockAchievement("no_errors");

            if (currentStep.achievementId) {
              unlockAchievement(currentStep.achievementId);
            }

            if (currentStep.onSuccess) {
              currentStep.onSuccess({ updateEnergy });
              addLog("⚡ ATUALIZAÇÃO DE SISTEMA: Energia ajustada.", "warning");
              triggerAlert("amber");
            }

            let nextId = currentStep.nextStepId;
            if (currentStep.choices) {
              const branchId = resolveBranch(cmd, currentStep);
              if (branchId) {
                nextId = branchId;
                const choiceNum = cmd.match(/=\s*(\d+)/)?.[1];
                addLog(`Escolha registrada: Opção ${choiceNum}`, "success");
              } else {
                addLog("Valor inválido. Use int escolha = 1; ou int escolha = 2;", "warning");
                return;
              }
            }

            if (nextId) {
              const nextStep = CHAPTER_1.steps[nextId];
              if (nextStep && nextStep.id === "step-end") {
                setTransitionTitle("Capítulo 1 — O Despertar");
                setTransitionSubtitle("Sistemas estabilizando...");
                setShowChapterTransition(true);
              }

              processedStepRef.current = null;
              setTimeout(() => {
                if (nextStep) processStep(nextStep);
              }, nextStep?.id === "step-end" ? 3500 : 1500);
            }
          } else {
            addLog("O código rodou, mas não era exatamente o que eu pedi. Use 'hint' se precisar de ajuda.", "warning");
          }
        }
      } else {
        setAuraState("error");
        triggerError();
        setConsecutiveSuccesses(0);
        data.logs.forEach((log: string) => addLog(log, "error"));

        const errorText = data.logs.join(" ");
        const hint = getAuraErrorHint(errorText);
        if (hint) {
          setTimeout(() => typewriterAura(`💡 ${hint}`), 800);
        }
        if (errorText.includes("SEGURANÇA") || errorText.includes("bloqueado")) {
          unlockAchievement("hacker");
        }
        setTimeout(() => setAuraState("idle"), 3000);
      }
    } catch {
      setIsTyping(false);
      setAuraState("error");
      triggerError();
      addLog("[ERRO DE CONEXÃO]: Não foi possível contatar os sistemas centrais (.NET API Offline).", "error");
      setTimeout(() => setAuraState("idle"), 3000);
    }
  };

  // Splash Screen  
  if (showSplash) {
    return (
      <main className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        <Starfield />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.08)_0%,_transparent_70%)]" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center gap-8 z-10"
        >
          <Aura state="speaking" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/30">
              AURACS
            </h1>
            <p className="text-[10px] md:text-xs text-cyan-400/60 uppercase tracking-[0.3em] mt-2 font-mono">
              Crônicas da Nebulosa
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="w-48"
          >
            <div className="h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2.5, delay: 1, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              />
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0.5, 1] }}
              transition={{ delay: 1.2, duration: 2 }}
              className="text-[10px] text-white/30 text-center mt-2 font-mono tracking-widest uppercase"
            >
              {isResuming ? "Carregando progresso..." : "Inicializando sistemas..."}
            </motion.p>
          </motion.div>
        </motion.div>
      </main>
    );
  }

  return (
    <ScreenShake ref={shakeRef}>
      <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#080808] to-black text-white flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">

        <Starfield />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.05] pointer-events-none" />
        <div className="absolute top-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="absolute bottom-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[120px] pointer-events-none" />

        {/* Alert Flash */}
        <AnimatePresence>
          {alertFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={`fixed inset-0 pointer-events-none z-50 ${
                alertFlash === "red" ? "bg-red-500/10"
                  : alertFlash === "amber" ? "bg-amber-500/8"
                  : "bg-cyan-500/8"
              }`}
            />
          )}
        </AnimatePresence>

        {/* Chapter Transition */}
        <ChapterTransition
          isActive={showChapterTransition}
          chapterTitle={transitionTitle}
          chapterSubtitle={transitionSubtitle}
          onComplete={() => setShowChapterTransition(false)}
        />

        {/* Achievement Popup */}
        <AchievementPopup
          achievement={popupAchievement}
          onClose={() => setPopupAchievement(null)}
        />

        {/* Achievement Panel */}
        <AchievementPanel
          achievements={ACHIEVEMENTS}
          unlockedIds={unlockedAchievements}
          isOpen={showAchievementPanel}
          onClose={() => setShowAchievementPanel(false)}
        />

        {/* Reset Menu */}
        <AnimatePresence>
          {showResetMenu && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowResetMenu(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] w-[360px] rounded-xl bg-[#0c0c0c]/95 backdrop-blur-2xl border border-white/[0.08] p-6 shadow-[0_0_60px_-15px_rgba(6,182,212,0.2)]"
              >
                <h3 className="text-sm font-semibold text-white/90 mb-1 tracking-tight">
                  Opções de Reinício
                </h3>
                <p className="text-[11px] text-white/40 mb-5">
                  Escolha como deseja reiniciar o jogo.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleResetChapter}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/[0.05] transition-all group text-left"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400/60 group-hover:text-amber-400 transition-colors shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                        Reiniciar Capítulo
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Recomeça o capítulo atual. Conquistas são mantidas.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={handleResetAll}
                    className="w-full flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:border-red-500/30 hover:bg-red-500/[0.05] transition-all group text-left"
                  >
                    <RotateCcw className="w-4 h-4 text-red-400/60 group-hover:text-red-400 transition-colors shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                        Reiniciar Tudo
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Apaga todo o progresso e recomeça do zero.
                      </p>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => setShowResetMenu(false)}
                  className="w-full mt-4 text-center text-[10px] text-white/30 hover:text-white/50 transition-colors uppercase tracking-widest font-mono py-2"
                >
                  Cancelar
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="z-10 w-full max-w-5xl flex flex-col gap-4 md:gap-5 items-center">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center gap-2 md:gap-3"
          >
            <div className="hidden sm:block">
              <Aura state={auraState} />
            </div>
            <div className="sm:hidden flex items-center gap-2">
              <motion.div
                animate={{
                  scale: auraState === "speaking" ? [1, 1.3, 1] : [1, 1.05, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{ duration: auraState === "speaking" ? 0.5 : 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full"
                style={{
                  background: auraState === "error" ? "#ef4444" :
                              auraState === "thinking" ? "#f59e0b" :
                              auraState === "speaking" ? "#10b981" : "#06b6d4",
                  boxShadow: `0 0 8px ${
                    auraState === "error" ? "rgba(239,68,68,0.5)" :
                    auraState === "speaking" ? "rgba(16,185,129,0.5)" : "rgba(6,182,212,0.3)"
                  }`,
                }}
              />
              <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">AURA</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">
              CRÔNICAS DA NEBULOSA
            </h1>
            <p className="text-[9px] md:text-[10px] text-white/30 uppercase tracking-[0.3em] font-mono">
              Sistema Operacional de Navegação v2.4
            </p>
          </motion.div>

          {/* HUD + Action buttons */}
          <div className="w-full flex items-center gap-2 md:gap-3 max-w-4xl mx-auto">
            <div className="flex-1 min-w-0">
              <Hud
                energy={energy}
                integrity={integrity}
                inventory={inventory}
                chapterId={currentChapterId}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAchievementPanel(true)}
                className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:border-amber-500/20 transition-all group"
                title="Conquistas"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400/60 group-hover:text-amber-400 transition-colors" />
                <span className="text-[10px] font-mono text-white/30 group-hover:text-white/50 transition-colors hidden sm:inline">
                  {unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowResetMenu(true)}
                className="flex items-center gap-1.5 px-2.5 py-2.5 rounded-lg bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] hover:border-white/20 transition-all group"
                title="Reiniciar"
              >
                <Settings className="w-3.5 h-3.5 text-white/30 group-hover:text-white/50 transition-colors" />
              </motion.button>
            </div>
          </div>

          {/* Terminal */}
          <div className="w-full">
            <Terminal
              logs={logs}
              onCommand={handleCommand}
              isTyping={isTyping}
              onClear={handleClear}
              currentHint={currentStep.requiredCode}
            />
          </div>
        </div>
      </main>
    </ScreenShake>
  );
}
