"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { ACHIEVEMENTS, Achievement } from "@/components/Achievements";
import { Log } from "@/components/Terminal";
import { ALL_CHAPTERS, CHAPTER_1, CHAPTER_2, ChapterStep, getAuraErrorHint } from "@/lib/chapters";
import { resetCodeSession, runCode } from "@/lib/api";
import { normalizeChallengeStatus, shouldRegisterCombatDamage } from "@/lib/gameRules";
import { resolveProgress, stepEffectKey } from "@/lib/gameProgress";
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
    codeSessionId,
    screenShakeEnabled,
    scanlinesEnabled,
    updateEnergy,
    addItem,
    setProgress,
    unlockChapter,
    setConsecutiveSuccesses,
    markStepEffectApplied,
    rotateCodeSessionId,
    setScreenShakeEnabled,
    setScanlinesEnabled,
    resetAll,
    resetChapter,
    _hasHydrated,
  } = store;

  const scheduler = useNarrativeScheduler();
  const processedStepRef = useRef<string | null>(null);

  const resolvedProgress = useMemo(
    () => resolveProgress(ALL_CHAPTERS, "chapter-1", currentChapterId, currentStepId),
    [currentChapterId, currentStepId]
  );
  const currentStep = resolvedProgress.step;

  const [logs, setLogs] = useState<Log[]>([]);
  const [lives, setLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showKatanaCinematic, setShowKatanaCinematic] = useState(false);
  const [auraState, setAuraState] = useState<AuraState>("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [popupAchievement, setPopupAchievement] = useState<Achievement | null>(null);
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);
  const [alertFlash, setAlertFlash] = useState<"red" | "amber" | "cyan" | null>(null);

  const addLog = useCallback((content: string, type: Log["type"] = "info") => {
    setLogs((previous) => [...previous, createLog(content, type)]);
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    const state = useGameStore.getState();
    if (state.unlockedAchievements.includes(id)) return;

    state.unlockAchievement(id);
    const achievement = ACHIEVEMENTS.find((candidate) => candidate.id === id);
    if (achievement) setPopupAchievement(achievement);
  }, []);

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

  const applyStepEffect = useCallback(
    (chapterId: string, step: ChapterStep) => {
      if (!step.onSuccess) return;

      const key = stepEffectKey(chapterId, step.id);
      const state = useGameStore.getState();
      if (state.appliedStepEffects.includes(key)) return;

      markStepEffectApplied(key);
      step.onSuccess({ updateEnergy });
      flash("amber");
    },
    [flash, markStepEffectApplied, updateEnergy]
  );

  const processStep = useCallback(
    (step: ChapterStep, chapterId: string) => {
      const processKey = `${chapterId}:${step.id}`;
      if (processedStepRef.current === processKey) return;

      processedStepRef.current = processKey;
      setProgress(chapterId, step.id);

      if (!step.requiredCode && !step.choices) {
        if (step.achievementId) unlockAchievement(step.achievementId);
        applyStepEffect(chapterId, step);
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
        if (step.autoAdvance && step.nextStepId) {
          scheduler.schedule(() => {
            const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;
            const nextStep = chapter.steps[step.nextStepId!];
            if (nextStep) {
              processedStepRef.current = null;
              processStep(nextStep, chapterId);
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
    [addLog, applyStepEffect, scheduler, setProgress, speak, unlockAchievement]
  );

  const startChapterSession = useCallback(
    (chapterId: string, stepId: string, initialLogs: Log[], delay = 500) => {
      const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;
      const step = chapter.steps[stepId] ?? chapter.steps[chapter.initialStepId];

      setProgress(chapterId, step.id);
      setLives(3);
      setIsGameOver(false);
      scheduler.clearAll();
      processedStepRef.current = null;
      setAuraState("idle");
      setLogs(initialLogs);
      scheduler.schedule(() => processStep(step, chapterId), delay);
    },
    [processStep, scheduler, setProgress]
  );

  const clearRemoteSession = useCallback(async () => {
    const oldSessionId = useGameStore.getState().codeSessionId;
    try {
      await resetCodeSession(oldSessionId);
    } catch {
      // A sessão expira no backend; falhar ao limpá-la não pode bloquear um reset local.
    }
  }, []);

  const handleResetAll = useCallback(async () => {
    await clearRemoteSession();
    resetAll();
    startChapterSession(
      "chapter-1",
      CHAPTER_1.initialStepId,
      [
        createLog("════════════════════════════", "system"),
        createLog("⟳ SISTEMAS REINICIALIZADOS", "system"),
        createLog("════════════════════════════", "system"),
      ],
      700
    );
  }, [clearRemoteSession, resetAll, startChapterSession]);

  const handleResetChapter = useCallback(async () => {
    const chapterId = resolvedProgress.chapterId;
    const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;

    await clearRemoteSession();
    resetChapter(chapterId, chapter.initialStepId);
    startChapterSession(
      chapterId,
      chapter.initialStepId,
      [
        createLog("════════════════════════════", "system"),
        createLog(`⟳ ${chapter.title.toUpperCase()} REINICIADO`, "system"),
        createLog("════════════════════════════", "system"),
      ],
      700
    );
  }, [clearRemoteSession, resetChapter, resolvedProgress.chapterId, startChapterSession]);

  const advanceAfterSuccess = useCallback(
    (nextId?: string) => {
      if (!nextId) return;
      const chapterId = resolvedProgress.chapterId;
      const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;
      const nextStep = chapter.steps[nextId];
      if (!nextStep) return;

      processedStepRef.current = null;
      scheduler.schedule(
        () => processStep(nextStep, chapterId),
        ["step-end", "ch2-end"].includes(nextStep.id) ? 1_500 : 800
      );
    },
    [processStep, resolvedProgress.chapterId, scheduler]
  );

  const registerCombatDamage = useCallback(() => {
    const isCombat = resolvedProgress.chapterId === "chapter-2" || currentStep.id.startsWith("ch2-");
    if (!isCombat) return;

    setLives((previous) => {
      const nextLives = Math.max(0, previous - 1);
      if (nextLives <= 0) {
        setIsGameOver(true);
        addLog("💥 [SINAL VITAL PERDIDO]: Kael sofreu dano fatal! Game Over.", "error");
        speak("Kael! Sinais vitais zerados! Entrando em modo de ressincronização de emergência...");
      } else {
        addLog(`💥 [DANO SOFRIDO]: Kael foi atingido! Vidas restantes: ${nextLives}/3`, "error");
      }
      return nextLives;
    });
  }, [addLog, currentStep.id, resolvedProgress.chapterId, speak]);

  const handleCommand = useCallback(
    async (cmd: string) => {
      if (isTyping) return;

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
          sessionId: codeSessionId,
          challengeId: currentStep.id,
        });

        const challengeStatus = normalizeChallengeStatus(data);
        data.logs.forEach((line) => addLog(line, data.success ? "system" : "error"));

        const isCombat = resolvedProgress.chapterId === "chapter-2" || currentStep.id.startsWith("ch2-");

        if (!data.success) {
          setConsecutiveSuccesses(0);
          setAuraState("error");
          flash("red");

          if (shouldRegisterCombatDamage({
            isCombat,
            evaluationSucceeded: false,
            challengeStatus,
          })) {
            registerCombatDamage();
          }

          const hint = getAuraErrorHint(data.logs.join(" "));
          if (hint) scheduler.schedule(() => speak(`💡 ${hint}`), 500);
          if (data.logs.some((line) => line.includes("SEGURANÇA"))) unlockAchievement("hacker");
          return;
        }

        if (challengeStatus === "progress") {
          flash("cyan");
          addLog(`↳ ${data.feedback ?? "Etapa intermediária concluída."}`, "system");
          return;
        }

        if (challengeStatus === "failed") {
          setConsecutiveSuccesses(0);
          flash("red");
          if (shouldRegisterCombatDamage({
            isCombat,
            evaluationSucceeded: true,
            challengeStatus,
          })) {
            registerCombatDamage();
          }
          addLog(data.feedback ?? "O código é válido, mas ainda não resolve a tarefa atual.", "warning");
          return;
        }

        addLog(`✓ ${data.feedback ?? "Desafio concluído."}`, "success");
        const newSuccesses = useGameStore.getState().consecutiveSuccesses + 1;
        setConsecutiveSuccesses(newSuccesses);
        if (newSuccesses >= 3) unlockAchievement("no_errors");
        if (currentStep.achievementId) unlockAchievement(currentStep.achievementId);

        applyStepEffect(resolvedProgress.chapterId, currentStep);

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
        setAuraState("error");
        flash("amber");
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
      applyStepEffect,
      codeSessionId,
      currentStep,
      flash,
      isTyping,
      registerCombatDamage,
      resolvedProgress.chapterId,
      scheduler,
      setConsecutiveSuccesses,
      speak,
      unlockAchievement,
    ]
  );

  const handleClear = useCallback(() => {
    setLogs([createLog("Terminal limpo.", "system")]);
  }, []);

  const startNewGame = useCallback(() => {
    const oldSessionId = useGameStore.getState().codeSessionId;
    void resetCodeSession(oldSessionId).catch(() => undefined);
    resetAll();
    startChapterSession(
      "chapter-1",
      CHAPTER_1.initialStepId,
      [
        createLog("════════════════════════════", "system"),
        createLog("▶ INICIANDO SISTEMAS DA NAVE...", "system"),
        createLog("════════════════════════════", "system"),
      ]
    );
  }, [resetAll, startChapterSession]);

  const resumeSavedGame = useCallback(() => {
    const state = useGameStore.getState();
    const resolved = resolveProgress(
      ALL_CHAPTERS,
      "chapter-1",
      state.currentChapterId,
      state.currentStepId
    );
    const chapter = ALL_CHAPTERS[resolved.chapterId] ?? CHAPTER_1;

    startChapterSession(
      resolved.chapterId,
      resolved.stepId,
      [
        createLog("════════════════════════════", "system"),
        createLog(`⟳ RETOMANDO ${chapter.title.toUpperCase()}...`, "system"),
        createLog(`ENERGIA ATUAL: ${state.energy}%`, "system"),
        createLog("════════════════════════════", "system"),
      ]
    );
  }, [startChapterSession]);

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

    if (resolvedProgress.chapterId === "chapter-2" &&
        (currentStepId === "ch2-step-1" || !currentStepId.startsWith("ch2-monster"))) {
      setProgress("chapter-2", "ch2-monster-1");
      processedStepRef.current = null;
      scheduler.schedule(() => processStep(CHAPTER_2.steps["ch2-monster-1"], "chapter-2"), 800);
      return;
    }

    if (currentStepId === "step-find-katana" || currentStepId === "step-5") {
      setProgress("chapter-1", "step-end");
      processedStepRef.current = null;
      scheduler.schedule(() => processStep(CHAPTER_1.steps["step-end"], "chapter-1"), 800);
    }
  }, [
    addItem,
    addLog,
    currentStepId,
    flash,
    inventory,
    processStep,
    resolvedProgress.chapterId,
    scheduler,
    setProgress,
    speak,
    unlockAchievement,
  ]);

  const advanceToChapter2 = useCallback(() => {
    unlockChapter("chapter-2");
    startChapterSession(
      "chapter-2",
      CHAPTER_2.initialStepId,
      [
        createLog("════════════════════════════════════", "system"),
        createLog("▶ INGRESSANDO NO DECK 02: QUARENTENA", "system"),
        createLog("⚔️ SISTEMA DE COMBATE C# ATIVO (3 VIDAS)", "system"),
        createLog("════════════════════════════════════", "system"),
      ],
      600
    );
    return true;
  }, [startChapterSession, unlockChapter]);

  const selectChapter = useCallback(
    async (chapterId: string) => {
      await clearRemoteSession();
      rotateCodeSessionId();

      const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;
      if (chapterId === "chapter-2") unlockChapter("chapter-2");

      startChapterSession(
        chapterId,
        chapter.initialStepId,
        chapterId === "chapter-2"
          ? [
              createLog("════════════════════════════════════", "system"),
              createLog("▶ INGRESSANDO NO DECK 02: QUARENTENA", "system"),
              createLog("⚔️ SISTEMA DE COMBATE C# ATIVO (3 VIDAS)", "system"),
              createLog("════════════════════════════════════", "system"),
            ]
          : [
              createLog("════════════════════════════════════", "system"),
              createLog(`▶ INGRESSANDO EM ${chapter.title.toUpperCase()}`, "system"),
              createLog("════════════════════════════════════", "system"),
            ]
      );
    },
    [clearRemoteSession, rotateCodeSessionId, startChapterSession, unlockChapter]
  );

  const restartAfterGameOver = useCallback(() => {
    const chapterId = resolvedProgress.chapterId;
    const chapter = ALL_CHAPTERS[chapterId] ?? CHAPTER_1;
    const oldSessionId = useGameStore.getState().codeSessionId;
    void resetCodeSession(oldSessionId).catch(() => undefined);

    resetChapter(chapterId, chapter.initialStepId);
    startChapterSession(
      chapterId,
      chapter.initialStepId,
      [
        createLog("════════════════════════════════════", "system"),
        createLog(`⟳ RESSINCRONIZANDO EM ${chapter.title.toUpperCase()}`, "system"),
        createLog("════════════════════════════════════", "system"),
      ],
      600
    );
  }, [resetChapter, resolvedProgress.chapterId, startChapterSession]);

  return {
    energy,
    integrity,
    inventory,
    currentChapterId: resolvedProgress.chapterId,
    currentStep,
    currentStepId: resolvedProgress.stepId,
    unlockedChapters,
    lives,
    isGameOver,
    showKatanaCinematic,
    setShowKatanaCinematic,
    unlockedAchievements,
    logs,
    auraState,
    isTyping,
    popupAchievement,
    showAchievementPanel,
    alertFlash,
    screenShakeEnabled,
    scanlinesEnabled,
    _hasHydrated,
    setScreenShakeEnabled,
    setScanlinesEnabled,
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
