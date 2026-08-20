"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, Achievement } from "@/components/Achievements";
import { Log } from "@/components/Terminal";
import { ALL_CHAPTERS, CHAPTER_1, CHAPTER_2, ChapterStep, getAuraErrorHint } from "@/lib/chapters";
import { resetCodeSession, runCode } from "@/lib/api";
import { useGameStore } from "@/lib/store";
import { useNarrativeScheduler } from "./useNarrativeScheduler";

export type AuraState = "idle" | "speaking" | "thinking" | "error";

const getTimestamp = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

const createLog = (content: string, type: Log["type"] = "info"): Log => ({
  id: crypto.randomUUID(),
  type,
  content,
  timestamp: getTimestamp(),
});

export function useGameEngine() {
  const store = useGameStore();
  const {
    energy,
    integrity,
    inventory,
    currentChapterId,
    currentStepId,
    unlockedChapters,
    unlockedAchievements,
    consecutiveSuccesses,
    updateEnergy,
    addItem,
    setChapter,
    setStep,
    unlockChapter,
    unlockAchievement: persistAchievement,
    setConsecutiveSuccesses,
    resetAll,
    resetChapter,
    _hasHydrated,
  } = store;

  const scheduler = useNarrativeScheduler();
  const sessionIdRef = useRef(crypto.randomUUID());
  const processedStepRef = useRef<string | null>(null);

  const [logs, setLogs] = useState<Log[]>([]);
  const [currentStep, setCurrentStep] = useState<ChapterStep>(
    (ALL_CHAPTERS[currentChapterId] ?? CHAPTER_1).steps[currentStepId] ?? CHAPTER_1.steps[CHAPTER_1.initialStepId]
  );
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showKatanaCinematic, setShowKatanaCinematic] = useState(false);
  const [auraState, setAuraState] = useState<AuraState>("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [popupAchievement, setPopupAchievement] = useState<Achievement | null>(null);
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);
  const [alertFlash, setAlertFlash] = useState<"red" | "amber" | "cyan" | null>(null);

  const addLog = useCallback((content: string, type: Log["type"] = "info") => {
    setLogs((previous) => [...previous, createLog(content, type)]);
  }, []);

  const unlockAchievement = useCallback(
    (id: string) => {
      if (unlockedAchievements.includes(id)) return;
      persistAchievement(id);
      const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id);
      if (achievement) setPopupAchievement(achievement);
    },
    [persistAchievement, unlockedAchievements]
  );

  const flash = useCallback((kind: "red" | "amber" | "cyan") => {
    setAlertFlash(kind);
    scheduler.schedule(() => setAlertFlash(null), 600);
  }, [scheduler]);

  const speak = useCallback(
    (message: string, onComplete?: () => void) => {
      setAuraState("speaking");
      const fullText = `[AURA]: ${message}`;
      const logId = crypto.randomUUID();
      const timestamp = getTimestamp();
      let position = 0;

      setLogs((previous) => [
        ...previous,
        { id: logId, type: "system", content: "", timestamp },
      ]);

      const interval = scheduler.repeat(() => {
        position += 1;
        setLogs((previous) =>
          previous.map((log) =>
            log.id === logId ? { ...log, content: fullText.slice(0, position) } : log
          )
        );

        if (position >= fullText.length) {
          scheduler.stopRepeat(interval);
          scheduler.schedule(() => {
            setAuraState("idle");
            onComplete?.();
          }, 350);
        }
      }, 20);
    },
    [scheduler]
  );

  const processStep = useCallback(
    (step: ChapterStep) => {
      if (processedStepRef.current === step.id) return;
      processedStepRef.current = step.id;
      setCurrentStep(step);
      setStep(step.id);

      // Passos puramente narrativos representam consequências já escolhidas no passo anterior.
      // Seus efeitos precisam ser aplicados ao entrar no passo, antes da progressão automática.
      if (!step.requiredCode && !step.choices) {
        if (step.achievementId) unlockAchievement(step.achievementId);
        if (step.onSuccess) {
          step.onSuccess({ updateEnergy });
          flash("amber");
        }
      }

      step.narrative.forEach((line, index) => {
        scheduler.schedule(() => {
          const isCode = line.includes("=") && line.includes(";") && !line.startsWith("Sua Tarefa");
          addLog(line, isCode ? "code" : "info");
        }, index * 550 + 200);
      });

      if (step.choices) {
        scheduler.schedule(() => {
          addLog("═══ Escolha seu caminho ═══", "warning");
          step.choices?.forEach((choice) => addLog(`  → ${choice.label}`, "warning"));
          addLog("Use: int escolha = 1; ou int escolha = 2;", "info");
        }, step.narrative.length * 550 + 250);
      }

      const moveAutomatically = () => {
        if (!step.requiredCode && !step.choices && step.nextStepId) {
          scheduler.schedule(() => {
            const nextStep = CHAPTER_1.steps[step.nextStepId!];
            if (nextStep) {
              processedStepRef.current = null;
              processStep(nextStep);
            }
          }, 900);
        }
      };

      if (step.auraMessage) {
        scheduler.schedule(
          () => speak(step.auraMessage!, moveAutomatically),
          step.narrative.length * 550 + 450
        );
      } else {
        moveAutomatically();
      }
    },
    [addLog, flash, scheduler, setStep, speak, unlockAchievement, updateEnergy]
  );

  const resetRemoteSession = useCallback(async () => {
    const oldSessionId = sessionIdRef.current;
    sessionIdRef.current = crypto.randomUUID();
    try {
      await resetCodeSession(oldSessionId);
    } catch {
      // A sessão possui TTL no backend; falhar no reset remoto não impede o reset local.
    }
  }, []);

  const startFromBeginning = useCallback(() => {
    scheduler.clearAll();
    processedStepRef.current = null;
    setCurrentStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    setAuraState("idle");
    setLogs([
      createLog("════════════════════════════", "system"),
      createLog("⟳ SISTEMAS REINICIALIZADOS", "system"),
      createLog("════════════════════════════", "system"),
    ]);
    scheduler.schedule(() => processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]), 700);
  }, [processStep, scheduler]);

  const handleResetAll = useCallback(async () => {
    resetAll();
    await resetRemoteSession();
    startFromBeginning();
  }, [resetAll, resetRemoteSession, startFromBeginning]);

  const handleResetChapter = useCallback(async () => {
    resetChapter();
    await resetRemoteSession();
    startFromBeginning();
  }, [resetChapter, resetRemoteSession, startFromBeginning]);

  const advanceAfterSuccess = useCallback(
    (nextId?: string) => {
      if (!nextId) return;
      const chapter = ALL_CHAPTERS[currentChapterId] ?? CHAPTER_1;
      const nextStep = chapter.steps[nextId];
      if (!nextStep) return;

      processedStepRef.current = null;
      scheduler.schedule(() => processStep(nextStep), ["step-end", "ch2-end"].includes(nextStep.id) ? 1_500 : 800);
    },
    [currentChapterId, processStep, scheduler]
  );

  const registerCombatDamage = useCallback(() => {
    const isCombat = currentChapterId === "chapter-2" || currentStep.id.startsWith("ch2-");
    if (!isCombat) return;

    setLives((prev) => {
      const nextLives = Math.max(0, prev - 1);
      if (nextLives <= 0) {
        setIsGameOver(true);
        addLog("💥 [SINAL VITAL PERDIDO]: Kael sofreu dano fatal! Game Over.", "error");
        speak("Kael! Sinais vitais zerados! Entrando em modo de ressincronização de emergência...");
      } else {
        addLog(`💥 [DANO SOFRIDO]: Kael foi atingido! Vidas restantes: ${nextLives}/3`, "error");
      }
      return nextLives;
    });
  }, [addLog, currentChapterId, currentStep.id, speak]);

  const handleCommand = useCallback(
    async (cmd: string) => {
      if (cmd === "__HELP__") {
        addLog("> help", "info");
        addLog("help · clear · hint · conquistas · código C#", "system");
        unlockAchievement("helper");
        return;
      }

      if (cmd === "__HINT__") {
        addLog("> hint", "info");
        speak(
          currentStep.requiredCode
            ? `Dica: tente construir uma solução equivalente a ${currentStep.requiredCode}`
            : "Nenhuma tarefa de código está pendente agora."
        );
        return;
      }

      if (["conquistas", "achievements"].includes(cmd.toLowerCase())) {
        setShowAchievementPanel(true);
        return;
      }

      addLog(`> ${cmd}`, "info");
      setAuraState("thinking");
      setIsTyping(true);
      unlockAchievement("first_command");

      try {
        const data = await runCode({
          code: cmd,
          sessionId: sessionIdRef.current,
          challengeId: currentStep.id,
        });

        data.logs.forEach((line) => addLog(line, data.success ? "system" : "error"));

        if (!data.success) {
          setConsecutiveSuccesses(0);
          setAuraState("error");
          flash("red");
          registerCombatDamage();
          const hint = getAuraErrorHint(data.logs.join(" "));
          if (hint) scheduler.schedule(() => speak(`💡 ${hint}`), 500);
          if (data.logs.some((line) => line.includes("SEGURANÇA"))) unlockAchievement("hacker");
          return;
        }

        if (!data.challengePassed) {
          setConsecutiveSuccesses(0);
          flash("red");
          registerCombatDamage();
          addLog(data.feedback ?? "O código é válido, mas ainda não resolve a tarefa atual.", "warning");
          return;
        }

        addLog(`✓ ${data.feedback ?? "Desafio concluído."}`, "success");
        const newSuccesses = consecutiveSuccesses + 1;
        setConsecutiveSuccesses(newSuccesses);
        if (newSuccesses >= 3) unlockAchievement("no_errors");
        if (currentStep.achievementId) unlockAchievement(currentStep.achievementId);

        if (currentStep.onSuccess) {
          currentStep.onSuccess({ updateEnergy });
          flash("amber");
        }

        let nextId = currentStep.nextStepId;
        if (currentStep.choices && data.choiceValue) {
          const choice = currentStep.choices[data.choiceValue - 1];
          if (!choice) {
            addLog("Escolha fora das opções disponíveis.", "warning");
            return;
          }
          nextId = choice.nextStepId;
          addLog(`Escolha registrada: Opção ${data.choiceValue}`, "success");
        }

        advanceAfterSuccess(nextId);
      } catch (error) {
        setConsecutiveSuccesses(0);
        setAuraState("error");
        flash("red");
        registerCombatDamage();
        addLog(
          `[ERRO DE CONEXÃO]: ${error instanceof Error ? error.message : "API indisponível."}`,
          "error"
        );
      } finally {
        setIsTyping(false);
        scheduler.schedule(() => setAuraState("idle"), 500);
      }
    },
    [
      addLog,
      advanceAfterSuccess,
      consecutiveSuccesses,
      currentStep,
      flash,
      registerCombatDamage,
      scheduler,
      setConsecutiveSuccesses,
      speak,
      unlockAchievement,
      updateEnergy,
    ]
  );

  const handleClear = useCallback(() => {
    setLogs([createLog("Terminal limpo.", "system")]);
  }, []);

  useEffect(() => {
    if (!_hasHydrated) return;
    const savedStep = CHAPTER_1.steps[currentStepId];
    setIsResuming(Boolean(savedStep && currentStepId !== CHAPTER_1.initialStepId));

    const timer = scheduler.schedule(() => {
      setShowSplash(false);
      setGameStarted(true);
    }, 1_800);

    return () => clearTimeout(timer);
  }, [_hasHydrated, currentStepId, scheduler]);

  useEffect(() => {
    if (!gameStarted || !_hasHydrated) return;

    scheduler.clearAll();
    if (isResuming && CHAPTER_1.steps[currentStepId]) {
      addLog("RETOMANDO SISTEMAS DA NAVE...", "system");
      addLog(`ENERGIA ATUAL: ${energy}%`, "system");
      processedStepRef.current = null;
      scheduler.schedule(() => processStep(CHAPTER_1.steps[currentStepId]), 500);
      return;
    }

    addLog("INICIANDO SISTEMAS DA NAVE...", "system");
    processedStepRef.current = null;
    scheduler.schedule(() => processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]), 500);
    // O início depende somente da transição para gameStarted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  const startNewGame = useCallback(() => {
    resetChapter();
    setChapter("chapter-1");
    setStep("step-1");
    setLives(3);
    setIsGameOver(false);
    scheduler.clearAll();
    processedStepRef.current = null;
    setCurrentStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    setAuraState("idle");
    setLogs([
      createLog("════════════════════════════", "system"),
      createLog("▶ INICIANDO SISTEMAS DA NAVE...", "system"),
      createLog("════════════════════════════", "system"),
    ]);
    scheduler.schedule(() => processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]), 500);
  }, [processStep, resetChapter, scheduler, setChapter, setStep]);

  const resumeSavedGame = useCallback(() => {
    scheduler.clearAll();
    processedStepRef.current = null;
    const chapter = ALL_CHAPTERS[currentChapterId] ?? CHAPTER_1;
    const step = chapter.steps[currentStepId] ?? chapter.steps[chapter.initialStepId];
    setCurrentStep(step);
    setAuraState("idle");
    setLogs([
      createLog("════════════════════════════", "system"),
      createLog("⟳ RETOMANDO SISTEMAS DA NAVE...", "system"),
      createLog(`ENERGIA ATUAL: ${energy}%`, "system"),
      createLog("════════════════════════════", "system"),
    ]);
    scheduler.schedule(() => processStep(step), 500);
  }, [currentChapterId, currentStepId, energy, processStep, scheduler]);

  const openChest = useCallback(() => {
    setShowKatanaCinematic(true);
    if (inventory.some((item) => item.toLowerCase().includes("katana"))) {
      speak("Você inspeciona a Katana de Plasma Vermelha.");
      return;
    }
    addItem("Katana de Plasma Vermelha");
    unlockAchievement("katana_found");
    flash("red");
    addLog("📦 [ITEM OBTIDO]: Katana de Plasma Vermelha equipada com sucesso!", "success");
    speak("Incrível, Kael! Você encontrou a lendária Katana de Plasma Vermelha no baú. Agora temos poder de fogo para entrar no Deck 02!");

    // Se estiver no Capítulo 2 esperando pela Katana, avança para o primeiro duelo
    if (currentChapterId === "chapter-2" && (currentStepId === "ch2-step-1" || !currentStepId.startsWith("ch2-monster"))) {
      setStep("ch2-monster-1");
      processedStepRef.current = null;
      scheduler.schedule(() => processStep(CHAPTER_2.steps["ch2-monster-1"]), 800);
      return;
    }

    // Se estiver na missão de encontrar a Katana no Capítulo 1, finaliza o capítulo 1
    if (currentStepId === "step-find-katana" || currentStepId === "step-5") {
      setStep("step-end");
      processedStepRef.current = null;
      scheduler.schedule(() => processStep(CHAPTER_1.steps["step-end"]), 800);
    }
  }, [addItem, addLog, currentChapterId, currentStepId, flash, inventory, processStep, scheduler, setStep, speak, unlockAchievement]);

  const advanceToChapter2 = useCallback(() => {
    setChapter("chapter-2");
    setStep("ch2-step-1");
    unlockChapter("chapter-2");
    setLives(3);
    setIsGameOver(false);
    scheduler.clearAll();
    processedStepRef.current = null;
    setCurrentStep(CHAPTER_2.steps["ch2-step-1"]);
    setAuraState("idle");
    setLogs([
      createLog("════════════════════════════════════", "system"),
      createLog("▶ INGRESSANDO NO DECK 02: QUARENTENA", "system"),
      createLog("⚔️ SISTEMA DE COMBATE C# ATIVO (3 VIDAS)", "system"),
      createLog("════════════════════════════════════", "system"),
    ]);
    scheduler.schedule(() => processStep(CHAPTER_2.steps["ch2-step-1"]), 600);
    return true;
  }, [processStep, scheduler, setChapter, setStep, unlockChapter]);

  const selectChapter = useCallback(
    async (chapterId: string) => {
      await resetRemoteSession();
      const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;
      setChapter(chapterId);
      setStep(chapter.initialStepId);
      setLives(3);
      setIsGameOver(false);
      scheduler.clearAll();
      processedStepRef.current = null;
      const initialStep = chapter.steps[chapter.initialStepId];
      setCurrentStep(initialStep);
      setAuraState("idle");

      if (chapterId === "chapter-2") {
        unlockChapter("chapter-2");
        setLogs([
          createLog("════════════════════════════════════", "system"),
          createLog("▶ INGRESSANDO NO DECK 02: QUARENTENA", "system"),
          createLog("⚔️ SISTEMA DE COMBATE C# ATIVO (3 VIDAS)", "system"),
          createLog("════════════════════════════════════", "system"),
        ]);
      } else {
        setLogs([
          createLog("════════════════════════════════════", "system"),
          createLog(`▶ INGRESSANDO EM ${chapter.title.toUpperCase()}`, "system"),
          createLog("════════════════════════════════════", "system"),
        ]);
      }

      scheduler.schedule(() => processStep(initialStep), 500);
    },
    [processStep, resetRemoteSession, scheduler, setChapter, setStep, unlockChapter]
  );

  const restartAfterGameOver = useCallback(() => {
    setIsGameOver(false);
    setLives(3);
    resetChapter();
    setChapter("chapter-1");
    setStep("step-1");
    scheduler.clearAll();
    processedStepRef.current = null;
    setCurrentStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]);
    setAuraState("idle");
    setLogs([
      createLog("════════════════════════════════════", "system"),
      createLog("⟳ RESSINCRONIZANDO NO DECK 01: CORE", "system"),
      createLog("════════════════════════════════════", "system"),
    ]);
    scheduler.schedule(() => processStep(CHAPTER_1.steps[CHAPTER_1.initialStepId]), 600);
  }, [processStep, resetChapter, scheduler, setChapter, setStep]);

  return {
    energy,
    integrity,
    inventory,
    currentChapterId,
    currentStep,
    currentStepId,
    unlockedChapters,
    lives,
    isGameOver,
    showKatanaCinematic,
    setShowKatanaCinematic,
    unlockedAchievements,
    logs,
    auraState,
    isTyping,
    showSplash,
    setShowSplash,
    isResuming,
    popupAchievement,
    showAchievementPanel,
    alertFlash,
    setPopupAchievement,
    setShowAchievementPanel,
    handleCommand,
    handleClear,
    handleResetAll,
    handleResetChapter,
    startNewGame,
    resumeSavedGame,
    selectChapter,
    openChest,
    advanceToChapter2,
    restartAfterGameOver,
  };
}
