import { create } from "zustand";
import { persist } from "zustand/middleware";

function createSessionId(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  const suffix = Date.now().toString(16).padStart(12, "0").slice(-12);
  return `00000000-0000-4000-8000-${suffix}`;
}

interface ProgressState {
  energy: number;
  integrity: number;
  inventory: string[];
  currentChapterId: string;
  currentStepId: string;
  unlockedChapters: string[];
  unlockedAchievements: string[];
  consecutiveSuccesses: number;
  codeSessionId: string;
  appliedStepEffects: string[];
}

function createInitialProgress(): ProgressState {
  return {
    energy: 100,
    integrity: 100,
    inventory: [],
    currentChapterId: "chapter-1",
    currentStepId: "step-1",
    unlockedChapters: ["chapter-1"],
    unlockedAchievements: [],
    consecutiveSuccesses: 0,
    codeSessionId: createSessionId(),
    appliedStepEffects: [],
  };
}

export interface GameState extends ProgressState {
  screenShakeEnabled: boolean;
  scanlinesEnabled: boolean;
  updateEnergy: (amount: number) => void;
  addItem: (item: string) => void;
  setProgress: (chapterId: string, stepId: string) => void;
  unlockChapter: (chapterId: string) => void;
  unlockAchievement: (id: string) => void;
  setConsecutiveSuccesses: (n: number) => void;
  markStepEffectApplied: (key: string) => void;
  rotateCodeSessionId: () => void;
  setScreenShakeEnabled: (enabled: boolean) => void;
  setScanlinesEnabled: (enabled: boolean) => void;
  resetAll: () => void;
  resetChapter: (chapterId: string, initialStepId: string) => void;
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      ...createInitialProgress(),
      screenShakeEnabled: true,
      scanlinesEnabled: true,
      _hasHydrated: false,

      updateEnergy: (amount) =>
        set((state) => ({
          energy: Math.max(0, Math.min(100, state.energy + amount)),
        })),

      addItem: (item) =>
        set((state) => ({
          inventory: state.inventory.includes(item) ? state.inventory : [...state.inventory, item],
        })),

      setProgress: (chapterId, stepId) =>
        set({ currentChapterId: chapterId, currentStepId: stepId }),

      unlockChapter: (id) =>
        set((state) => ({
          unlockedChapters: state.unlockedChapters.includes(id)
            ? state.unlockedChapters
            : [...state.unlockedChapters, id],
        })),

      unlockAchievement: (id) =>
        set((state) => ({
          unlockedAchievements: state.unlockedAchievements.includes(id)
            ? state.unlockedAchievements
            : [...state.unlockedAchievements, id],
        })),

      setConsecutiveSuccesses: (n) => set({ consecutiveSuccesses: n }),

      markStepEffectApplied: (key) =>
        set((state) => ({
          appliedStepEffects: state.appliedStepEffects.includes(key)
            ? state.appliedStepEffects
            : [...state.appliedStepEffects, key],
        })),

      rotateCodeSessionId: () => set({ codeSessionId: createSessionId() }),
      setScreenShakeEnabled: (enabled) => set({ screenShakeEnabled: enabled }),
      setScanlinesEnabled: (enabled) => set({ scanlinesEnabled: enabled }),

      resetAll: () =>
        set((state) => ({
          ...createInitialProgress(),
          screenShakeEnabled: state.screenShakeEnabled,
          scanlinesEnabled: state.scanlinesEnabled,
        })),

      resetChapter: (chapterId, initialStepId) =>
        set((state) => ({
          energy: 100,
          integrity: 100,
          currentChapterId: chapterId,
          currentStepId: initialStepId,
          consecutiveSuccesses: 0,
          codeSessionId: createSessionId(),
          appliedStepEffects: state.appliedStepEffects.filter(
            (key) => !key.startsWith(`${chapterId}:`)
          ),
        })),

      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: "auracs-save",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
