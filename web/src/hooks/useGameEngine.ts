"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ACHIEVEMENTS, Achievement } from "@/components/Achievements";
import { Log } from "@/components/Terminal";
import { CHAPTER_1, ChapterStep, getAuraErrorHint } from "@/lib/chapters";
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
    unlockedAchievements,
    consecutiveSuccesses,
    updateEnergy,
    setStep,
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
    CHAPTER_1.steps[CHAPTER_1.initialStepId]
  );
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
      const nextStep = CHAPTER_1.steps[nextId];
      if (!nextStep) return;

      processedStepRef.current = null;
      scheduler.schedule(() => processStep(nextStep), nextStep.id === "step-end" ? 1_500 : 800);
    },
    [processStep, scheduler]
  );

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
          const hint = getAuraErrorHint(data.logs.join(" "));
          if (hint) scheduler.schedule(() => speak(`💡 ${hint}`), 500);
          if (data.logs.some((line) => line.includes("SEGURANÇA"))) unlockAchievement("hacker");
          return;
        }

        if (!data.challengePassed) {
          setConsecutiveSuccesses(0);
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

  return {
    energy,
    integrity,
    inventory,
    currentChapterId,
    currentStep,
    unlockedAchievements,
    logs,
    auraState,
    isTyping,
    showSplash,
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
  };
}
